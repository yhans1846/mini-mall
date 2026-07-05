// src/app/api/admin/dashboard/route.ts — 仪表盘统计数据（合并查询优化）
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/utils";

export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 });

  // 时间边界
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);
  const paidStatuses: string[] = ["PAID", "SHIPPED", "COMPLETED"];

  // 并行查询 — 合并同类查询减少数据库往返
  const [
    totalProducts,
    totalOrders,
    revenueResult,
    totalUsers,
    pendingOrders,
    statusCounts,
    recentOrders,
    topRaw,
    lowStockProducts,
    recentUsers,
    // 一次性查今日 + 本月的支付订单
    paidOrdersToday,
    paidOrdersMonth,
    // 近 7 天支付订单
    paidOrdersWeek,
    // 本月全部支付订单（用于月度趋势）
    monthPaidOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: { in: paidStatuses } }, _sum: { totalAmount: true } }),
    prisma.mallUser.count(),

    // 待处理订单
    prisma.order.count({ where: { status: "PENDING" } }),

    // 各状态订单数
    Promise.all(
      ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"].map((s) =>
        prisma.order.count({ where: { status: s } }).then((c) => ({ status: s, count: c }))
      )
    ),

    // 最近 5 条订单
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true } },
        items: { select: { quantity: true, price: true } },
      },
    }),

    // Top 5 热销商品
    prisma.$queryRawUnsafe<Array<{ name: string; qty: number; rev: number }>>(
      `SELECT p.name, SUM(oi.quantity) as qty, SUM(oi.price * oi.quantity) as rev
       FROM OrderItem oi JOIN Product p ON p.id = oi.productId
       JOIN "Order" o ON o.id = oi.orderId
       WHERE o.status IN ('PAID','SHIPPED','COMPLETED')
       GROUP BY oi.productId ORDER BY qty DESC LIMIT 5`
    ),

    // 库存预警（< 10）
    prisma.product.findMany({
      where: { stock: { lt: 10 }, isPublished: true },
      select: { name: true, stock: true },
      orderBy: { stock: "asc" },
      take: 10,
    }),

    // 最近注册用户
    prisma.mallUser.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    }),

    // 今日支付订单（合并 todayOrders + todayRevenue）
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart }, status: { in: paidStatuses } },
      select: { totalAmount: true },
    }),

    // 本月支付订单（合并 monthRevenue）
    prisma.order.findMany({
      where: { createdAt: { gte: monthStart }, status: { in: paidStatuses } },
      select: { totalAmount: true },
    }),

    // 近 7 天每日销售额
    prisma.order.findMany({
      where: { createdAt: { gte: weekAgo }, status: { in: paidStatuses } },
      select: { totalAmount: true, createdAt: true },
    }),

    // 本月每一天销售额
    prisma.order.findMany({
      where: { createdAt: { gte: monthStart }, status: { in: paidStatuses } },
      select: { totalAmount: true, createdAt: true },
    }),
  ]);

  // 今日订单/收入
  const todayOrders = paidOrdersToday.length;
  const todayRevenue = paidOrdersToday.reduce((s, o) => s + o.totalAmount, 0);

  // 本月销售额
  const monthRevenue = paidOrdersMonth.reduce((s, o) => s + o.totalAmount, 0);

  // 聚合近 7 天每日销售额
  const dayMap: Record<string, number> = {};
  for (const o of paidOrdersWeek) {
    const d = o.createdAt.toISOString().slice(0, 10);
    dayMap[d] = (dayMap[d] || 0) + o.totalAmount;
  }
  const dailyRevenue: { date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyRevenue.push({ date: key, amount: dayMap[key] || 0 });
  }

  // 聚合本月每天销售额
  const monthDayMap: Record<string, number> = {};
  for (const o of monthPaidOrders) {
    const d = o.createdAt.toISOString().slice(0, 10);
    monthDayMap[d] = (monthDayMap[d] || 0) + o.totalAmount;
  }
  const monthlyDailyRevenue: { date: string; amount: number }[] = [];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let i = 0; i < daysInMonth; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
    const key = d.toISOString().slice(0, 10);
    monthlyDailyRevenue.push({ date: key, amount: monthDayMap[key] || 0 });
  }

  return NextResponse.json({
    products: totalProducts,
    orders: totalOrders,
    revenue: revenueResult._sum.totalAmount || 0,
    users: totalUsers,
    todayOrders,
    todayRevenue,
    monthRevenue,
    pendingOrders,
    orderStatusDistribution: statusCounts,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      status: o.status,
      totalAmount: o.totalAmount,
      userName: o.user.name,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      createdAt: o.createdAt,
    })),
    topProducts: topRaw.map((r) => ({ name: r.name, qty: Number(r.qty), rev: Number(r.rev) })),
    lowStockProducts: lowStockProducts.map((p) => ({ name: p.name, stock: p.stock })),
    recentUsers,
    dailyRevenue,
    monthlyDailyRevenue,
  });
}

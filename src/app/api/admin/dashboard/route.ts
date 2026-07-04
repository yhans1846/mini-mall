// src/app/api/admin/dashboard/route.ts — 仪表盘统计数据
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id as string, 10) } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "无权限" }, { status: 403 });

  // 当日零点
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 当月第一天零点
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  // 7 天前
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const paidStatuses: string[] = ["PAID", "SHIPPED", "COMPLETED"];

  const [
    totalProducts,
    totalOrders,
    revenueResult,
    totalUsers,
    todayOrders,
    todayRevenueResult,
    monthRevenueResult,
    pendingOrders,
    statusCounts,
    recentOrders,
    topRaw,
    lowStockProducts,
    recentUsers,
    dailyOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: { in: paidStatuses } }, _sum: { totalAmount: true } }),
    prisma.user.count(),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: todayStart }, status: { in: paidStatuses } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: monthStart }, status: { in: paidStatuses } },
      _sum: { totalAmount: true },
    }),
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
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    }),
    // 最近 7 天每日销售额
    prisma.order.findMany({
      where: { createdAt: { gte: weekAgo }, status: { in: paidStatuses } },
      select: { totalAmount: true, createdAt: true },
    }),
  ]);

  // 聚合每日销售额
  const dayMap: Record<string, number> = {};
  for (const o of dailyOrders) {
    const d = o.createdAt.toISOString().slice(0, 10);
    dayMap[d] = (dayMap[d] || 0) + o.totalAmount;
  }
  const dailyRevenue: { date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyRevenue.push({ date: key, amount: dayMap[key] || 0 });
  }

  // 统计本月每天销售额（用于月度趋势）
  const monthOrders = await prisma.order.findMany({
    where: { createdAt: { gte: monthStart }, status: { in: paidStatuses } },
    select: { totalAmount: true, createdAt: true },
  });
  const monthDayMap: Record<string, number> = {};
  for (const o of monthOrders) {
    const d = o.createdAt.toISOString().slice(0, 10);
    monthDayMap[d] = (monthDayMap[d] || 0) + o.totalAmount;
  }
  const monthlyDailyRevenue: { date: string; amount: number }[] = [];
  const now = new Date();
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
    todayRevenue: todayRevenueResult._sum.totalAmount || 0,
    monthRevenue: monthRevenueResult._sum.totalAmount || 0,
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

// src/app/api/admin/statistics/sales/route.ts — 销售统计 API
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/utils";

export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const paidStatuses = ["PAID", "SHIPPED", "COMPLETED"];

  const [monthlySales, yearlySales, totalRevenue, dailyStats] = await Promise.all([
    prisma.order.aggregate({ where: { status: { in: paidStatuses }, createdAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({ where: { status: { in: paidStatuses }, createdAt: { gte: yearStart } }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({ where: { status: { in: paidStatuses } }, _sum: { totalAmount: true } }),
    // 当月每日销售额
    prisma.order.findMany({
      where: { status: { in: paidStatuses }, createdAt: { gte: monthStart } },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // 按日聚合
  const dailyMap = new Map<string, number>();
  dailyStats.forEach((o) => {
    const date = o.createdAt.toISOString().slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) || 0) + o.totalAmount);
  });

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    return { date, amount: dailyMap.get(date) || 0 };
  });

  return NextResponse.json({
    monthlySales: monthlySales._sum.totalAmount || 0,
    yearlySales: yearlySales._sum.totalAmount || 0,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    dailyRevenue,
    orderCount: dailyStats.length,
  });
}

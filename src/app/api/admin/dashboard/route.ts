// src/app/api/admin/dashboard/route.ts — 仪表盘统计数据
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id as string, 10) } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "无权限" }, { status: 403 });

  const [products, orders, revenueResult] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } }, _sum: { totalAmount: true } }),
  ]);

  return NextResponse.json({
    products,
    orders,
    revenue: revenueResult._sum.totalAmount || 0,
  });
}

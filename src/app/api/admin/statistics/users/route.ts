// src/app/api/admin/statistics/users/route.ts — 用户统计 API
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/utils";

export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const [totalUsers, levelDistribution, totalSpent, monthlyNewUsers] = await Promise.all([
    prisma.mallUser.count(),
    // 各等级用户数
    Promise.all([0, 1, 2, 3].map((level) =>
      prisma.mallUser.count({ where: { membershipLevel: level } }).then((c) => ({ level, count: c }))
    )),
    prisma.mallUser.aggregate({ _sum: { totalSpent: true } }),
    // 本月新增用户
    prisma.mallUser.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    levelDistribution,
    totalSpent: totalSpent._sum.totalSpent || 0,
    monthlyNewUsers,
  });
}

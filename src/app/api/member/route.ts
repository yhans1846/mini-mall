// src/app/api/member/route.ts — 会员信息 API
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP_TIERS } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);

  const user = await prisma.mallUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      membershipLevel: true,
      totalSpent: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const currentTier = MEMBERSHIP_TIERS[user.membershipLevel];
  const nextTier = MEMBERSHIP_TIERS[user.membershipLevel + 1];

  return NextResponse.json({
    ...user,
    currentTier: {
      level: currentTier.level,
      name: currentTier.name,
      discountRate: currentTier.discountRate,
    },
    nextTier: nextTier
      ? {
          level: nextTier.level,
          name: nextTier.name,
          threshold: nextTier.threshold,
          discountRate: nextTier.discountRate,
          remaining: Math.max(0, nextTier.threshold - user.totalSpent),
          progress: Math.min(100, Math.round((user.totalSpent / nextTier.threshold) * 100)),
        }
      : null,
  });
}

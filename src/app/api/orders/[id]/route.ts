// src/app/api/orders/[id]/route.ts — 订单详情（GET）+ 模拟支付（PUT）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcMembershipLevel, getDiscountRate } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

/** 获取订单详情 */
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "无效的订单 ID" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });

  if (!order || order.userId !== userId) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json(order);
}

/** 模拟支付：PENDING → PAID，更新累计消费和会员等级 */
export async function PUT(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);
  const { id } = await params;
  const orderId = parseInt(id, 10);

  // 验证订单归属和状态
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order || order.userId !== userId) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "当前订单状态不支持支付" }, { status: 400 });
  }

  // 事务：更新订单状态 → 增加累计消费 → 重新计算等级
  const updated = await prisma.$transaction(async (tx) => {
    // 1. 更新订单状态为 PAID
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });

    // 2. 更新用户累计消费
    const user = await tx.user.update({
      where: { id: userId },
      data: { totalSpent: { increment: order.totalAmount } },
    });

    // 3. 重新计算会员等级（只升不降）
    const newLevel = calcMembershipLevel(user.totalSpent);
    if (newLevel > user.membershipLevel) {
      await tx.user.update({
        where: { id: userId },
        data: { membershipLevel: newLevel },
      });
    }

    return updatedOrder;
  });

  return NextResponse.json(updated);
}

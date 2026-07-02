// src/app/api/orders/route.ts — 订单 API（POST 创建 + GET 列表）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDiscountRate } from "@/lib/utils";

/** 获取当前用户订单列表 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: { select: { name: true, imageUrl: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

/** 从购物车创建订单 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);

  let body: { address?: string; phone?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求数据格式错误" }, { status: 400 });
  }

  if (!body.address || !body.phone) {
    return NextResponse.json({ error: "请填写收货地址和电话" }, { status: 400 });
  }

  // 获取用户信息（含当前等级）
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // 获取购物车商品
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "购物车为空" }, { status: 400 });
  }

  // 检查库存
  for (const item of cartItems) {
    if (item.quantity > item.product.stock) {
      return NextResponse.json(
        {
          error: `"${item.product.name}" 库存不足，当前库存 ${item.product.stock} 件`,
        },
        { status: 400 }
      );
    }
  }

  // 计算金额
  const originalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discountRate = getDiscountRate(user.membershipLevel);
  const totalAmount = Math.round(originalAmount * discountRate * 100) / 100;

  // 事务：创建订单 → 扣库存 → 清空购物车
  const order = await prisma.$transaction(async (tx) => {
    // 1. 创建订单
    const order = await tx.order.create({
      data: {
        userId,
        status: "PENDING",
        originalAmount,
        discountRate,
        totalAmount,
        address: body.address,
        phone: body.phone,
        note: body.note || "",
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    // 2. 扣减库存
    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 3. 清空购物车
    await tx.cartItem.deleteMany({ where: { userId } });

    return order;
  });

  return NextResponse.json(order, { status: 201 });
}

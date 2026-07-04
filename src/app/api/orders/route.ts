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
  const user = await prisma.mallUser.findUnique({ where: { id: userId } });
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

  // 获取当前秒杀活动
  const now = new Date();
  const productIds = cartItems.map((item) => item.productId);
  const flashSales = await prisma.flashSale.findMany({
    where: {
      productId: { in: productIds },
      isActive: true,
      startTime: { lte: now },
      endTime: { gt: now },
    },
  });
  const flashSaleMap = new Map(flashSales.map((fs) => [fs.productId, fs]));

  // 检查库存（秒杀商品检查秒杀库存，普通商品检查普通库存）
  for (const item of cartItems) {
    const fs = flashSaleMap.get(item.productId);
    if (fs) {
      if (item.quantity > fs.flashStock) {
        return NextResponse.json(
          {
            error: `"${item.product.name}" 秒杀库存不足，当前剩余 ${fs.flashStock} 件`,
          },
          { status: 400 }
        );
      }
    } else {
      if (item.quantity > item.product.stock) {
        return NextResponse.json(
          {
            error: `"${item.product.name}" 库存不足，当前库存 ${item.product.stock} 件`,
          },
          { status: 400 }
        );
      }
    }
  }

  // 计算金额（秒杀商品使用秒杀价）
  const originalAmount = cartItems.reduce(
    (sum, item) => {
      const fs = flashSaleMap.get(item.productId);
      const price = fs ? fs.flashPrice : item.product.price;
      return sum + price * item.quantity;
    },
    0
  );
  const discountRate = getDiscountRate(user.membershipLevel);
  const totalAmount = Math.round(originalAmount * discountRate * 100) / 100;

  // 事务：创建订单 → 扣库存（秒杀扣秒杀库存）→ 清空购物车
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
          create: cartItems.map((item) => {
            const fs = flashSaleMap.get(item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: fs ? fs.flashPrice : item.product.price,
            };
          }),
        },
      },
    });

    // 2. 扣减库存
    for (const item of cartItems) {
      const fs = flashSaleMap.get(item.productId);
      if (fs) {
        // 秒杀商品：扣秒杀库存，不扣普通库存
        await tx.flashSale.update({
          where: { id: fs.id },
          data: { flashStock: { decrement: item.quantity } },
        });
      } else {
        // 普通商品：扣普通库存
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // 3. 清空购物车
    await tx.cartItem.deleteMany({ where: { userId } });

    return order;
  });

  return NextResponse.json(order, { status: 201 });
}

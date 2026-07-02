// src/app/api/cart/route.ts — 购物车 API（GET 列表 + POST 添加）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** 获取当前用户的购物车 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);

  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

/** 添加到购物车 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);

  let body: { productId?: number; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求数据格式错误" }, { status: 400 });
  }

  const { productId, quantity = 1 } = body;

  if (!productId || typeof productId !== "number") {
    return NextResponse.json({ error: "缺少商品 ID" }, { status: 400 });
  }

  if (quantity < 1) {
    return NextResponse.json({ error: "数量至少为 1" }, { status: 400 });
  }

  // 查询商品是否存在及库存
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isPublished) {
    return NextResponse.json({ error: "商品不存在或已下架" }, { status: 404 });
  }

  // 检查购物车是否已有该商品
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  const newQuantity = existing ? existing.quantity + quantity : quantity;

  if (newQuantity > product.stock) {
    return NextResponse.json(
      { error: `库存不足，当前库存 ${product.stock} 件` },
      { status: 400 }
    );
  }

  // upsert：有则更新数量，无则创建
  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity: newQuantity },
    create: { userId, productId, quantity },
  });

  return NextResponse.json(item, { status: existing ? 200 : 201 });
}

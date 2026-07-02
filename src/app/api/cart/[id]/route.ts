// src/app/api/cart/[id]/route.ts — 购物车单项操作（PUT 修改数量 + DELETE 删除）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

/** 修改购物车项数量 */
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);
  const { id } = await params;
  const itemId = parseInt(id, 10);

  let body: { quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求数据格式错误" }, { status: 400 });
  }

  const { quantity } = body;

  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "数量至少为 1" }, { status: 400 });
  }

  // 验证商品归属
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });

  if (!item || item.userId !== userId) {
    return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
  }

  // 检查库存
  if (quantity > item.product.stock) {
    return NextResponse.json(
      { error: `库存不足，当前库存 ${item.product.stock} 件` },
      { status: 400 }
    );
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return NextResponse.json(updated);
}

/** 删除购物车项 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id as string, 10);
  const { id } = await params;
  const itemId = parseInt(id, 10);

  // 验证商品归属
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.userId !== userId) {
    return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  return NextResponse.json({ message: "已删除" });
}

// src/app/api/admin/products/[id]/route.ts — 更新/删除商品
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params { params: Promise<{ id: string }> }

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.adminUser.findUnique({ where: { id: parseInt(session.user.id as string, 10) } });
  return !!user;
}

/** 更新商品 */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.price !== undefined) data.price = parseFloat(body.price);
  if (body.stock !== undefined) data.stock = parseInt(body.stock, 10);
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.categoryId !== undefined) data.categoryId = parseInt(body.categoryId, 10);
  if (body.isPublished !== undefined) data.isPublished = body.isPublished;

  const product = await prisma.product.update({ where: { id: productId }, data });
  return NextResponse.json(product);
}

/** 删除商品 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.product.delete({ where: { id: parseInt(id, 10) } });
  return NextResponse.json({ message: "已删除" });
}

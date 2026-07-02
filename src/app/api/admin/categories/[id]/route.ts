// src/app/api/admin/categories/[id]/route.ts — 更新/删除分类
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params { params: Promise<{ id: string }> }

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id as string, 10) } });
  return user?.role === "ADMIN";
}

/** 更新分类 */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, string> = {};
  if (body.name) data.name = body.name;
  if (body.slug) data.slug = body.slug;

  const category = await prisma.category.update({
    where: { id: parseInt(id, 10) },
    data,
  });

  return NextResponse.json(category);
}

/** 删除分类 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;

  // 检查分类下是否有商品
  const count = await prisma.product.count({ where: { categoryId: parseInt(id, 10) } });
  if (count > 0) {
    return NextResponse.json({ error: `该分类下有 ${count} 件商品，无法删除` }, { status: 400 });
  }

  await prisma.category.delete({ where: { id: parseInt(id, 10) } });
  return NextResponse.json({ message: "已删除" });
}

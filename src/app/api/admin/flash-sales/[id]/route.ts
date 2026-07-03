// src/app/api/admin/flash-sales/[id]/route.ts — 秒杀活动详情/编辑/删除
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id as string, 10) },
  });
  return user?.role === "ADMIN";
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const flashSaleId = parseInt(id, 10);
    if (isNaN(flashSaleId)) {
      return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
    }

    const body = await request.json();
    const { flashPrice, flashStock, startTime, endTime, isActive } = body;

    const existing = await prisma.flashSale.findUnique({ where: { id: flashSaleId } });
    if (!existing) {
      return NextResponse.json({ error: "秒杀活动不存在" }, { status: 404 });
    }

    const flashSale = await prisma.flashSale.update({
      where: { id: flashSaleId },
      data: {
        ...(flashPrice !== undefined && { flashPrice: parseFloat(flashPrice) }),
        ...(flashStock !== undefined && { flashStock: parseInt(flashStock, 10) }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, price: true } },
      },
    });

    return NextResponse.json(flashSale);
  } catch {
    return NextResponse.json({ error: "更新秒杀活动失败" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const flashSaleId = parseInt(id, 10);
    if (isNaN(flashSaleId)) {
      return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
    }

    const existing = await prisma.flashSale.findUnique({ where: { id: flashSaleId } });
    if (!existing) {
      return NextResponse.json({ error: "秒杀活动不存在" }, { status: 404 });
    }

    await prisma.flashSale.delete({ where: { id: flashSaleId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除秒杀活动失败" }, { status: 500 });
  }
}

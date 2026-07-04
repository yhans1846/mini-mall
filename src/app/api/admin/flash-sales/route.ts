// src/app/api/admin/flash-sales/route.ts — 后台秒杀活动管理（列表 + 创建）
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.adminUser.findUnique({
    where: { id: parseInt(session.user.id as string, 10) },
  });
  return !!user;
}

export async function GET(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const [total, flashSales] = await Promise.all([
      prisma.flashSale.count(),
      prisma.flashSale.findMany({
        include: {
          product: { select: { id: true, name: true, imageUrl: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      flashSales,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return NextResponse.json({ error: "获取秒杀列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { productId, flashPrice, flashStock, startTime, endTime } = body;

    if (!productId || flashPrice === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    // 检查商品存在
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }

    const flashSale = await prisma.flashSale.create({
      data: {
        productId: parseInt(productId, 10),
        flashPrice: parseFloat(flashPrice),
        flashStock: parseInt(flashStock || "0", 10),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isActive: true,
      },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, price: true } },
      },
    });

    return NextResponse.json(flashSale, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建秒杀活动失败" }, { status: 500 });
  }
}

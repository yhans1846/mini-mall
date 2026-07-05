// src/app/api/admin/flash-sales/route.ts — 后台秒杀活动管理（分页 + 搜索 + 状态筛选）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/utils";

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || ""; // active/inactive/upcoming/ended

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.product = { name: { contains: search } };
    }

    // 状态筛选
    const now = new Date();
    if (status === "active") {
      where.isActive = true;
      where.startTime = { lte: now };
      where.endTime = { gt: now };
    } else if (status === "inactive") {
      where.isActive = false;
    } else if (status === "upcoming") {
      where.isActive = true;
      where.startTime = { gt: now };
    } else if (status === "ended") {
      where.isActive = true;
      where.endTime = { lte: now };
    }

    const [total, flashSales] = await Promise.all([
      prisma.flashSale.count({ where }),
      prisma.flashSale.findMany({
        where,
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
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { productId, flashPrice, flashStock, startTime, endTime } = body;

    if (!productId || flashPrice === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

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

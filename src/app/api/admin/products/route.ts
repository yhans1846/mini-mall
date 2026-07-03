// src/app/api/admin/products/route.ts — 后台商品管理 API
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id as string, 10) } });
  return user?.role === "ADMIN";
}

/** 获取所有商品（含未发布） */
export async function GET(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const status = searchParams.get("status") || ""; // published | unpublished
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = 20;

  // 构建筛选条件
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (categoryId) {
    where.categoryId = parseInt(categoryId, 10);
  }
  if (status === "published") {
    where.isPublished = true;
  } else if (status === "unpublished") {
    where.isPublished = false;
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ products, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

/** 创建商品 */
export async function POST(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, price, stock, imageUrl, categoryId, isPublished } = body;

  if (!name || price === undefined || !categoryId) {
    return NextResponse.json({ error: "名称、价格、分类为必填" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description || "",
      price: parseFloat(price),
      stock: stock ? parseInt(stock, 10) : 0,
      imageUrl: imageUrl || "",
      categoryId: parseInt(categoryId, 10),
      isPublished: isPublished !== false,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

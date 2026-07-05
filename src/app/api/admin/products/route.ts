// src/app/api/admin/products/route.ts — 后台商品管理 API
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.adminUser.findUnique({ where: { id: parseInt(session.user.id as string, 10) } });
  return !!user;
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
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));

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
  const { name, description, price, stock, imageUrl, categoryId, isPublished,
    brand, subtitle, images, specs, tags, videoUrl, origin, weight } = body;

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
      brand: brand || "",
      subtitle: subtitle || "",
      images: images ? JSON.stringify(images) : "[]",
      specs: specs ? JSON.stringify(specs) : "[]",
      tags: tags ? JSON.stringify(tags) : "[]",
      videoUrl: videoUrl || "",
      origin: origin || "",
      weight: weight !== undefined && weight !== "" ? parseFloat(weight) : null,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

/** 批量操作（上架/下架/删除） */
export async function PATCH(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { ids, action } = body as { ids: number[]; action: "publish" | "unpublish" | "delete" };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "请选择至少一个商品" }, { status: 400 });
  }

  try {
    if (action === "delete") {
      await prisma.product.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ success: true, message: `已删除 ${ids.length} 个商品` });
    } else if (action === "publish") {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isPublished: true } });
      return NextResponse.json({ success: true, message: `已上架 ${ids.length} 个商品` });
    } else if (action === "unpublish") {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isPublished: false } });
      return NextResponse.json({ success: true, message: `已下架 ${ids.length} 个商品` });
    }
    return NextResponse.json({ error: "无效操作" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "批量操作失败" }, { status: 500 });
  }
}

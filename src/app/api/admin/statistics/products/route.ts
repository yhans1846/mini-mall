// src/app/api/admin/statistics/products/route.ts — 商品统计 API
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const user = await prisma.adminUser.findUnique({ where: { id: parseInt(session.user.id as string, 10) } });
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const [totalProducts, publishedCount, categoryCount, topProducts] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isPublished: true } }),
    prisma.category.count(),
    // Top 10 热销
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);

  // 获取热销商品名称
  const productIds = topProducts.map((p) => p.productId);
  const products = productIds.length > 0
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, price: true } })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 按分类统计
  const categoryStats = await prisma.product.groupBy({
    by: ["categoryId"],
    _count: true,
  });
  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return NextResponse.json({
    totalProducts,
    publishedCount,
    unPublishedCount: totalProducts - publishedCount,
    categoryCount,
    topProducts: topProducts.map((p) => ({
      id: p.productId,
      name: productMap.get(p.productId)?.name || "未知",
      price: productMap.get(p.productId)?.price || 0,
      sales: p._sum.quantity || 0,
    })),
    categoryDistribution: categoryStats.map((c) => ({
      category: catMap.get(c.categoryId) || "未知",
      count: c._count,
    })),
  });
}

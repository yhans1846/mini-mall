import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attachFlashSales } from "@/lib/flash-sale";
import type { Product, PaginatedResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10))
    );
    const sort = searchParams.get("sort") || "";

    // 构建查询条件：只查已发布商品
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { isPublished: true };

    // 关键词模糊搜索
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // 分类筛选
    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }

    // 按销量排序：先查所有匹配商品，聚合销量后手动分页
    if (sort === "sales") {
      const allProducts = await prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { id: "desc" },
      });

      const productIds = allProducts.map((p) => p.id);
      const salesData =
        productIds.length > 0
          ? await prisma.orderItem.groupBy({
              by: ["productId"],
              where: {
                productId: { in: productIds },
                order: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } },
              },
              _sum: { quantity: true },
            })
          : [];

      const salesMap = new Map<number, number>();
      for (const item of salesData) {
        salesMap.set(item.productId, item._sum.quantity || 0);
      }

      // 按销量降序，无销量时按 id 降序兜底
      const sorted = [...allProducts].sort((a, b) => {
        const salesA = salesMap.get(a.id) || 0;
        const salesB = salesMap.get(b.id) || 0;
        if (salesA !== salesB) return salesB - salesA;
        return b.id - a.id;
      });

      const total = sorted.length;
      const totalPages = Math.ceil(total / pageSize);
      const products = sorted.slice((page - 1) * pageSize, page * pageSize);
      const productsWithFlash = await attachFlashSales(products);

      const response: PaginatedResponse<Product> = {
        products: productsWithFlash as unknown as Product[],
        total,
        page,
        pageSize,
        totalPages,
      };

      return NextResponse.json(response);
    }

    // 按最新排序或默认（原行为）
    const orderBy = sort === "newest" ? { createdAt: "desc" as const } : { createdAt: "desc" as const };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const productsWithFlash = await attachFlashSales(products);

    const response: PaginatedResponse<Product> = {
      products: productsWithFlash as unknown as Product[],
      total,
      page,
      pageSize,
      totalPages,
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "获取商品列表失败" },
      { status: 500 }
    );
  }
}

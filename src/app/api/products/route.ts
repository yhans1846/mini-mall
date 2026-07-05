import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attachFlashSales } from "@/lib/flash-sale";
import { transformProduct } from "@/lib/utils";
import type { Product, PaginatedResponse } from "@/types";

/** 为商品批量附加销量数据 */
async function attachSalesCounts(products: (Product & { category?: unknown })[]) {
  if (products.length === 0) return products;
  const productIds = products.map((p) => p.id);
  const salesData = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      order: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } },
    },
    _sum: { quantity: true },
  });
  const salesMap = new Map<number, number>();
  for (const item of salesData) {
    salesMap.set(item.productId, item._sum.quantity || 0);
  }
  return products.map((p) => ({
    ...p,
    salesCount: salesMap.get(p.id) || 0,
  }));
}

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
    const flashSale = searchParams.get("flashSale") || "";

    // 如有秒杀筛选，先查出有活跃秒杀的商品 ID
    let flashSaleProductIds: number[] | null = null;
    if (flashSale === "true") {
      const now = new Date();
      const flashSales = await prisma.flashSale.findMany({
        where: { isActive: true, startTime: { lte: now }, endTime: { gt: now } },
        select: { productId: true },
      });
      flashSaleProductIds = flashSales.map((fs) => fs.productId);
      if (flashSaleProductIds.length === 0) {
        // 没有秒杀商品时直接返回空
        const emptyResponse: PaginatedResponse<Product> = { products: [], total: 0, page, pageSize, totalPages: 0 };
        return NextResponse.json(emptyResponse);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { isPublished: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }

    if (flashSaleProductIds) {
      where.id = { in: flashSaleProductIds };
    }

    // 按销量排序
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
      const productsWithSales = await attachSalesCounts(productsWithFlash as unknown as Product[]);
      const transformedSales = productsWithSales.map((p) => transformProduct(p as unknown as { images?: string; specs?: string; tags?: string }));

      const response: PaginatedResponse<Product> = {
        products: transformedSales as unknown as Product[],
        total,
        page,
        pageSize,
        totalPages,
      };

      return NextResponse.json(response);
    }

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
    const productsWithSales = await attachSalesCounts(productsWithFlash as unknown as Product[]);
    const transformed = productsWithSales.map((p) => transformProduct(p as unknown as { images?: string; specs?: string; tags?: string }));

    const response: PaginatedResponse<Product> = {
      products: transformed as unknown as Product[],
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

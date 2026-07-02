import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    // 并行查询：总条数 + 当前页数据
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

    const totalPages = Math.ceil(total / pageSize);

    const response: PaginatedResponse<Product> = {
      products: products as unknown as Product[],
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

// src/app/api/products/[id]/route.ts — 商品详情 API
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attachFlashSale } from "@/lib/flash-sale";
import { transformProduct } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "无效的商品 ID" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }

    const productWithFlash = await attachFlashSale(product);
    const transformed = transformProduct(productWithFlash as typeof productWithFlash & { images?: string; specs?: string; tags?: string });

    return NextResponse.json(transformed);
  } catch {
    return NextResponse.json({ error: "获取商品详情失败" }, { status: 500 });
  }
}

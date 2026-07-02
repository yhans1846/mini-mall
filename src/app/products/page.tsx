// src/app/products/page.tsx — 商品列表页（服务端组件 + 客户端内容区）
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ProductListContent from "./ProductListContent";
import type { Category } from "@/types";

export default async function ProductsPage() {
  // 服务端获取分类列表供筛选使用
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">全部商品</h1>
      <Suspense fallback={null}>
        <ProductListContent categories={categories as unknown as Category[]} />
      </Suspense>
    </div>
  );
}

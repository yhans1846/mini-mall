// src/app/page.tsx — 首页（服务端组件）
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/product/ProductGrid";
import type { Product } from "@/types";

/** 分类配置 */
const CATEGORIES = [
  { id: 1, name: "服装", icon: "👕" },
  { id: 2, name: "电子产品", icon: "📱" },
  { id: 3, name: "家居用品", icon: "🏠" },
  { id: 4, name: "食品饮料", icon: "🍜" },
  { id: 5, name: "图书", icon: "📚" },
  { id: 6, name: "运动户外", icon: "🏃" },
] as const;

export default async function Home() {
  // 查询最新 4 件已发布商品
  const newProducts = await prisma.product.findMany({
    where: { isPublished: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div>
      {/* Hero Banner */}
      <section className="-mx-4 mb-8 bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-16 text-white sm:rounded-lg sm:mx-0">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Mini Mall 精选好物</h1>
          <p className="mt-3 text-lg text-blue-100">
            精选商品，品质生活，从 Mini Mall 开始
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-medium text-blue-600 shadow transition-colors hover:bg-blue-50"
          >
            逛逛商品
          </Link>
        </div>
      </section>

      {/* 分类快速入口 */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">商品分类</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?categoryId=${cat.id}`}
              className="flex flex-col items-center rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="mt-2 text-sm text-gray-700">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 新品推荐 */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">新品推荐</h2>
        <ProductGrid products={newProducts as unknown as Product[]} />
      </section>
    </div>
  );
}

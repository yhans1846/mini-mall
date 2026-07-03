// src/components/product/ProductGrid.tsx
import type { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

/** 骨架屏卡片：灰块模拟图片+文字 */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border bg-white">
      <div className="aspect-square bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-12 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded bg-gray-200" />
        <div className="h-8 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  // 加载中：显示 6 个骨架屏
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // 空状态
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-lg">没有找到商品</p>
        <p className="mt-1 text-sm">换个关键词试试，或者清除筛选条件</p>
      </div>
    );
  }

  // 正常网格
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

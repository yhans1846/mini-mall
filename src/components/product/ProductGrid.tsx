// src/components/product/ProductGrid.tsx
import type { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white">
      <div className="aspect-square bg-gray-100" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-12 rounded bg-gray-100" />
        <div className="h-4 w-3/4 rounded bg-gray-100" />
        <div className="h-5 w-20 rounded bg-gray-100" />
        <div className="h-8 w-full rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <svg className="h-20 w-20 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-base font-medium text-gray-500">没有找到商品</p>
        <p className="text-sm text-gray-400">换个关键词试试，或者清除筛选条件</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product, i) => (
        <div key={product.id} className={`animate-fadeInUp stagger-${Math.min(i + 1, 6)}`}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}

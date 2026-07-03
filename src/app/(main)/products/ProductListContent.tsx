// src/app/products/ProductListContent.tsx — 商品列表客户端内容
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import SearchBar from "@/components/product/SearchBar";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/ui/Pagination";
import type { Category, PaginatedResponse, Product } from "@/types";

interface ProductListContentProps {
  categories: Category[];
}

/** 分类图标映射 */
const CATEGORY_ICONS: Record<string, string> = {
  "服装": "👕",
  "电子产品": "📱",
  "家居用品": "🏠",
  "食品饮料": "🍜",
  "图书": "📚",
  "运动户外": "🏃",
};

/** SWR fetcher */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductListContent({ categories }: ProductListContentProps) {
  const searchParams = useSearchParams();

  const currentCategoryId = searchParams.get("categoryId") || "";
  const search = searchParams.get("search") || "";
  const page = searchParams.get("page") || "1";

  // 拼接 API 查询参数
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (currentCategoryId) params.set("categoryId", currentCategoryId);
  params.set("page", page);

  const { data, error, isLoading } = useSWR<PaginatedResponse<Product>>(
    `/api/products?${params.toString()}`,
    fetcher
  );

  // 错误状态
  if (error) {
    return (
      <div>
        <SearchBar />
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <p className="text-lg">加载失败</p>
          <p className="mt-1 text-sm">请检查网络后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SearchBar />

      {/* 分类快速入口 */}
      <section className="mb-4 mt-2">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              !currentCategoryId
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            全部
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?categoryId=${cat.id}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-colors ${
                currentCategoryId === String(cat.id)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>{CATEGORY_ICONS[cat.name] || "📦"}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-3">
        <ProductGrid products={data?.products || []} loading={isLoading} />
      </div>

      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} />
      )}
    </div>
  );
}

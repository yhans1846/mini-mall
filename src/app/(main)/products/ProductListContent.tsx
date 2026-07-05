// src/app/products/ProductListContent.tsx — 商品列表（含排序 UI）
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import SearchBar from "@/components/product/SearchBar";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/ui/Pagination";
import type { Category, PaginatedResponse, Product } from "@/types";

interface ProductListContentProps { categories: Category[] }

const CATEGORY_ICONS: Record<string, string> = {
  "服装": "👕", "电子产品": "📱", "家居用品": "🏠",
  "食品饮料": "🍜", "图书": "📚", "运动户外": "🏃",
};

interface SortOption { label: string; value: string }
const SORT_OPTIONS: SortOption[] = [
  { label: "默认", value: "" },
  { label: "最新", value: "newest" },
  { label: "销量", value: "sales" },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductListContent({ categories }: ProductListContentProps) {
  const searchParams = useSearchParams();
  const currentCategoryId = searchParams.get("categoryId") || "";
  const search = searchParams.get("search") || "";
  const page = searchParams.get("page") || "1";
  const sort = searchParams.get("sort") || "";
  const flashSale = searchParams.get("flashSale") || "";

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (currentCategoryId) params.set("categoryId", currentCategoryId);
  if (sort) params.set("sort", sort);
  if (flashSale) params.set("flashSale", flashSale);
  params.set("page", page);

  const { data, error, isLoading } = useSWR<PaginatedResponse<Product>>(
    `/api/products?${params.toString()}`, fetcher,
  );

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

  const buildHref = (overrides: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k);
    });
    return `/products?${p.toString()}`;
  };

  return (
    <div>
      <SearchBar />

      {/* 分类快速入口 */}
      <section className="mb-3 mt-2">
        <div className="flex flex-wrap gap-2">
          <Link href="/products"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              !currentCategoryId ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>全部</Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/products?categoryId=${cat.id}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                currentCategoryId === String(cat.id) ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              <span>{CATEGORY_ICONS[cat.name] || "📦"}</span><span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 排序栏 */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="mr-1 text-xs text-gray-400">排序：</span>
        {SORT_OPTIONS.map((opt) => {
          const active = sort === opt.value || (!sort && !opt.value);
          return (
            <Link key={opt.value} href={buildHref({ sort: opt.value, page: "" })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                active ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>
              {opt.label}
            </Link>
          );
        })}
        <span className="mx-2 text-gray-200">|</span>
        <Link href={buildHref({ flashSale: flashSale ? "" : "true", sort: "", page: "" })}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
            flashSale ? "bg-red-500 text-white shadow-sm" : "bg-white text-red-500 hover:bg-red-50 border border-red-200"
          }`}>
          ⚡ 秒杀
        </Link>
      </div>

      <div className="mt-3">
        <ProductGrid products={data?.products || []} loading={isLoading} />
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} />}
    </div>
  );
}

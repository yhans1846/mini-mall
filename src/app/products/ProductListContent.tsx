// src/app/products/ProductListContent.tsx — 商品列表客户端内容
"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import SearchBar from "@/components/product/SearchBar";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/ui/Pagination";
import type { Category, PaginatedResponse, Product } from "@/types";

interface ProductListContentProps {
  categories: Category[];
}

/** SWR fetcher */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductListContent({ categories }: ProductListContentProps) {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const page = searchParams.get("page") || "1";

  // 拼接 API 查询参数
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);
  params.set("page", page);

  const { data, error, isLoading } = useSWR<PaginatedResponse<Product>>(
    `/api/products?${params.toString()}`,
    fetcher
  );

  // 错误状态
  if (error) {
    return (
      <div>
        <SearchBar categories={categories} />
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <p className="text-lg">加载失败</p>
          <p className="mt-1 text-sm">请检查网络后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SearchBar categories={categories} />

      <div className="mt-6">
        <ProductGrid products={data?.products || []} loading={isLoading} />
      </div>

      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} />
      )}
    </div>
  );
}

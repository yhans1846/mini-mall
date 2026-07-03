// src/components/product/SearchBar.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("categoryId") || "";

  const [search, setSearch] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 防抖搜索：输入暂停 500ms 后自动跳转
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set("search", value);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`/products?${params.toString()}`);
      }, 500);
    },
    [router, searchParams]
  );

  // 同步外部 URL 变化（如浏览器回退）
  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  // 清除所有筛选
  const handleClear = useCallback(() => {
    setSearch("");
    router.push("/products");
  }, [router]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* 搜索输入框 */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="搜索商品..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 有筛选条件时显示清除按钮 */}
      {(currentSearch || currentCategory) && (
        <button
          onClick={handleClear}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}

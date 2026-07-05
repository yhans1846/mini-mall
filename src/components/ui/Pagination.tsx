// src/components/ui/Pagination.tsx — 前台分页（支持 URL params + onChange 回调）
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath?: string;
  onChange?: (page: number) => void;
}

export default function Pagination({ page, totalPages, basePath, onChange }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (p: number) => {
      if (onChange) {
        onChange(p);
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      router.push(`${basePath || "/products"}?${params.toString()}`);
    },
    [router, searchParams, basePath, onChange]
  );

  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="mt-8 flex items-center justify-center gap-1">
      <button
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        上一页
      </button>
      {pageNumbers.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              p === page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        下一页
      </button>
    </div>
  );
}

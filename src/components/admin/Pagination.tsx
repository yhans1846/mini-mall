// src/components/admin/Pagination.tsx — 现代化分页（支持跳转 + 每页条数选择）
"use client";

import { useState } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  onChange: (page: number) => void;
}

export default function Pagination({
  page, totalPages, total, onChange,
  pageSize, pageSizeOptions = [10, 20, 30, 50], onPageSizeChange,
}: PaginationProps) {
  const [jumpInput, setJumpInput] = useState("");

  if (totalPages <= 1 && !onPageSizeChange) return null;

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

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(jumpInput, 10);
    if (n >= 1 && n <= totalPages) {
      onChange(n);
      setJumpInput("");
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">共 {total} 条记录</span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1 text-sm text-gray-500">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s} 条</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-white"
        >
          上一页
        </button>
        {totalPages > 1 && getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-1 text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                p === page
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              style={p === page ? { background: "linear-gradient(135deg, #409eff, #3a8ee6)" } : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:border-gray-200 disabled:hover:bg-white"
        >
          下一页
        </button>
        {totalPages > 10 && (
          <form onSubmit={handleJump} className="ml-2 flex items-center gap-1 text-sm text-gray-500">
            <span>跳至</span>
            <input
              type="number" min={1} max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="input-search w-14 text-center"
              placeholder={`${page}`}
            />
            <span>页</span>
          </form>
        )}
      </div>
    </div>
  );
}

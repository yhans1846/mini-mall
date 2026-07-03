// src/app/admin/products/page.tsx — 后台商品管理（分页 + 搜索 + 分类筛选）
"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

interface AdminProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  isPublished: boolean;
  category: { id: number; name: string };
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface PageData {
  products: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "published" | "unpublished"

  // 构建查询参数
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  if (categoryFilter) params.set("categoryId", categoryFilter);
  if (statusFilter) params.set("status", statusFilter);

  const { data, error, isLoading, mutate } = useSWR<PageData>(
    `/api/admin/products?${params.toString()}`,
    fetcher,
  );

  // 分类列表（用于筛选下拉）
  const { data: categories } = useSWR<Category[]>(
    "/api/admin/categories",
    fetcher,
  );

  const products = data?.products || [];

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1); // 搜索时回到第一页
  };

  const togglePublish = async (product: AdminProduct) => {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !product.isPublished }),
    });
    if (res.ok) mutate();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此商品？")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
    else alert("删除失败，该商品可能有关联订单");
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          新增商品
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索商品名称..."
          className="w-60 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">全部分类</option>
          {(categories || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">全部状态</option>
          <option value="published">已上架</option>
          <option value="unpublished">已下架</option>
        </select>
        <span className="text-sm text-gray-500">
          共 {data?.total ?? "-"} 条
        </span>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-gray-200" />
          ))}
        </div>
      ) : error ? (
        <p className="text-gray-500">加载失败</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">暂无商品</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">名称</th>
                  <th className="px-4 py-3 text-left">分类</th>
                  <th className="px-4 py-3 text-right">价格</th>
                  <th className="px-4 py-3 text-right">库存</th>
                  <th className="px-4 py-3 text-center">状态</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{p.id}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category.name}</td>
                    <td className="px-4 py-3 text-right">¥{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{p.stock}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePublish(p)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.isPublished ? "已上架" : "已下架"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:underline"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                上一页
              </button>
              {renderPageNumbers(data.page, data.totalPages, setPage)}
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** 页码列表 */
function renderPageNumbers(
  current: number,
  total: number,
  goTo: (p: number) => void,
) {
  const items: (number | "...")[] = [];
  const delta = 2;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  items.push(1);
  if (left > 2) items.push("...");
  for (let i = left; i <= right; i++) items.push(i);
  if (right < total - 1) items.push("...");
  if (total > 1) items.push(total);

  return items.map((p, i) =>
    p === "..." ? (
      <span key={`e-${i}`} className="px-2 text-gray-400">...</span>
    ) : (
      <button
        key={p}
        onClick={() => goTo(p)}
        className={`rounded-md px-3 py-1.5 text-sm ${
          p === current
            ? "bg-blue-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {p}
      </button>
    ),
  );
}

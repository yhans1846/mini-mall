// src/app/admin/products/page.tsx — 后台商品管理
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
  category: { name: string };
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/products?search=${search}`,
    fetcher
  );

  const products: AdminProduct[] = data?.products || [];

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

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索商品..."
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-gray-200" />
          ))}
        </div>
      ) : error ? (
        <p className="text-gray-500">加载失败</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">暂无商品</p>
      ) : (
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
      )}
    </div>
  );
}

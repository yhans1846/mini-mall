// src/app/admin/page.tsx — 后台仪表盘
"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminDashboard() {
  const { data: counts, error, isLoading } = useSWR("/api/admin/dashboard", fetcher);

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">仪表盘</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-white p-6">
              <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
              <div className="h-8 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = counts || { products: 0, orders: 0, revenue: 0 };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">仪表盘</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">商品总数</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.products}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">订单总数</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.orders}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-gray-500">总销售额</p>
          <p className="mt-2 text-3xl font-bold text-red-500">
            ¥{stats.revenue.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

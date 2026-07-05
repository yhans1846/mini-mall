// src/app/orders/page.tsx — 我的订单列表（分页 + 状态筛选）
"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { formatPrice } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待付款", color: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { label: "已支付", color: "bg-blue-50 text-blue-700 border-blue-200" },
  SHIPPED: { label: "已发货", color: "bg-violet-50 text-violet-700 border-violet-200" },
  COMPLETED: { label: "已完成", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "已取消", color: "bg-gray-50 text-gray-500 border-gray-200" },
};

const STATUS_FILTERS = [
  { label: "全部", value: "ALL" },
  { label: "待付款", value: "PENDING" },
  { label: "已支付", value: "PAID" },
  { label: "已发货", value: "SHIPPED" },
  { label: "已完成", value: "COMPLETED" },
  { label: "已取消", value: "CANCELLED" },
];

interface OrderItem { id: number; quantity: number; price: number; product: { name: string; imageUrl: string } }
interface Order { id: number; status: string; totalAmount: number; createdAt: string; items: OrderItem[] }

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function OrdersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentFilter = searchParams.get("status") || "ALL";

  const { data, error, isLoading } = useSWR<OrdersResponse>(
    session ? `/api/orders?page=${currentPage}&status=${currentFilter}` : null,
    fetcher,
  );

  const setFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", value);
    params.set("page", "1");
    router.push(`/orders?${params.toString()}`);
  };

  if (status === "unauthenticated") { router.push("/auth/login"); return null; }

  if (status === "loading" || isLoading) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">我的订单</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-white p-4">
              <div className="mb-3 h-4 w-1/4 rounded bg-gray-100" />
              <div className="h-16 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">我的订单</h1>
        <EmptyState title="加载失败" description="请检查网络后重试" />
      </div>
    );
  }

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;

  if (orders.length === 0 && currentPage === 1) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">我的订单</h1>
        <div className="mb-5 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button key={s.value} onClick={() => setFilter(s.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                currentFilter === s.value ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{s.label}</button>
          ))}
        </div>
        <EmptyState title="暂无订单" description="快去挑选心仪的商品吧" actionLabel="去逛逛" actionHref="/products" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold">我的订单</h1>

      {/* 状态筛选 */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button key={s.value} onClick={() => setFilter(s.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              currentFilter === s.value ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>{s.label}</button>
        ))}
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <EmptyState title="无匹配订单" description="当前筛选条件下没有订单" />
        ) : (
          orders.map((order) => {
            const si = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-50 text-gray-500 border-gray-200" };
            const firstItem = order.items[0];
            return (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-400"># {order.id}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${si.color}`}>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-50" />{si.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {firstItem && (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                      {firstItem.product.imageUrl ? (
                        <img src={firstItem.product.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">{firstItem.product.name.charAt(0)}</div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {firstItem && <p className="truncate text-sm font-medium text-gray-800">{firstItem.product.name}</p>}
                    <p className="mt-1 text-xs text-gray-400">共 {order.items.length} 件商品</p>
                  </div>
                  <p className="text-base font-bold text-red-500">{formatPrice(order.totalAmount)}</p>
                </div>
                <p className="mt-2 text-xs text-gray-400">{new Date(order.createdAt).toLocaleString("zh-CN")}</p>
              </Link>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <Pagination page={currentPage} totalPages={totalPages} basePath="/orders" />
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <Suspense fallback={<div className="py-8 text-center text-gray-400">加载中...</div>}><OrdersContent /></Suspense>;
}

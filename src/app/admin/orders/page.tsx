// src/app/admin/orders/page.tsx — 若依风格订单管理
"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import { IconSearch, IconRefresh } from "@/components/admin/icons";

const STATUS_MAP: Record<string, { label: string; type: "success" | "warning" | "danger" | "info" | "default" }> = {
  PENDING: { label: "待付款", type: "warning" },
  PAID: { label: "已支付", type: "info" },
  SHIPPED: { label: "已发货", type: "default" },
  COMPLETED: { label: "已完成", type: "success" },
  CANCELLED: { label: "已取消", type: "danger" },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/orders?page=${page}`,
    fetcher,
  );

  const isPaginated = data && "orders" in data;
  const orders = isPaginated ? (data as { orders: unknown[] }).orders : (Array.isArray(data) ? data : []);
  const total = isPaginated ? (data as { total: number }).total : orders.length;
  const totalPages = isPaginated ? (data as { totalPages: number }).totalPages : 1;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">订单管理</h1>
      </div>

      {/* 工具栏 */}
      <div className="admin-card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => mutate()} className="btn-default" title="刷新">
            <IconRefresh className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="admin-card animate-pulse p-6">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="mb-3 h-8 rounded bg-gray-100" />))}
        </div>
      ) : error ? (
        <div className="admin-card p-6 text-center text-sm text-gray-500">加载失败</div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead><tr>
              <th style={{ width: 80 }}>订单号</th><th>用户</th><th>商品</th>
              <th style={{ width: 100 }} className="text-right">金额</th>
              <th style={{ width: 100 }} className="text-center">状态</th>
              <th style={{ width: 160 }}>时间</th>
              <th style={{ width: 80 }} className="text-center">操作</th>
            </tr></thead>
            <tbody>
              {(orders as { id: number; status: string; totalAmount: number; createdAt: string; user: { name: string }; items: { product: { name: string } }[] }[]).map((order) => {
                const statusInfo = STATUS_MAP[order.status] || { label: order.status, type: "default" as const };
                return (
                  <tr key={order.id}>
                    <td className="font-medium text-gray-800">#{order.id}</td>
                    <td className="text-gray-600">{order.user.name}</td>
                    <td className="max-w-[200px] truncate text-gray-500">
                      {order.items.map((i) => i.product.name).join("、")}
                    </td>
                    <td className="text-right font-medium">¥{order.totalAmount.toFixed(2)}</td>
                    <td className="text-center"><StatusBadge label={statusInfo.label} type={statusInfo.type} /></td>
                    <td className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString("zh-CN")}</td>
                    <td className="text-center">
                      <Link href={`/admin/orders/${order.id}`} className="text-sm transition-colors hover:underline" style={{ color: "#409eff" }}>详情</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isPaginated && totalPages > 1 && (
        <Pagination page={(data as { page: number }).page} totalPages={totalPages} total={total} onChange={setPage} />
      )}
    </div>
  );
}

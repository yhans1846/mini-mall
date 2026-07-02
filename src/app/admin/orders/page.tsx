// src/app/admin/orders/page.tsx — 后台订单管理
"use client";

import useSWR from "swr";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待付款", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "已支付", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "已发货", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "已完成", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "已取消", color: "bg-gray-100 text-gray-500" },
};

interface AdminOrder {
  id: number;
  status: string;
  totalAmount: number;
  address: string;
  createdAt: string;
  user: { id: number; name: string };
  items: { product: { name: string } }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminOrdersPage() {
  const { data: orders, error, isLoading } = useSWR<AdminOrder[]>("/api/admin/orders", fetcher);

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">订单管理</h1>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p className="text-gray-500">加载失败</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">订单管理</h1>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">订单号</th>
              <th className="px-4 py-3 text-left">用户</th>
              <th className="px-4 py-3 text-left">商品</th>
              <th className="px-4 py-3 text-right">金额</th>
              <th className="px-4 py-3 text-center">状态</th>
              <th className="px-4 py-3 text-left">时间</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(orders || []).map((order) => {
              const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100" };
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{order.id}</td>
                  <td className="px-4 py-3 text-gray-600">{order.user.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                    {order.items.map((i) => i.product.name).join("、")}
                  </td>
                  <td className="px-4 py-3 text-right">¥{order.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(order.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                      详情
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

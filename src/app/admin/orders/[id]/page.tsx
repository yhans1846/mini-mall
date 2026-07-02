// src/app/admin/orders/[id]/page.tsx — 后台订单详情管理
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待付款", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "已支付", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "已发货", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "已完成", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "已取消", color: "bg-gray-100 text-gray-500" },
};

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(false);

  const { data: order, error, isLoading, mutate } = useSWR(
    `/api/orders/${params.id}`,
    fetcher
  );

  const changeStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) mutate();
      else {
        const err = await res.json();
        alert(err.error || "操作失败");
      }
    } catch {
      alert("操作失败");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="animate-pulse h-40 rounded bg-gray-200" />;
  if (error || !order) return <p className="text-gray-500">订单不存在</p>;

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100" };
  const allowedTransitions = TRANSITIONS[order.status] || [];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/orders" className="hover:text-blue-600">订单管理</Link>
        <span>/</span>
        <span>订单 #{order.id}</span>
      </div>

      {/* 状态 + 操作 */}
      <div className="mb-6 flex items-center justify-between rounded-lg border bg-white p-4">
        <div className="flex items-center gap-4">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString("zh-CN")}
          </span>
        </div>
        <div className="flex gap-2">
          {allowedTransitions.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              disabled={loading}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              设为 {STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* 用户信息 */}
      <div className="mb-6 rounded-lg border bg-white p-4">
        <h3 className="mb-2 font-medium text-gray-900">用户信息</h3>
        <p className="text-sm text-gray-600">{order.user?.name} ({order.user?.email})</p>
      </div>

      {/* 商品明细 */}
      <div className="mb-6 rounded-lg border bg-white">
        <div className="border-b px-4 py-3 font-medium">商品明细</div>
        {order.items?.map((item: { id: number; product: { name: string; imageUrl: string }; price: number; quantity: number }) => (
          <div key={item.id} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
            <div className="flex-1 text-sm">{item.product.name}</div>
            <div className="text-sm text-gray-500">¥{item.price.toFixed(2)} × {item.quantity}</div>
            <div className="text-sm font-medium">¥{(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* 金额 */}
      <div className="mb-6 rounded-lg border bg-white p-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">原价</span><span>¥{order.originalAmount?.toFixed(2)}</span></div>
          {order.discountRate < 1 && (
            <div className="flex justify-between"><span className="text-gray-500">折扣</span><span className="text-green-600">-{((1 - order.discountRate) * 100).toFixed(0)}%</span></div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between font-bold"><span>实付</span><span className="text-red-500">¥{order.totalAmount?.toFixed(2)}</span></div>
        </div>
      </div>

      {/* 收货信息 */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-2 font-medium text-gray-900">收货信息</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>地址：{order.address}</p>
          <p>电话：{order.phone}</p>
          {order.note && <p>备注：{order.note}</p>}
        </div>
      </div>
    </div>
  );
}

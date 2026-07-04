// src/app/admin/orders/[id]/page.tsx — 若依风格订单详情
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";

const STATUS_MAP: Record<string, { label: string; type: "success" | "warning" | "danger" | "info" | "default" }> = {
  PENDING: { label: "待付款", type: "warning" },
  PAID: { label: "已支付", type: "info" },
  SHIPPED: { label: "已发货", type: "default" },
  COMPLETED: { label: "已完成", type: "success" },
  CANCELLED: { label: "已取消", type: "danger" },
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

  const { data: order, error, isLoading, mutate } = useSWR(`/api/admin/orders/${params.id}`, fetcher);

  const changeStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) mutate();
      else { const err = await res.json(); alert(err.error || "操作失败"); }
    } catch { alert("操作失败"); } finally { setLoading(false); }
  };

  if (isLoading) return <div className="admin-card h-40 animate-pulse p-6" />;
  if (error || !order) return <div className="admin-card p-6 text-center text-sm text-gray-500">订单不存在</div>;

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, type: "default" as const };
  const allowedTransitions = TRANSITIONS[order.status] || [];

  return (
    <div>
      {/* 面包屑 */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/orders" className="transition-colors hover:underline" style={{ color: "#409eff" }}>订单管理</Link>
        <span>/</span>
        <span className="text-gray-800">订单 #{order.id}</span>
      </div>

      {/* 状态 + 操作 */}
      <div className="admin-card mb-5 flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <StatusBadge label={statusInfo.label} type={statusInfo.type} />
          <span className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString("zh-CN")}</span>
        </div>
        <div className="flex gap-2">
          {allowedTransitions.map((s) => {
            const btnInfo = STATUS_MAP[s];
            const btnStyle = s === "CANCELLED" ? "btn-danger text-sm" : "btn-primary text-sm";
            return (
              <button key={s} onClick={() => changeStatus(s)} disabled={loading} className={btnStyle}>
                设为 {btnInfo?.label || s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="admin-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">用户信息</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>姓名：{order.user?.name}</p>
            <p>邮箱：{order.user?.email}</p>
          </div>
        </div>
        <div className="admin-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">收货信息</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>地址：{order.address}</p>
            <p>电话：{order.phone}</p>
            {order.note && <p>备注：{order.note}</p>}
          </div>
        </div>
      </div>

      {/* 商品明细 */}
      <div className="admin-card mt-5">
        <div className="border-b px-5 py-3 text-sm font-semibold text-gray-800">商品明细</div>
        {order.items?.map((item: { id: number; product: { name: string }; price: number; quantity: number }) => (
          <div key={item.id} className="flex items-center gap-4 border-b px-5 py-3 text-sm last:border-0">
            <div className="flex-1 text-gray-700">{item.product.name}</div>
            <div className="text-gray-400">¥{item.price.toFixed(2)} × {item.quantity}</div>
            <div className="w-24 text-right font-medium text-gray-800">¥{(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* 金额 */}
      <div className="admin-card mt-5 p-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">原价</span><span>¥{order.originalAmount?.toFixed(2)}</span></div>
          {order.discountRate < 1 && (
            <div className="flex justify-between"><span className="text-gray-500">折扣</span><span className="text-green-600">-{((1 - order.discountRate) * 100).toFixed(0)}%</span></div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between text-base font-bold"><span>实付</span><span style={{ color: "#ff4949" }}>¥{order.totalAmount?.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}

// src/app/orders/[id]/page.tsx — 订单详情
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待付款", color: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "已支付", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "已发货", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "已完成", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "已取消", color: "bg-gray-100 text-gray-500" },
};

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: { id: number; name: string; imageUrl: string };
}

interface Order {
  id: number;
  status: string;
  originalAmount: number;
  discountRate: number;
  totalAmount: number;
  address: string;
  phone: string;
  note: string;
  createdAt: string;
  items: OrderItem[];
}

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("not found");
  return r.json();
});

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: order, error, isLoading, mutate } = useSWR<Order>(
    session ? `/api/orders/${params.id}` : null,
    fetcher
  );

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-gray-200" />
          <div className="h-40 rounded-lg bg-gray-200" />
          <div className="h-20 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center py-16 text-gray-500">
        <p className="text-lg">订单不存在</p>
        <Link href="/orders" className="mt-3 text-sm text-blue-600 hover:underline">
          返回订单列表
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100" };

  // 模拟支付
  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "PUT" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "支付失败");
        return;
      }
      mutate();
    } catch {
      alert("支付失败，请重试");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="py-8">
      {/* 面包屑 */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/orders" className="hover:text-blue-600">我的订单</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">订单详情</span>
      </nav>

      {/* 订单状态头 */}
      <div className="mb-6 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <p className="mt-2 text-xs text-gray-400">
              订单号：{order.id} &nbsp;|&nbsp; {new Date(order.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            {order.status === "PENDING" && (
              <>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="rounded-md bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {paying ? "支付中..." : "模拟支付"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 商品明细 */}
      <div className="mb-6 rounded-lg border bg-white">
        <div className="border-b px-4 py-3 font-medium text-gray-900">商品信息</div>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
            <Link href={`/products/${item.product.id}`} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
              {item.product.imageUrl ? (
                <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl text-gray-400">
                  {item.product.name.charAt(0)}
                </div>
              )}
            </Link>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{item.product.name}</p>
              <p className="mt-1 text-sm text-gray-500">
                {formatPrice(item.price)} × {item.quantity}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* 金额汇总 */}
      <div className="mb-6 rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-medium text-gray-900">金额明细</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">原价</span>
            <span>{formatPrice(order.originalAmount)}</span>
          </div>
          {order.discountRate < 1 && (
            <div className="flex justify-between">
              <span className="text-gray-500">会员折扣</span>
              <span className="text-green-600">-{(1 - order.discountRate) * 100}%</span>
            </div>
          )}
          <hr className="border-gray-200" />
          <div className="flex justify-between font-bold">
            <span>实付金额</span>
            <span className="text-red-500">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* 收货信息 */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-medium text-gray-900">收货信息</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>地址：{order.address}</p>
          <p>电话：{order.phone}</p>
          {order.note && <p>备注：{order.note}</p>}
        </div>
      </div>
    </div>
  );
}

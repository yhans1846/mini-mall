// src/app/orders/page.tsx — 我的订单列表
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

/** 订单状态对应中文和颜色 */
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
  product: { name: string; imageUrl: string };
}

interface Order {
  id: number;
  status: string;
  originalAmount: number;
  discountRate: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: orders, error, isLoading } = useSWR<Order[]>(
    session ? "/api/orders" : null,
    fetcher
  );

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="py-4">
        <h1 className="mb-3 text-2xl font-bold">我的订单</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-white p-4">
              <div className="mb-3 h-4 w-1/4 rounded bg-gray-200" />
              <div className="h-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <h1 className="mb-3 text-2xl font-bold">我的订单</h1>
        <div className="flex flex-col items-center py-16 text-gray-500">
          <p className="text-lg">加载失败</p>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="py-4">
        <h1 className="mb-3 text-2xl font-bold">我的订单</h1>
        <div className="flex flex-col items-center py-16 text-gray-500">
          <p className="text-lg">暂无订单</p>
          <Link href="/products" className="mt-3 text-sm text-blue-600 hover:underline">
            去逛逛
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold">我的订单</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100" };
          const firstItem = order.items[0];
          const moreCount = order.items.length - 1;

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
            >
              {/* 顶部：订单号 + 状态 */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-500"># {order.id}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* 商品缩略 */}
              <div className="flex items-center gap-3">
                {firstItem && (
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                    {firstItem.product.imageUrl ? (
                      <img src={firstItem.product.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        {firstItem.product.name.charAt(0)}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {firstItem && (
                    <p className="truncate text-sm text-gray-900">{firstItem.product.name}</p>
                  )}
                  {moreCount > 0 && (
                    <p className="mt-1 text-xs text-gray-500">等 {order.items.length} 件商品</p>
                  )}
                </div>
                <p className="text-sm font-bold text-red-500">{formatPrice(order.totalAmount)}</p>
              </div>

              {/* 时间 */}
              <p className="mt-2 text-xs text-gray-400">
                {new Date(order.createdAt).toLocaleString("zh-CN")}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

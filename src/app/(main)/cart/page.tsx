// src/app/cart/page.tsx — 购物车页面
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import type { Product, Category } from "@/types";

/** 购物车单项类型 */
interface CartItemData {
  id: number;
  quantity: number;
  productId: number;
  product: Product & { category: Category };
}

/** 格式化价格 */
function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
});

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const { data: items, error, isLoading, mutate } = useSWR<CartItemData[]>(
    "/api/cart",
    fetcher
  );

  // 未登录处理
  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="py-4">
        <h1 className="mb-3 text-2xl font-bold">购物车</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-white p-4">
              <div className="flex gap-4">
                <div className="h-24 w-24 rounded bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-8 w-32 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 更新数量
  const updateQuantity = async (itemId: number, newQty: number) => {
    setLoadingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
      }
      mutate();
    } catch {
      alert("更新失败，请重试");
    } finally {
      setLoadingId(null);
    }
  };

  // 删除项
  const removeItem = async (itemId: number) => {
    setLoadingId(itemId);
    try {
      await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      mutate();
    } catch {
      alert("删除失败，请重试");
    } finally {
      setLoadingId(null);
    }
  };

  // 计算总价
  const total = (items || []).reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // 错误状态
  if (error) {
    return (
      <div className="py-4">
        <h1 className="mb-3 text-2xl font-bold">购物车</h1>
        <div className="flex flex-col items-center py-16 text-gray-500">
          <p className="text-lg">加载失败</p>
          <button
            onClick={() => mutate()}
            className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 空购物车
  if (!items || items.length === 0) {
    return (
      <div className="py-4">
        <h1 className="mb-3 text-2xl font-bold">购物车</h1>
        <div className="flex flex-col items-center py-16 text-gray-500">
          <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p className="text-lg">购物车是空的</p>
          <Link
            href="/products"
            className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            去逛逛
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold">
        购物车 <span className="text-base text-gray-500">({items.length} 件)</span>
      </h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex gap-4 rounded-lg border bg-white p-4 ${
              loadingId === item.id ? "opacity-50" : ""
            }`}
          >
            {/* 商品图片 */}
            <Link
              href={`/products/${item.productId}`}
              className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100"
            >
              {item.product.imageUrl ? (
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-gray-400">
                  {item.product.name.charAt(0)}
                </div>
              )}
            </Link>

            {/* 商品信息 */}
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between">
                <Link
                  href={`/products/${item.productId}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  {item.product.name}
                </Link>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={loadingId === item.id}
                  className="text-sm text-gray-400 hover:text-red-500 disabled:text-gray-300"
                >
                  删除
                </button>
              </div>

              <p className="text-sm text-red-500">{formatPrice(item.product.price)}</p>

              <div className="flex items-center justify-between">
                {/* 数量调整 */}
                <div className="flex items-center rounded-md border">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || loadingId === item.id}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
                  >
                    -
                  </button>
                  <span className="min-w-[2rem] text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={loadingId === item.id}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
                  >
                    +
                  </button>
                </div>

                <p className="text-sm font-bold text-red-500">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部结算栏 */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-base text-gray-700">合计</span>
          <span className="text-xl font-bold text-red-500">{formatPrice(total)}</span>
        </div>
        <Link
          href="/orders/checkout"
          className="mt-3 block w-full rounded-md bg-blue-600 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          提交订单
        </Link>
      </div>
    </div>
  );
}

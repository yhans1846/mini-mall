// src/app/cart/page.tsx — 购物车页面
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import Link from "next/link";
import EmptyState from "@/components/shared/EmptyState";
import { getDiscountRate, formatPrice, MEMBERSHIP_TIERS } from "@/lib/utils";
import type { Product, Category } from "@/types";

interface CartItemData {
  id: number; quantity: number; productId: number;
  product: Product & { category: Category };
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (res.status === 401) throw new Error("unauthorized");
  return res.json();
});

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const { data: items, error, isLoading, mutate } = useSWR<CartItemData[]>("/api/cart", fetcher);
  const { data: member } = useSWR(session ? "/api/member" : null,
    (url: string) => fetch(url).then((r) => r.ok ? r.json() : null));

  if (status === "unauthenticated") { router.push("/auth/login"); return null; }

  if (status === "loading" || isLoading) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">购物车</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-white p-4">
              <div className="flex gap-4">
                <div className="h-24 w-24 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2"><div className="h-4 w-3/4 rounded bg-gray-100" /><div className="h-4 w-1/4 rounded bg-gray-100" /><div className="h-8 w-32 rounded bg-gray-100" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const updateQuantity = async (itemId: number, newQty: number) => {
    setLoadingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: newQty }) });
      if (!res.ok) { const err = await res.json(); toast.error(err.error); }
      mutate();
    } catch { toast.error("更新失败，请重试"); }
    finally { setLoadingId(null); }
  };

  const removeItem = async (itemId: number) => {
    setLoadingId(itemId);
    try { await fetch(`/api/cart/${itemId}`, { method: "DELETE" }); mutate(); toast.success("已移除"); }
    catch { toast.error("删除失败，请重试"); }
    finally { setLoadingId(null); }
  };

  const originalTotal = (items || []).reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // 会员折扣预估
  const level = member?.membershipLevel ?? 0;
  const tier = MEMBERSHIP_TIERS[level];
  const discountRate = getDiscountRate(level);
  const estimatedTotal = Math.round(originalTotal * discountRate * 100) / 100;
  const discountAmount = Math.round((originalTotal - estimatedTotal) * 100) / 100;

  if (error) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">购物车</h1>
        <div className="flex flex-col items-center py-16 text-gray-500">
          <p className="text-lg">加载失败</p>
          <button onClick={() => mutate()} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">重试</button>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">购物车</h1>
        <EmptyState
          icon={<svg className="h-20 w-20 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>}
          title="购物车是空的" description="快去挑选心仪的商品吧"
          actionLabel="去逛逛" actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold">购物车 <span className="text-base font-normal text-gray-400">({items.length} 件)</span></h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className={`flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-opacity ${loadingId === item.id ? "opacity-50" : ""}`}>
            <Link href={`/products/${item.productId}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              {item.product.imageUrl ? (
                <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">{item.product.name.charAt(0)}</div>
              )}
            </Link>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between">
                <Link href={`/products/${item.productId}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">{item.product.name}</Link>
                <button onClick={() => removeItem(item.id)} disabled={loadingId === item.id} className="text-sm text-gray-400 hover:text-red-500 disabled:text-gray-300">删除</button>
              </div>
              <p className="text-sm font-medium text-red-500">{formatPrice(item.product.price)}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-lg border border-gray-200">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || loadingId === item.id} className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:text-gray-300">−</button>
                  <span className="min-w-[2rem] text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={loadingId === item.id} className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:text-gray-300">+</button>
                </div>
                <p className="text-sm font-bold text-red-500">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部结算栏 — 含会员折扣 */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">商品合计</span><span className="text-gray-800">{formatPrice(originalTotal)}</span></div>
          {discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">会员折扣（{tier.name} {(1 - discountRate) * 100}折）</span>
              <span className="text-green-600">-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <hr className="border-gray-100" />
          <div className="flex justify-between text-base">
            <span className="font-semibold text-gray-800">预估应付</span>
            <span className="font-bold text-red-500">{formatPrice(estimatedTotal)}</span>
          </div>
        </div>
        <Link href="/orders/checkout" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md">
          提交订单 <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      </div>
    </div>
  );
}

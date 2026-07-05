// src/app/orders/checkout/page.tsx — 结算页（含完整金额明细）
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import Link from "next/link";
import EmptyState from "@/components/shared/EmptyState";
import { formatPrice, calcCartSummary } from "@/lib/utils";
import type { Product, Category } from "@/types";

interface CartItemData { id: number; quantity: number; productId: number; product: Product & { category: Category } }
interface AddressData { id: number; name: string; phone: string; province: string; city: string; district: string; detail: string; isDefault: boolean }

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatAddress(a: AddressData) {
  return [a.province, a.city, a.district, a.detail].filter(Boolean).join("");
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const { data: items, isLoading: cartLoading } = useSWR<CartItemData[]>(session ? "/api/cart" : null, fetcher);
  const { data: addresses } = useSWR<AddressData[]>(session ? "/api/addresses" : null, fetcher);
  const { data: member } = useSWR(session ? "/api/member" : null, (url: string) => fetch(url).then((r) => r.ok ? r.json() : null));

  if (status === "unauthenticated") { router.push("/auth/login"); return null; }

  if (status === "loading" || cartLoading) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">确认订单</h1>
        <div className="animate-pulse space-y-4"><div className="h-32 rounded-lg bg-gray-100" /><div className="h-20 rounded-lg bg-gray-100" /></div>
      </div>
    );
  }

  // 金额汇总（含秒杀优惠和会员折扣）
  const { listTotal, flashSavings, originalTotal, discountRate, estimatedTotal, discountAmount, tier } =
    calcCartSummary(items || [], member?.membershipLevel ?? 0);

  if (!items || items.length === 0) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">确认订单</h1>
        <EmptyState title="购物车是空的" description="请先添加商品到购物车" actionLabel="去逛逛" actionHref="/products" />
      </div>
    );
  }

  function selectAddress(addr: AddressData) {
    setSelectedAddrId(addr.id);
    setAddress(formatAddress(addr));
    setPhone(addr.phone);
  }

  const handleSubmit = async () => {
    if (!address.trim()) { toast.error("请填写收货地址"); return; }
    if (!phone.trim()) { toast.error("请填写联系电话"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), phone: phone.trim(), note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "下单失败"); setSubmitting(false); return; }
      router.push(`/orders/${data.id}`);
    } catch { toast.error("下单失败，请重试"); setSubmitting(false); }
  };

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold">确认订单</h1>

      {/* 商品清单 */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b px-5 py-3 font-semibold text-gray-800">商品清单</div>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b px-5 py-3 last:border-0">
            <Link href={`/products/${item.productId}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              {item.product.imageUrl ? (
                <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl text-gray-300">{item.product.name.charAt(0)}</div>
              )}
            </Link>
            <div className="flex-1"><p className="text-sm text-gray-900">{item.product.name}</p><p className="mt-0.5 text-xs text-gray-400">x{item.quantity}</p></div>
            <p className="text-sm font-medium text-red-500">{formatPrice((item.product.flashSale ? item.product.flashSale.flashPrice : item.product.price) * item.quantity)}</p>
          </div>
        ))}
      </div>

      {/* 收货信息 */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">收货信息</h2>
          <Link href="/member/addresses" className="text-sm font-medium text-blue-600 hover:underline">管理地址</Link>
        </div>
        {addresses && addresses.length > 0 && (
          <div className="mb-4 space-y-2">
            {addresses.map((addr) => {
              const active = selectedAddrId === addr.id;
              return (
                <button key={addr.id} type="button" onClick={() => selectAddress(addr)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${active ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${active ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                      {active && <div className="flex h-full items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-white" /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{addr.name}</span>
                        <span className="text-xs text-gray-400">{addr.phone}</span>
                        {addr.isDefault && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-600">默认</span>}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">{formatAddress(addr)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="space-y-3">
          <input type="text" value={address} onChange={(e) => { setAddress(e.target.value); setSelectedAddrId(null); }}
            placeholder="收货地址（省市区 + 详细地址）" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          <input type="text" value={phone} onChange={(e) => { setPhone(e.target.value); setSelectedAddrId(null); }}
            placeholder="联系电话" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注（可选）" rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
      </div>

      {/* 金额明细 + 提交 */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">金额明细</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">商品原价</span><span className="text-gray-800">{formatPrice(listTotal)}</span></div>
          {flashSavings > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">秒杀优惠</span>
              <span className="text-orange-600 font-medium">-{formatPrice(flashSavings)}</span>
            </div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">小计</span><span className="text-gray-800">{formatPrice(originalTotal)}</span></div>
          {discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">会员折扣（{tier.name} {(discountRate * 10).toFixed(1)}折）</span>
              <span className="text-green-600 font-medium">-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <hr className="border-gray-100" />
          <div className="flex justify-between text-base">
            <span className="font-bold text-gray-800">实付金额</span>
            <span className="font-bold text-red-500">{formatPrice(estimatedTotal)}</span>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          className="mt-5 w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:bg-gray-300 disabled:shadow-none">
          {submitting ? "提交中..." : "提交订单"}
        </button>
      </div>
    </div>
  );
}

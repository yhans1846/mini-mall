// src/app/orders/checkout/page.tsx — 结算页
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { Product, Category } from "@/types";

interface CartItemData {
  id: number;
  quantity: number;
  productId: number;
  product: Product & { category: Category };
}

interface AddressData {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** 格式化地址显示 */
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

  const { data: items, isLoading: cartLoading } = useSWR<CartItemData[]>(
    session ? "/api/cart" : null,
    fetcher,
  );

  const { data: addresses } = useSWR<AddressData[]>(
    session ? "/api/addresses" : null,
    fetcher,
  );

  // 未登录
  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (status === "loading" || cartLoading) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">确认订单</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-lg bg-gray-200" />
          <div className="h-20 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  const originalTotal = (items || []).reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  // 空购物车
  if (!items || items.length === 0) {
    return (
      <div className="py-8">
        <h1 className="mb-6 text-2xl font-bold">确认订单</h1>
        <div className="flex flex-col items-center py-16 text-gray-500">
          <p className="text-lg">购物车是空的</p>
          <Link href="/products" className="mt-3 text-sm text-blue-600 hover:underline">
            去逛逛
          </Link>
        </div>
      </div>
    );
  }

  /** 选择地址 */
  function selectAddress(addr: AddressData) {
    setSelectedAddrId(addr.id);
    setAddress(formatAddress(addr));
    setPhone(addr.phone);
  }

  const handleSubmit = async () => {
    if (!address.trim()) {
      alert("请填写收货地址");
      return;
    }
    if (!phone.trim()) {
      alert("请填写联系电话");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), phone: phone.trim(), note: note.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "下单失败");
        setSubmitting(false);
        return;
      }

      router.push(`/orders/${data.id}`);
    } catch {
      alert("下单失败，请重试");
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold">确认订单</h1>

      {/* 商品清单 */}
      <div className="mb-6 rounded-lg border bg-white">
        <div className="border-b px-4 py-3 font-medium text-gray-900">商品清单</div>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
            <Link href={`/products/${item.productId}`} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
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
              <p className="mt-1 text-sm text-gray-500">x{item.quantity}</p>
            </div>
            <p className="text-sm text-red-500">{formatPrice(item.product.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      {/* 收货信息 */}
      <div className="mb-6 rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-gray-900">收货信息</h2>
          <Link
            href="/member/addresses"
            className="text-sm text-blue-600 hover:underline"
          >
            管理收货地址
          </Link>
        </div>

        {/* 已保存地址列表 */}
        {addresses && addresses.length > 0 && (
          <div className="mb-4 space-y-2">
            {addresses.map((addr) => {
              const active = selectedAddrId === addr.id;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => selectAddress(addr)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                        active
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {active && (
                        <div className="flex h-full items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{addr.name}</span>
                        <span className="text-xs text-gray-500">{addr.phone}</span>
                        {addr.isDefault && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600">
                            默认
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {formatAddress(addr)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 手动输入区 */}
        <div className="space-y-3">
          <input
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setSelectedAddrId(null); }}
            placeholder="收货地址（省市区 + 详细地址）"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setSelectedAddrId(null); }}
            placeholder="联系电话"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注（可选）"
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 提交栏 */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">商品合计</span>
          <span className="text-gray-900">{formatPrice(originalTotal)}</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">会员折扣将在提交时自动计算</p>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 w-full rounded-md bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? "提交中..." : "提交订单"}
        </button>
      </div>
    </div>
  );
}

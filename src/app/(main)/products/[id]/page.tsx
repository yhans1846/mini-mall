// src/app/products/[id]/page.tsx — 商品详情页
"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import Link from "next/link";
import CountdownTimer from "@/components/ui/CountdownTimer";
import type { Product, Category } from "@/types";

interface ProductDetail extends Product { category: Category }

function formatPrice(price: number): string { return `¥${price.toFixed(2)}`; }

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("加载失败");
  return res.json();
});

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [buyNow, setBuyNow] = useState(false);

  const { data: product, error, isLoading } = useSWR<ProductDetail>(
    `/api/products/${params.id}`, fetcher,
  );

  const doAddToCart = useCallback(async (qty: number, thenCheckout: boolean) => {
    if (adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product!.id, quantity: qty }),
      });
      if (res.status === 401) { router.push("/auth/login"); return; }
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "添加失败"); return; }
      if (thenCheckout) {
        router.push("/orders/checkout");
      } else {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    } catch { toast.error("添加失败，请重试"); }
    finally { setAdding(false); }
  }, [product?.id, adding, router]);

  const handleAddToCart = () => doAddToCart(quantity, false);
  const handleBuyNow = () => doAddToCart(quantity, true);

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse">
          <div className="mb-3 h-6 w-32 rounded bg-gray-200" />
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square rounded-lg bg-gray-200" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="h-6 w-1/4 rounded bg-gray-200" />
              <div className="h-20 rounded bg-gray-200" />
              <div className="h-12 w-40 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center py-16 text-gray-500">
        <p className="text-lg">商品不存在或已下架</p>
        <Link href="/products" className="mt-3 text-sm font-medium text-blue-600 hover:underline">返回商品列表</Link>
      </div>
    );
  }

  const hasStock = product.stock > 0;
  const currentPrice = product.flashSale ? product.flashSale.flashPrice : product.price;

  return (
    <div className="py-6">
      {/* 面包屑 */}
      <nav className="mb-4 text-sm text-gray-400">
        <Link href="/" className="hover:text-blue-600">首页</Link><span className="mx-2">/</span>
        <Link href="/products" className="hover:text-blue-600">商品</Link><span className="mx-2">/</span>
        <Link href={`/products?categoryId=${product.categoryId}`} className="hover:text-blue-600">{product.category.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 商品大图 */}
        <div className="relative overflow-hidden rounded-xl bg-gray-50">
          {product.flashSale && (
            <span className="absolute left-3 top-3 z-10 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1.5 text-sm font-semibold text-white shadow-lg">⚡ 限时秒杀</span>
          )}
          {product.flashSale && (
            <div className="absolute right-3 top-3 z-10">
              <CountdownTimer endTime={product.flashSale.endTime} className="!bg-black/60 !text-white !text-xs !px-2 !py-1 !rounded-lg !font-medium" />
            </div>
          )}
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-6xl text-gray-300">{product.name.charAt(0)}</div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="flex flex-col justify-start">
          <span className="inline-block w-fit rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">{product.category.name}</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{product.name}</h1>

          {/* 价格 */}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-red-500">{formatPrice(currentPrice)}</span>
            {product.flashSale && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <p className="mt-3 text-sm text-gray-500">库存：{hasStock ? `${product.stock} 件` : "暂时无货"}</p>

          <hr className="my-6 border-gray-100" />

          {/* 商品描述 */}
          <div className="text-sm leading-relaxed text-gray-600">
            <h3 className="mb-2 text-base font-semibold text-gray-900">商品描述</h3>
            <p>{product.description}</p>
          </div>

          <hr className="my-6 border-gray-100" />

          {/* 操作区域 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-200">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 disabled:text-gray-300">−</button>
              <span className="min-w-[3rem] text-center text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 disabled:text-gray-300">+</button>
            </div>

            {/* 加入购物车 */}
            <button onClick={handleAddToCart} disabled={adding || !hasStock}
              className={`rounded-lg px-8 py-2.5 text-sm font-medium text-white transition-all ${
                added ? "bg-green-500" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              } disabled:bg-gray-300`}>
              {!hasStock ? "暂时无货" : added ? "已加入 ✓" : adding ? "添加中..." : "加入购物车"}
            </button>

            {/* 立即购买 */}
            <button onClick={handleBuyNow} disabled={adding || !hasStock}
              className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-8 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-orange-600 hover:to-red-600 active:scale-95 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none">
              {buyNow ? "跳转中..." : "立即购买"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

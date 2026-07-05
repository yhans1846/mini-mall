// src/components/product/ProductCard.tsx — 商品卡片（显示销量+库存低量提醒）
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CountdownTimer from "@/components/ui/CountdownTimer";
import type { Product } from "@/types";

function formatPrice(price: number): string { return `¥${price.toFixed(2)}`; }

interface ProductCardProps { product: Product }

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (adding || isOutOfStock) return;
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.status === 401) { router.push("/auth/login"); return; }
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "添加失败"); return; }
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch {
      toast.error("添加失败，请重试");
    } finally { setAdding(false); }
  }, [product.id, adding, router, isOutOfStock]);

  return (
    <Link href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200">
      {/* 商品图片 */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.flashSale && (
          <>
            <span className="absolute left-2 top-2 z-10 rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">秒杀</span>
            <div className="absolute right-2 top-2 z-10">
              <CountdownTimer endTime={product.flashSale.endTime} className="!bg-black/60 !text-white !text-[10px] !px-1.5 !py-0.5 !rounded-md !font-medium" />
            </div>
          </>
        )}
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">{product.name.charAt(0)}</div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">{product.category.name}</span>
          {/* 销量 */}
          {product.salesCount !== undefined && (
            <span className="text-[10px] text-gray-400">已售 {product.salesCount}</span>
          )}
        </div>
        <h3 className="mt-1 text-sm font-medium text-gray-800 line-clamp-2 leading-snug min-h-[2.4rem]">{product.name}</h3>
        {/* 库存提示 */}
        {isOutOfStock ? (
          <p className="mt-0.5 text-[11px] font-medium text-red-500">暂时无货</p>
        ) : isLowStock ? (
          <p className="mt-0.5 text-[11px] font-medium text-rose-500">🔥 仅剩 {product.stock} 件</p>
        ) : (
          <p className="mt-0.5 text-[10px] text-gray-400">库存 {product.stock} 件</p>
        )}
        <p className="mt-1 text-base font-bold text-red-500">
          {product.flashSale ? formatPrice(product.flashSale.flashPrice) : formatPrice(product.price)}
          {product.flashSale && <span className="ml-1.5 text-xs font-normal text-gray-400 line-through">{formatPrice(product.price)}</span>}
        </p>
        <button onClick={handleAddToCart} disabled={adding || isOutOfStock}
          className={`mt-2 w-full rounded-lg py-1.5 text-center text-xs font-medium text-white transition-all ${
            added ? "bg-green-500" : isOutOfStock ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          } disabled:opacity-70`}>
          {isOutOfStock ? "暂时无货" : added ? "已加入 ✓" : adding ? "添加中..." : "加入购物车"}
        </button>
      </div>
    </Link>
  );
}

// src/components/product/ProductCard.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";

/** 格式化价格，保留两位小数 */
function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault(); // 阻止 Link 导航
      e.stopPropagation();

      if (adding) return;

      setAdding(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });

        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "添加失败");
          return;
        }

        // 成功反馈
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      } catch {
        alert("添加失败，请重试");
      } finally {
        setAdding(false);
      }
    },
    [product.id, adding, router]
  );

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 商品图片 */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.flashSale && (
          <span className="absolute left-0 top-0 z-10 rounded-br-lg bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
            秒杀中
          </span>
        )}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement("div");
              fallback.className = "flex h-full w-full items-center justify-center text-4xl text-gray-400";
              fallback.textContent = product.name.charAt(0);
              parent.appendChild(fallback);
            }
          }}
        />
      </div>

      {/* 商品信息 */}
      <div className="p-2">
        {/* 分类标签 */}
        <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] leading-tight text-blue-600">
          {product.category.name}
        </span>

        {/* 商品名称 */}
        <h3 className="mt-0.5 text-xs font-medium text-gray-900 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* 价格 */}
        <p className="mt-1 text-sm font-bold text-red-500">
          {product.flashSale ? formatPrice(product.flashSale.flashPrice) : formatPrice(product.price)}
          {product.flashSale && (
            <span className="ml-1 text-[10px] font-normal text-gray-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </p>

        {/* 加入购物车按钮 */}
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className={`mt-1 w-full rounded-md py-1 text-center text-xs text-white transition-colors ${
            added
              ? "bg-green-500"
              : "bg-blue-600 hover:bg-blue-700"
          } disabled:opacity-70`}
        >
          {added ? "已加入 ✓" : adding ? "添加中..." : "加入购物车"}
        </button>
      </div>
    </Link>
  );
}

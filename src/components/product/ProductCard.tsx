// src/components/product/ProductCard.tsx
"use client";

import Link from "next/link";
import type { Product } from "@/types";

/** 格式化价格，保留两位小数 */
function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 商品图片 */}
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            // 图片加载失败时显示占位文字
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
      <div className="p-3">
        {/* 分类标签 */}
        <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
          {product.category.name}
        </span>

        {/* 商品名称 */}
        <h3 className="mt-1.5 text-sm font-medium text-gray-900 line-clamp-2">
          {product.name}
        </h3>

        {/* 价格 */}
        <p className="mt-2 text-base font-bold text-red-500">
          {formatPrice(product.price)}
        </p>

        {/* 加入购物车按钮（占位，Step 6 实现功能） */}
        <div className="mt-2 rounded-md bg-blue-600 py-1.5 text-center text-sm text-white transition-colors hover:bg-blue-700">
          加入购物车
        </div>
      </div>
    </Link>
  );
}

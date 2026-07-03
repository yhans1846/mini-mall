// src/app/products/[id]/page.tsx — 商品详情页
"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import type { Product, Category } from "@/types";

interface ProductDetail extends Product {
  category: Category;
}

function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

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

  const { data: product, error, isLoading } = useSWR<ProductDetail>(
    `/api/products/${params.id}`,
    fetcher
  );

  const handleAddToCart = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product!.id, quantity }),
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

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      alert("添加失败，请重试");
    } finally {
      setAdding(false);
    }
  }, [product?.id, quantity, adding, router]);

  // 加载中
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="mb-6 h-6 w-32 rounded bg-gray-200" />
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

  // 错误或不存在
  if (error || !product) {
    return (
      <div className="flex flex-col items-center py-16 text-gray-500">
        <p className="text-lg">商品不存在或已下架</p>
        <Link href="/products" className="mt-3 text-sm text-blue-600 hover:underline">
          返回商品列表
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* 面包屑 */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-blue-600">商品</Link>
        <span className="mx-2">/</span>
        <Link href={`/products?categoryId=${product.categoryId}`} className="hover:text-blue-600">
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 商品大图 */}
        <div className="overflow-hidden rounded-lg bg-gray-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-6xl text-gray-400">
              {product.name.charAt(0)}
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="flex flex-col justify-start">
          {/* 分类标签 */}
          <span className="inline-block w-fit rounded bg-blue-50 px-3 py-1 text-sm text-blue-600">
            {product.category.name}
          </span>

          {/* 商品名称 */}
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{product.name}</h1>

          {/* 价格 */}
          <p className="mt-4 text-3xl font-bold text-red-500">
            {formatPrice(product.price)}
          </p>

          {/* 库存信息 */}
          <p className="mt-2 text-sm text-gray-500">
            库存：{product.stock > 0 ? `${product.stock} 件` : "暂时无货"}
          </p>

          {/* 分割线 */}
          <hr className="my-6 border-gray-200" />

          {/* 商品描述 */}
          <div className="text-sm leading-relaxed text-gray-600">
            <h3 className="mb-2 text-base font-medium text-gray-900">商品描述</h3>
            <p>{product.description}</p>
          </div>

          {/* 分割线 */}
          <hr className="my-6 border-gray-200" />

          {/* 操作区域 */}
          <div className="flex items-center gap-4">
            {/* 数量选择 */}
            <div className="flex items-center rounded-md border">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
              >
                -
              </button>
              <span className="min-w-[3rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
              >
                +
              </button>
            </div>

            {/* 加入购物车按钮 */}
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock <= 0}
              className={`flex-1 rounded-md py-3 text-sm font-medium text-white transition-colors sm:flex-none sm:px-10 ${
                added
                  ? "bg-green-500"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:bg-gray-400`}
            >
              {product.stock <= 0
                ? "暂时无货"
                : added
                  ? "已加入 ✓"
                  : adding
                    ? "添加中..."
                    : "加入购物车"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

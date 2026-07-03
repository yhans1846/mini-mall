// src/components/home/FlashSale.tsx — 限时秒杀
"use client";

import Link from "next/link";

interface FlashSaleProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  originalPrice?: number | null;
}

interface FlashSaleProps {
  products: FlashSaleProduct[];
}

export default function FlashSale({ products }: FlashSaleProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mb-8">
      {/* 标题栏 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">⚡ 限时秒杀</h2>
          <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white animate-pulse">
            限时
          </span>
        </div>
        <Link
          href="/products"
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          更多 &rarr;
        </Link>
      </div>

      {/* 秒杀商品列表 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group relative overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* 角标 */}
            <span className="absolute left-0 top-0 rounded-br-lg bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
              秒杀
            </span>

            {/* 商品信息 */}
            <div className="mt-5 min-w-0">
              <p className="truncate text-sm font-medium text-gray-800 group-hover:text-red-500 transition-colors">
                {product.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base font-bold text-red-500">
                  ¥{product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    ¥{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

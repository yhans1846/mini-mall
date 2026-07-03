// src/components/home/HotRanking.tsx — 热销排行
"use client";

import Link from "next/link";

interface HotRankingProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

interface HotRankingProps {
  products: HotRankingProduct[];
}

const RANK_BG = [
  "from-red-500 to-orange-400",   // 1st
  "from-slate-400 to-slate-300",   // 2nd
  "from-amber-600 to-yellow-500",  // 3rd
];

export default function HotRanking({ products }: HotRankingProps) {
  if (!products || products.length === 0) return null;

  const top = products.slice(0, 8);

  return (
    <section className="mb-8">
      {/* 标题栏 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">🔥 热销排行</h2>
        <Link
          href="/products"
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          更多 &rarr;
        </Link>
      </div>

      {/* 排行列表 */}
      <div className="grid grid-cols-2 gap-3">
        {top.map((product, index) => {
          const rank = index + 1;
          return (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* 排名徽标 */}
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  rank <= 3
                    ? `bg-gradient-to-br ${RANK_BG[index]}`
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {rank}
              </span>

              {/* 商品信息 */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {product.name}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-red-500">
                  ¥{product.price.toFixed(2)}
                </p>
              </div>

              {/* 商品图（右） */}
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300 text-xs">
                    暂无图片
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

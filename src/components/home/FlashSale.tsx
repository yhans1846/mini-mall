// src/components/home/FlashSale.tsx — 限时秒杀（自加载 + 倒计时）
"use client";

import Link from "next/link";
import useSWR from "swr";
import CountdownTimer from "@/components/ui/CountdownTimer";

interface FlashSaleItem {
  id: number;
  flashPrice: number;
  flashStock: number;
  startTime: string;
  endTime: string;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function FlashSale() {
  const { data: flashSales, error, isLoading } = useSWR<FlashSaleItem[]>(
    "/api/flash-sales/active",
    fetcher,
    { refreshInterval: 30000 } // 每 30 秒刷新列表
  );

  if (isLoading) return null;
  if (error || !flashSales || flashSales.length === 0) return null;

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
        {flashSales.map((fs) => {
          return (
            <Link
              key={fs.id}
              href={`/products/${fs.product.id}`}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* 角标 */}
              <span className="absolute left-0 top-0 rounded-br-lg bg-red-500 px-2 py-0.5 text-xs font-medium text-white z-10">
                秒杀
              </span>

              {/* 商品信息（左） */}
              <div className="min-w-0 flex-1 pl-1">
                <p className="text-sm font-medium text-gray-800 group-hover:text-red-500 transition-colors leading-tight">
                  {fs.product.name}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-base font-bold text-red-500">
                    ¥{fs.flashPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    ¥{fs.product.price.toFixed(2)}
                  </span>
                </div>
                {/* 倒计时 */}
                <CountdownTimer endTime={fs.endTime} className="mt-1 text-[10px]" />
              </div>

              {/* 商品图（右） */}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {fs.product.imageUrl ? (
                  <img
                    src={fs.product.imageUrl}
                    alt={fs.product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
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

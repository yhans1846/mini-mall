// src/components/home/FlashSale.tsx — 限时秒杀（含加载/错误状态）
"use client";

import Link from "next/link";
import useSWR from "swr";
import CountdownTimer from "@/components/ui/CountdownTimer";

interface FlashSaleItem {
  id: number; flashPrice: number; flashStock: number; startTime: string; endTime: string;
  product: { id: number; name: string; price: number; imageUrl: string };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function SkeletonItem() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 pl-6 space-y-2">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-5 w-24 rounded bg-gray-200" />
          <div className="h-6 w-16 rounded bg-gray-200" />
        </div>
        <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

export default function FlashSale() {
  const { data: flashSales, error, isLoading, mutate } = useSWR<FlashSaleItem[]>(
    "/api/flash-sales/active", fetcher, { refreshInterval: 30000 },
  );

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">⚡ 限时秒杀</h2>
          <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white animate-pulse">限时</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} />)}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">⚡ 限时秒杀</h2>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white py-8 text-gray-400">
          <p className="text-sm">加载失败</p>
          <button onClick={() => mutate()} className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700">重试</button>
        </div>
      </section>
    );
  }

  if (!flashSales || flashSales.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">⚡ 限时秒杀</h2>
          <span className="rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm animate-pulse">限时</span>
        </div>
        <Link href="/products" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">更多 →</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {flashSales.map((fs) => (
          <Link key={fs.id} href={`/products/${fs.product.id}`}
            className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <span className="absolute left-0 top-0 rounded-br-lg bg-gradient-to-r from-red-500 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white z-10 shadow-sm">秒杀</span>
            <div className="min-w-0 flex-1 pl-6">
              <p className="text-sm font-medium text-gray-800 group-hover:text-red-500 transition-colors leading-tight">{fs.product.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-base font-bold text-red-500">¥{fs.flashPrice.toFixed(2)}</span>
                <span className="text-xs text-gray-400 line-through">¥{fs.product.price.toFixed(2)}</span>
              </div>
              <CountdownTimer endTime={fs.endTime} className="mt-1 text-[10px]" />
            </div>
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              {fs.product.imageUrl ? (
                <img src={fs.product.imageUrl} alt={fs.product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-300">暂无图片</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

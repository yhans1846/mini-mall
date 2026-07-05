// src/app/admin/statistics/products/page.tsx — 商品统计
"use client";

import useSWR from "swr";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import { IconProduct, IconDashboard, IconCategory } from "@/components/admin/icons";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProductStatisticsPage() {
  const { data } = useSWR<any>("/api/admin/statistics/products", fetcher);

  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/statistics" className="hover:text-blue-600">统计管理</Link>
        <span>/</span>
        <span className="text-gray-800">商品统计</span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<IconProduct className="h-6 w-6" />} label="全部商品" value={data?.totalProducts || "—"} color="#409eff" />
        <StatCard icon={<IconDashboard className="h-6 w-6" />} label="已上架" value={data?.publishedCount || "—"} color="#13ce66" />
        <StatCard icon={<IconDashboard className="h-6 w-6" />} label="已下架" value={data?.unPublishedCount || "—"} color="#ffba00" />
        <StatCard icon={<IconCategory className="h-6 w-6" />} label="分类数" value={data?.categoryCount || "—"} color="#909399" />
      </div>

      {/* 热销 Top 10 */}
      <div className="admin-card mb-5">
        <div className="border-b px-5 py-3 text-sm font-semibold text-gray-800">热销商品 Top 10</div>
        {data?.topProducts?.length > 0 ? (
          <div className="divide-y">
            {data.topProducts.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  i < 3 ? "bg-gradient-to-br from-red-400 to-orange-500" : "bg-gray-300"
                }`}>{i + 1}</span>
                <span className="flex-1 text-sm text-gray-700">{p.name}</span>
                <span className="text-sm text-gray-500">¥{p.price.toFixed(2)}</span>
                <span className="text-sm font-medium text-gray-700">已售 {p.sales}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-400">暂无销售数据</div>
        )}
      </div>

      {/* 分类分布 */}
      <div className="admin-card">
        <div className="border-b px-5 py-3 text-sm font-semibold text-gray-800">分类商品分布</div>
        {data?.categoryDistribution?.length > 0 ? (
          <div className="divide-y">
            {data.categoryDistribution.map((c: any) => (
              <div key={c.category} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-gray-700">{c.category}</span>
                <span className="text-sm font-medium text-gray-600">{c.count} 件商品</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-400">暂无数据</div>
        )}
      </div>
    </div>
  );
}

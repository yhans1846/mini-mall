// src/app/admin/statistics/page.tsx — 统计管理首页（综合概览）
"use client";

import useSWR from "swr";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import { IconDashboard, IconProduct, IconOrder, IconUser, IconTrending, IconMoney, IconCategory } from "@/components/admin/icons";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StatisticsPage() {
  const { data: sales } = useSWR<any>("/api/admin/statistics/sales", fetcher);
  const { data: products } = useSWR<any>("/api/admin/statistics/products", fetcher);
  const { data: users } = useSWR<any>("/api/admin/statistics/users", fetcher);

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold text-gray-800">统计管理 · 综合概览</h1>

      {/* 销售概览 */}
      <h2 className="mb-3 text-sm font-medium text-gray-600">销售数据</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<IconMoney className="h-6 w-6" />} label="月销售额" value={sales ? `¥${sales.monthlySales.toFixed(2)}` : "—"} color="#409eff" />
        <StatCard icon={<IconTrending className="h-6 w-6" />} label="年销售额" value={sales ? `¥${sales.yearlySales.toFixed(2)}` : "—"} color="#13ce66" />
        <StatCard icon={<IconDashboard className="h-6 w-6" />} label="总销售额" value={sales ? `¥${sales.totalRevenue.toFixed(2)}` : "—"} color="#ffba00" />
        <StatCard icon={<IconOrder className="h-6 w-6" />} label="本月订单" value={sales?.orderCount || "—"} color="#ff4949" />
      </div>

      {/* 商品概览 */}
      <h2 className="mb-3 text-sm font-medium text-gray-600">商品数据</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<IconProduct className="h-6 w-6" />} label="全部商品" value={products?.totalProducts || "—"} color="#409eff" />
        <StatCard icon={<IconProduct className="h-6 w-6" />} label="已上架" value={products?.publishedCount || "—"} color="#13ce66" />
        <StatCard icon={<IconProduct className="h-6 w-6" />} label="已下架" value={products?.unPublishedCount || "—"} color="#ffba00" />
        <StatCard icon={<IconCategory />} label="分类数" value={products?.categoryCount || "—"} color="#909399" />
      </div>

      {/* 用户概览 */}
      <h2 className="mb-3 text-sm font-medium text-gray-600">用户数据</h2>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<IconUser className="h-6 w-6" />} label="总用户" value={users?.totalUsers || "—"} color="#409eff" />
        <StatCard icon={<IconUser className="h-6 w-6" />} label="本月新增" value={users?.monthlyNewUsers || "—"} color="#13ce66" />
        {users?.levelDistribution?.map((l: { level: number; count: number }) => (
          <StatCard key={l.level} icon={<IconUser className="h-6 w-6" />} label={`Lv${l.level} 用户`} value={l.count} color={["#909399", "#ffba00", "#409eff", "#13ce66"][l.level]} />
        ))}
      </div>

      {/* 快速跳转 */}
      <div className="flex gap-3">
        <Link href="/admin/statistics/sales" className="btn-primary text-sm">查看销售统计 →</Link>
        <Link href="/admin/statistics/products" className="btn-default text-sm">查看商品统计 →</Link>
        <Link href="/admin/statistics/users" className="btn-default text-sm">查看用户统计 →</Link>
      </div>
    </div>
  );
}

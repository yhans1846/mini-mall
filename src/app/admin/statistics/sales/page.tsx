// src/app/admin/statistics/sales/page.tsx — 销售统计
"use client";

import useSWR from "swr";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import { IconMoney, IconOrder, IconTrending, IconCalendar } from "@/components/admin/icons";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SalesStatisticsPage() {
  const { data } = useSWR<any>("/api/admin/statistics/sales", fetcher);

  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/statistics" className="hover:text-blue-600">统计管理</Link>
        <span>/</span>
        <span className="text-gray-800">销售统计</span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<IconMoney className="h-6 w-6" />} label="月销售额" value={data ? `¥${data.monthlySales.toFixed(2)}` : "—"} color="#409eff" />
        <StatCard icon={<IconTrending className="h-6 w-6" />} label="年销售额" value={data ? `¥${data.yearlySales.toFixed(2)}` : "—"} color="#13ce66" />
        <StatCard icon={<IconCalendar className="h-6 w-6" />} label="总销售额" value={data ? `¥${data.totalRevenue.toFixed(2)}` : "—"} color="#ffba00" />
        <StatCard icon={<IconOrder className="h-6 w-6" />} label="本月订单数" value={data?.orderCount || "—"} color="#ff4949" />
      </div>

      <div className="admin-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-800">本月每日销售额</h3>
        {data?.dailyRevenue ? (
          <RevenueChart data={data.dailyRevenue} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-gray-400">加载中...</div>
        )}
      </div>
    </div>
  );
}

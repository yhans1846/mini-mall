// src/app/admin/statistics/users/page.tsx — 用户统计
"use client";

import useSWR from "swr";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { IconUser, IconMoney, IconTrending } from "@/components/admin/icons";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const LEVEL_NAMES = ["普通会员", "心悦1级", "心悦2级", "心悦3级"];
const LEVEL_TYPES: ("default" | "warning" | "info" | "success")[] = ["default", "warning", "info", "success"];

export default function UserStatisticsPage() {
  const { data } = useSWR<any>("/api/admin/statistics/users", fetcher);

  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/statistics" className="hover:text-blue-600">统计管理</Link>
        <span>/</span>
        <span className="text-gray-800">用户统计</span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={<IconUser className="h-6 w-6" />} label="总用户数" value={data?.totalUsers || "—"} color="#409eff" />
        <StatCard icon={<IconTrending className="h-6 w-6" />} label="本月新增" value={data?.monthlyNewUsers || "—"} color="#13ce66" />
        <StatCard icon={<IconMoney className="h-6 w-6" />} label="总消费金额" value={data ? `¥${data.totalSpent.toFixed(2)}` : "—"} color="#ffba00" />
      </div>

      <div className="admin-card">
        <div className="border-b px-5 py-3 text-sm font-semibold text-gray-800">会员等级分布</div>
        {data?.levelDistribution?.length > 0 ? (
          <div className="divide-y">
            {data.levelDistribution.map((l: any) => (
              <div key={l.level} className="flex items-center justify-between px-5 py-3">
                <StatusBadge label={LEVEL_NAMES[l.level] || `Lv${l.level}`} type={LEVEL_TYPES[l.level] || "default"} />
                <span className="text-sm text-gray-600">{l.count} 人</span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-gray-50 px-5 py-3">
              <span className="text-sm font-medium text-gray-800">合计</span>
              <span className="text-sm font-medium text-gray-800">{data.totalUsers} 人</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-400">暂无数据</div>
        )}
      </div>
    </div>
  );
}

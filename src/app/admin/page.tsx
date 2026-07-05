// src/app/admin/page.tsx — 若依风格数据大屏
"use client";

import useSWR from "swr";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import MonthlyChart from "@/components/admin/charts/MonthlyChart";
import StatusPieChart from "@/components/admin/charts/StatusPieChart";
import { IconProduct, IconOrder, IconDashboard, IconUser, IconClock, IconMoney, IconTrending, IconWarning, IconCalendar } from "@/components/admin/icons";

interface DashboardData {
  products: number;
  orders: number;
  revenue: number;
  users: number;
  todayOrders: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingOrders: number;
  orderStatusDistribution: { status: string; count: number }[];
  recentOrders: { id: number; status: string; totalAmount: number; userName: string; itemCount: number; createdAt: string }[];
  topProducts: { name: string; qty: number; rev: number }[];
  lowStockProducts: { name: string; stock: number }[];
  recentUsers: { id: number; name: string; email: string; avatar: string; createdAt: string }[];
  dailyRevenue: { date: string; amount: number }[];
  monthlyDailyRevenue: { date: string; amount: number }[];
}

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error("加载失败"); return r.json(); });

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待付款", PAID: "已支付", SHIPPED: "已发货", COMPLETED: "已完成", CANCELLED: "已取消",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#ffba00", PAID: "#409eff", SHIPPED: "#909399", COMPLETED: "#13ce66", CANCELLED: "#ff4949",
};

function formatDate(d: string) {
  return new Date(d).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit" });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AdminDashboard() {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>("/api/admin/dashboard", fetcher, {
    refreshInterval: 60000,
  });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">仪表盘</h1>
        <button onClick={() => mutate()} className="btn-default flex items-center gap-1.5 text-sm">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          刷新
        </button>
      </div>

      {isLoading ? (
        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="admin-card animate-pulse p-4"><div className="mb-2 h-4 w-16 rounded bg-gray-200" /><div className="h-7 w-12 rounded bg-gray-200" /></div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="admin-card animate-pulse p-5"><div className="mb-3 h-5 w-24 rounded bg-gray-200" /><div className="h-32 rounded bg-gray-100" /></div>
            <div className="admin-card animate-pulse p-5"><div className="mb-3 h-5 w-24 rounded bg-gray-200" /><div className="h-32 rounded bg-gray-100" /></div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="admin-card animate-pulse p-5"><div className="mb-3 h-5 w-24 rounded bg-gray-200" /><div className="h-32 rounded bg-gray-100" /></div>
            <div className="admin-card animate-pulse p-5"><div className="mb-3 h-5 w-24 rounded bg-gray-200" /><div className="h-32 rounded bg-gray-100" /></div>
          </div>
        </div>
      ) : error ? (
        <div className="admin-card p-10 text-center text-sm text-gray-500">加载失败，请刷新重试</div>
      ) : !data ? null : (
        <>
          {/* 顶部统计卡片 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <StatCard icon={<IconProduct className="h-6 w-6" />} label="商品总数" value={data.products} color="#409eff" />
            <StatCard icon={<IconOrder className="h-6 w-6" />} label="订单总数" value={data.orders} color="#13ce66" />
            <StatCard icon={<IconMoney className="h-6 w-6" />} label="总销售额" value={`¥${data.revenue.toFixed(2)}`} color="#ffba00" />
            <StatCard icon={<IconUser className="h-6 w-6" />} label="用户总数" value={data.users} color="#409eff" />
            <StatCard icon={<IconClock className="h-6 w-6" />} label="待处理订单" value={data.pendingOrders} color="#ff4949" />
            <StatCard icon={<IconTrending className="h-6 w-6" />} label="本月销售额" value={`¥${data.monthRevenue.toFixed(2)}`} color="#13ce66" />
          </div>

          {/* 今日概览 */}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="admin-card flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <IconCalendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">今日订单</p>
                <p className="text-lg font-bold text-gray-800">{data.todayOrders}</p>
              </div>
            </div>
            <div className="admin-card flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-500">
                <IconMoney className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">今日收入</p>
                <p className="text-lg font-bold text-gray-800">¥{data.todayRevenue.toFixed(2)}</p>
              </div>
            </div>
            <div className="admin-card flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <IconTrending className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">本月收入</p>
                <p className="text-lg font-bold text-gray-800">¥{data.monthRevenue.toFixed(2)}</p>
              </div>
            </div>
            <div className="admin-card flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <IconWarning className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">库存预警</p>
                <p className="text-lg font-bold text-gray-800">{data.lowStockProducts.length}</p>
              </div>
            </div>
          </div>

          {/* 图表行 */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* 订单状态分布 */}
            <div className="admin-card p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-800">订单状态分布</h3>
              <StatusPieChart data={data.orderStatusDistribution} />
            </div>

            {/* 近 7 日销售额趋势 */}
            <div className="admin-card p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-800">近 7 日销售额趋势</h3>
              <RevenueChart data={data.dailyRevenue} />
            </div>
          </div>

          {/* 热销商品 + 最近订单 */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* 热销商品 Top 5 */}
            <div className="admin-card">
              <div className="border-b px-5 py-3 text-sm font-semibold text-gray-800">热销商品 Top 5</div>
              {data.topProducts.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">暂无销售数据</div>
              ) : (
                <div className="divide-y">
                  {data.topProducts.map((p, i) => {
                    const colors = ["#ff6b6b", "#ffba00", "#409eff", "#13ce66", "#909399"];
                    return (
                      <div key={i} className="flex items-center gap-3 px-5 py-3">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: colors[i] || "#909399" }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 truncate text-sm text-gray-700">{p.name}</div>
                        <div className="text-right text-xs text-gray-400">
                          <div>销量 {p.qty}</div>
                          <div className="font-medium text-gray-600">¥{p.rev.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 最近订单 */}
            <div className="admin-card">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <span className="text-sm font-semibold text-gray-800">最近订单</span>
                <Link href="/admin/orders" className="text-xs" style={{ color: "#409eff" }}>查看全部 →</Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">暂无订单</div>
              ) : (
                <div className="divide-y">
                  {data.recentOrders.map((o) => (
                    <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm text-gray-700">#{o.id} {o.userName}</div>
                        <div className="text-xs text-gray-400">{o.itemCount} 件商品 · {formatDateTime(o.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-800">¥{o.totalAmount.toFixed(2)}</div>
                        <StatusBadge label={STATUS_LABELS[o.status] || o.status} type={
                          o.status === "COMPLETED" ? "success" : o.status === "PENDING" ? "warning" : o.status === "CANCELLED" ? "danger" : o.status === "PAID" ? "info" : "default"
                        } />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 库存预警 + 最近用户 */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* 库存预警 */}
            <div className="admin-card">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <span className="text-sm font-semibold text-gray-800">库存预警</span>
                <Link href="/admin/products" className="text-xs" style={{ color: "#409eff" }}>管理商品 →</Link>
              </div>
              {data.lowStockProducts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-sm text-gray-400">
                  <IconWarning className="h-8 w-8 text-green-300" />
                  <span>库存充足，暂无预警</span>
                </div>
              ) : (
                <div className="divide-y">
                  {data.lowStockProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-gray-700">{p.name}</span>
                      <span className="text-sm font-medium" style={{ color: p.stock === 0 ? "#ff4949" : "#ffba00" }}>
                        剩余 {p.stock}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 最近注册用户 */}
            <div className="admin-card">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <span className="text-sm font-semibold text-gray-800">最近注册</span>
                <Link href="/admin/users" className="text-xs" style={{ color: "#409eff" }}>查看全部 →</Link>
              </div>
              {data.recentUsers.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">暂无用户</div>
              ) : (
                <div className="divide-y">
                  {data.recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-2.5">
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-400">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <IconUser className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm text-gray-700">{u.name}</div>
                        <div className="truncate text-xs text-gray-400">{u.email}</div>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">{formatDateTime(u.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 当月每日销售趋势 (月度柱状图) */}
          <div className="mt-5">
            <div className="admin-card p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-800">本月每日销售额</h3>
              <MonthlyChart data={data.monthlyDailyRevenue} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

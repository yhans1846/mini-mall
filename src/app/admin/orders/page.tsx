// src/app/admin/orders/page.tsx — 订单管理（支持状态/日期筛选）
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import LoadingSkeleton from "@/components/admin/LoadingSkeleton";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";
import { useDebounce } from "@/hooks/useDebounce";
import { exportToCSV } from "@/lib/export";
import { IconSearch, IconRefresh } from "@/components/admin/icons";

const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "PENDING", label: "待付款" },
  { value: "PAID", label: "已支付" },
  { value: "SHIPPED", label: "已发货" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
];

const STATUS_MAP: Record<string, { label: string; type: "success" | "warning" | "danger" | "info" | "default" }> = {
  PENDING: { label: "待付款", type: "warning" },
  PAID: { label: "已支付", type: "info" },
  SHIPPED: { label: "已发货", type: "default" },
  COMPLETED: { label: "已完成", type: "success" },
  CANCELLED: { label: "已取消", type: "danger" },
};

interface OrderItem {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: { name: string };
  items: { product: { name: string } }[];
}

interface PageData {
  orders: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (statusFilter) params.set("status", statusFilter);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (debouncedSearch) params.set("search", debouncedSearch);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/orders?${params.toString()}`,
    fetcher,
  );

  const orders: OrderItem[] = data?.orders || [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Ctrl+K 聚焦搜索
  useEffect(() => {
    const handler = () => {
      const input = document.querySelector<HTMLInputElement>('[data-search="orders"]');
      input?.focus();
    };
    document.addEventListener("admin:focus-search", handler);
    return () => document.removeEventListener("admin:focus-search", handler);
  }, []);

  const handleExport = () => {
    const data = orders.map((o) => ({
      订单号: o.id,
      用户: o.user.name,
      商品: o.items.map((i) => i.product.name).join("、"),
      金额: `¥${o.totalAmount.toFixed(2)}`,
      状态: STATUS_MAP[o.status]?.label || o.status,
      时间: new Date(o.createdAt).toLocaleString("zh-CN"),
    }));
    exportToCSV(data, [
      { key: "订单号", label: "订单号" },
      { key: "用户", label: "用户" },
      { key: "商品", label: "商品" },
      { key: "金额", label: "金额" },
      { key: "状态", label: "状态" },
      { key: "时间", label: "时间" },
    ], `订单列表_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleReset = () => {
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">订单管理</h1>
      </div>

      {/* 筛选栏 */}
      <div className="admin-card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-search w-36"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="input-search w-36"
            title="开始日期"
          />
          <span className="text-sm text-gray-400">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="input-search w-36"
            title="结束日期"
          />
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="订单号 / 用户名... (Ctrl+K)"
              className="input-search w-48 pl-9"
              data-search="orders"
            />
          </div>
          {(statusFilter || startDate || endDate || search) && (
            <button onClick={handleReset} className="btn-default text-sm">重置</button>
          )}
          <button onClick={() => mutate()} className="btn-default" title="刷新">
            <IconRefresh className="h-4 w-4" />
          </button>
          <button onClick={handleExport} className="btn-default text-sm" title="导出CSV">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出
          </button>
        </div>
      </div>

      {/* 表格 */}
      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} />
      ) : error ? (
        <ErrorState message="加载失败" onRetry={() => mutate()} />
      ) : orders.length === 0 ? (
        <EmptyState title="暂无订单" description="还没有任何订单记录" />
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead><tr>
              <th style={{ width: 80 }}>订单号</th><th>用户</th><th>商品</th>
              <th style={{ width: 100 }} className="text-right">金额</th>
              <th style={{ width: 120 }} className="text-center">状态</th>
              <th style={{ width: 160 }}>时间</th>
              <th style={{ width: 80 }} className="text-center">操作</th>
            </tr></thead>
            <tbody>
              {orders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] || { label: order.status, type: "default" as const };
                return (
                  <tr key={order.id}>
                    <td className="font-medium text-gray-800">#{order.id}</td>
                    <td className="text-gray-600">{order.user.name}</td>
                    <td className="max-w-[200px] truncate text-gray-500">
                      {order.items.map((i) => i.product.name).join("、")}
                    </td>
                    <td className="text-right font-medium">¥{order.totalAmount.toFixed(2)}</td>
                    <td className="text-center"><StatusBadge label={statusInfo.label} type={statusInfo.type} /></td>
                    <td className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString("zh-CN")}</td>
                    <td className="text-center">
                      <Link href={`/admin/orders/${order.id}`} className="text-sm font-medium transition-colors hover:underline" style={{ color: "#409eff" }}>详情</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={data?.page || page} totalPages={totalPages} total={total} onChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
      )}
    </div>
  );
}

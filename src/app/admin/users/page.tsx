// src/app/admin/users/page.tsx — 用户管理（搜索防抖 + 导出 + 统一状态组件）
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import LoadingSkeleton from "@/components/admin/LoadingSkeleton";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";
import { useDebounce } from "@/hooks/useDebounce";
import { exportToCSV } from "@/lib/export";
import { IconSearch, IconRefresh, IconUser } from "@/components/admin/icons";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  membershipLevel: number;
  totalSpent: number;
  createdAt: string;
}

interface PageData {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const LEVEL_NAMES = ["普通会员", "心悦1级", "心悦2级", "心悦3级"];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const params = new URLSearchParams();
  if (debouncedSearch) params.set("search", debouncedSearch);
  params.set("page", String(page));

  const { data, error, isLoading, mutate } = useSWR<PageData>(
    `/api/admin/users?${params.toString()}`, fetcher,
  );

  const users = data?.users || [];

  // Ctrl+K 聚焦搜索
  useEffect(() => {
    const handler = () => {
      const input = document.querySelector<HTMLInputElement>('[data-search="users"]');
      input?.focus();
    };
    document.addEventListener("admin:focus-search", handler);
    return () => document.removeEventListener("admin:focus-search", handler);
  }, []);

  const handleExport = () => {
    exportToCSV(
      users.map((u) => ({
        id: u.id, name: u.name, email: u.email,
        会员等级: LEVEL_NAMES[u.membershipLevel] || `Lv${u.membershipLevel}`,
        累计消费: `¥${u.totalSpent.toFixed(2)}`,
        注册时间: new Date(u.createdAt).toLocaleString("zh-CN"),
      })),
      [{ key: "id", label: "ID" }, { key: "name", label: "名称" }, { key: "email", label: "邮箱" }, { key: "会员等级", label: "会员等级" }, { key: "累计消费", label: "累计消费" }, { key: "注册时间", label: "注册时间" }],
      `用户列表_${new Date().toISOString().slice(0, 10)}`,
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">用户管理</h1>
      </div>

      {/* 搜索栏 */}
      <div className="admin-card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索用户名称或邮箱... (Ctrl+K)"
              className="input-search w-64 pl-9"
              data-search="users"
            />
          </div>
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

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={8} />
      ) : error ? (
        <ErrorState message="加载失败" onRetry={() => mutate()} />
      ) : users.length === 0 ? (
        <EmptyState icon={<IconUser className="h-10 w-10" />} title="暂无用户" description="还没有用户注册" />
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th style={{ width: 80 }}>头像</th>
                <th>名称</th>
                <th>邮箱</th>
                <th style={{ width: 80 }} className="text-center">角色</th>
                <th style={{ width: 100 }}>会员等级</th>
                <th style={{ width: 120 }} className="text-right">累计消费</th>
                <th style={{ width: 150 }}>注册时间</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="text-gray-400">{u.id}</td>
                  <td>
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <IconUser className="h-4 w-4" />
                      </div>
                    )}
                  </td>
                  <td className="font-medium text-gray-800">{u.name}</td>
                  <td className="text-gray-500">{u.email}</td>
                  <td className="text-center">
                    <StatusBadge label="用户" type="default" />
                  </td>
                  <td className="text-sm">{LEVEL_NAMES[u.membershipLevel] || `Lv${u.membershipLevel}`}</td>
                  <td className="text-right font-medium">¥{u.totalSpent.toFixed(2)}</td>
                  <td className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}
    </div>
  );
}

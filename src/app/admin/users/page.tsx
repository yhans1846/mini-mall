// src/app/admin/users/page.tsx — 若依风格用户管理
"use client";

import { useState } from "react";
import useSWR from "swr";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
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

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));

  const { data, error, isLoading, mutate } = useSWR<PageData>(
    `/api/admin/users?${params.toString()}`, fetcher,
  );

  const users = data?.users || [];

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
              placeholder="搜索用户名称或邮箱..."
              className="input-search w-64 pl-9"
            />
          </div>
          <button onClick={() => mutate()} className="btn-default" title="刷新">
            <IconRefresh className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="admin-card animate-pulse p-6">
          {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="mb-3 h-8 rounded bg-gray-100" />))}
        </div>
      ) : error ? (
        <div className="admin-card p-6 text-center text-sm text-gray-500">加载失败</div>
      ) : users.length === 0 ? (
        <div className="admin-card p-10 text-center text-sm text-gray-400">暂无用户</div>
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

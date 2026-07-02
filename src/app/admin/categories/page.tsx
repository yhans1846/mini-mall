// src/app/admin/categories/page.tsx — 后台分类管理
"use client";

import { useState } from "react";
import useSWR from "swr";

interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  _count: { products: number };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminCategoriesPage() {
  const { data: categories, error, isLoading, mutate } = useSWR<AdminCategory[]>("/api/admin/categories", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    if (res.ok) {
      setName("");
      setSlug("");
      setShowForm(false);
      mutate();
    } else {
      const err = await res.json();
      alert(err.error || "创建失败");
    }
    setSubmitting(false);
  };

  const handleUpdate = async (id: number) => {
    if (!editName || !editSlug) return;
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, slug: editSlug }),
    });
    if (res.ok) {
      setEditingId(null);
      mutate();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此分类？")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
    else {
      const err = await res.json();
      alert(err.error || "删除失败");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">分类管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          {showForm ? "取消" : "新增分类"}
        </button>
      </div>

      {/* 新增表单 */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 flex gap-3 rounded-lg border bg-white p-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="分类名称"
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="标识 (如 clothing)"
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            创建
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-gray-200" />
          ))}
        </div>
      ) : error ? (
        <p className="text-gray-500">加载失败</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">名称</th>
                <th className="px-4 py-3 text-left">标识</th>
                <th className="px-4 py-3 text-center">商品数</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(categories || []).map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{cat.id}</td>
                  <td className="px-4 py-3">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded border px-2 py-1 text-sm"
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="w-full rounded border px-2 py-1 text-sm"
                      />
                    ) : (
                      cat.slug
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{cat._count.products}</td>
                  <td className="px-4 py-3 text-right">
                    {editingId === cat.id ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleUpdate(cat.id)} className="text-green-600 hover:underline">保存</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline">取消</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditSlug(cat.slug); }}
                          className="text-blue-600 hover:underline"
                        >
                          编辑
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:underline">删除</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

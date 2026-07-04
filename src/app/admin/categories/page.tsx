// src/app/admin/categories/page.tsx — 若依风格分类管理（Modal 弹窗）
"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import LoadingSkeleton from "@/components/admin/LoadingSkeleton";
import ErrorState from "@/components/admin/ErrorState";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { IconAdd, IconEdit, IconDelete } from "@/components/admin/icons";

interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  _count: { products: number };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminCategoriesPage() {
  const { data: categories, error, isLoading, mutate } = useSWR<AdminCategory[]>("/api/admin/categories", fetcher);
  const { confirm, ConfirmDialog } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEdit = editingId !== null;

  const openCreate = () => { setEditingId(null); setName(""); setSlug(""); setModalOpen(true); };
  const openEdit = (cat: AdminCategory) => { setEditingId(cat.id); setName(cat.name); setSlug(cat.slug); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    setSubmitting(true);
    const url = isEdit ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug }) });
    if (res.ok) { setModalOpen(false); mutate(); toast.success(isEdit ? "分类已更新" : "分类已创建"); } else { const err = await res.json(); toast.error(err.error || "操作失败"); }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: "删除分类", message: "确定删除此分类？若分类下有商品将无法删除。", confirmText: "确定删除", variant: "danger" });
    if (!ok) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) { mutate(); toast.success("分类已删除"); } else { const err = await res.json(); toast.error(err.error || "删除失败"); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">分类管理</h1>
        <button onClick={openCreate} className="btn-primary"><IconAdd className="h-4 w-4" />新增分类</button>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={4} />
      ) : error ? (
        <ErrorState message="加载失败" onRetry={() => mutate()} />
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead><tr>
              <th style={{ width: 60 }}>ID</th><th>名称</th><th>标识</th>
              <th style={{ width: 100 }} className="text-center">商品数</th>
              <th style={{ width: 100 }} className="text-center">操作</th>
            </tr></thead>
            <tbody>
              {(categories || []).map((cat) => (
                <tr key={cat.id}>
                  <td className="text-gray-400">{cat.id}</td>
                  <td className="font-medium text-gray-800">{cat.name}</td>
                  <td className="font-mono text-xs text-gray-500">{cat.slug}</td>
                  <td className="text-center"><StatusBadge label={String(cat._count.products)} type="info" /></td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(cat)} className="rounded p-1.5 text-gray-500 transition-colors hover:text-[#409eff] hover:bg-blue-50" title="编辑"><IconEdit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="rounded p-1.5 text-gray-500 transition-colors hover:text-red-500 hover:bg-red-50" title="删除"><IconDelete className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={isEdit ? "编辑分类" : "新增分类"} onClose={() => setModalOpen(false)} width="max-w-md"
        footer={<div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={() => setModalOpen(false)} className="btn-default text-sm">取消</button>
          <button type="submit" form="category-form" disabled={submitting} className="btn-primary text-sm">{submitting ? "提交中..." : isEdit ? "保存" : "创建"}</button>
        </div>}
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">分类名称</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-search w-full" placeholder="如：服装" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">标识</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="input-search w-full" placeholder="如：clothing" required />
            <p className="mt-1 text-xs text-gray-400">URL 中使用，建议英文小写</p>
          </div>
        </form>
      </Modal>

      {ConfirmDialog}
    </div>
  );
}

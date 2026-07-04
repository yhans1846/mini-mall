// src/app/admin/products/page.tsx — 若依风格商品管理（Modal CRUD）
"use client";

import { useState } from "react";
import useSWR from "swr";
import Modal from "@/components/admin/Modal";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import { IconAdd, IconEdit, IconDelete, IconSearch, IconRefresh } from "@/components/admin/icons";

interface AdminProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  isPublished: boolean;
  category: { id: number; name: string };
}
interface Category {
  id: number;
  name: string;
  slug: string;
}
interface PageData {
  products: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const EMPTY_FORM = {
  name: "", description: "", price: "", stock: "0",
  imageUrl: "", categoryId: "", isPublished: true,
};

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  if (categoryFilter) params.set("categoryId", categoryFilter);
  if (statusFilter) params.set("status", statusFilter);

  const { data, error, isLoading, mutate } = useSWR<PageData>(
    `/api/admin/products?${params.toString()}`, fetcher,
  );
  const { data: categories } = useSWR<Category[]>("/api/admin/categories", fetcher);
  const products = data?.products || [];

  // Modal 状态
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = editingId !== null;

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (p: AdminProduct) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: "", price: p.price.toString(), stock: p.stock.toString(),
      imageUrl: "", categoryId: p.category.id.toString(), isPublished: p.isPublished,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) { alert("请填写名称、价格和分类"); return; }
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setModalOpen(false); mutate(); } else { const err = await res.json(); alert(err.error || "操作失败"); }
    } catch { alert("操作失败"); } finally { setSubmitting(false); }
  };

  const togglePublish = async (product: AdminProduct) => {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !product.isPublished }),
    });
    if (res.ok) mutate();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此商品？")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) mutate(); else alert("删除失败，该商品可能有关联订单");
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">商品管理</h1>
        <button onClick={openCreate} className="btn-primary"><IconAdd className="h-4 w-4" />新增商品</button>
      </div>

      {/* 搜索栏 */}
      <div className="admin-card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="搜索商品名称..." className="input-search w-56 pl-9" />
          </div>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="input-search w-40">
            <option value="">全部分类</option>
            {(categories || []).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-search w-36">
            <option value="">全部状态</option>
            <option value="published">已上架</option>
            <option value="unpublished">已下架</option>
          </select>
          <button onClick={() => mutate()} className="btn-default" title="刷新"><IconRefresh className="h-4 w-4" /></button>
        </div>
      </div>

      {/* 表格 */}
      {isLoading ? (
        <div className="admin-card animate-pulse p-6">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="mb-3 h-8 rounded bg-gray-100" />))}</div>
      ) : error ? (
        <div className="admin-card p-6 text-center text-sm text-gray-500">加载失败</div>
      ) : products.length === 0 ? (
        <div className="admin-card p-10 text-center text-sm text-gray-400">暂无商品</div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead><tr>
              <th style={{ width: 60 }}>ID</th><th>名称</th><th>分类</th>
              <th style={{ width: 100 }} className="text-right">价格</th><th style={{ width: 80 }} className="text-right">库存</th>
              <th style={{ width: 100 }} className="text-center">状态</th><th style={{ width: 120 }} className="text-center">操作</th>
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="text-gray-400">{p.id}</td>
                  <td className="font-medium text-gray-800">{p.name}</td>
                  <td className="text-gray-500">{p.category.name}</td>
                  <td className="text-right font-medium" style={{ color: "#409eff" }}>¥{p.price.toFixed(2)}</td>
                  <td className="text-right">{p.stock}</td>
                  <td className="text-center">
                    <button onClick={() => togglePublish(p)}>
                      <StatusBadge label={p.isPublished ? "已上架" : "已下架"} type={p.isPublished ? "success" : "info"} />
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="rounded p-1.5 text-sm text-gray-500 transition-colors hover:text-[#409eff] hover:bg-blue-50" title="编辑"><IconEdit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="rounded p-1.5 text-sm text-gray-500 transition-colors hover:text-red-500 hover:bg-red-50" title="删除"><IconDelete className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}

      {/* Modal 表单 */}
      <Modal open={modalOpen} title={isEdit ? "编辑商品" : "新增商品"} onClose={() => setModalOpen(false)} width="max-w-xl"
        footer={<div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={() => setModalOpen(false)} className="btn-default text-sm">取消</button>
          <button type="submit" form="product-form" disabled={submitting} className="btn-primary text-sm">{submitting ? "提交中..." : isEdit ? "保存" : "创建"}</button>
        </div>}
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">名称 *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-search w-full" required />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">描述</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input-search w-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">价格 *</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-search w-full" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">库存</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-search w-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">分类 *</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input-search w-full" required>
                <option value="">选择分类</option>
                {(categories || []).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">图片 URL</label>
              <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="input-search w-full" />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded" />
                <span className="text-gray-700">上架</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

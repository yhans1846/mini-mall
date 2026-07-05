// src/app/admin/products/page.tsx — 商品管理（批量操作 + Modal CRUD）
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import Modal from "@/components/admin/Modal";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import TableCheckbox from "@/components/admin/TableCheckbox";
import LoadingSkeleton from "@/components/admin/LoadingSkeleton";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { useDebounce } from "@/hooks/useDebounce";
import { exportToCSV } from "@/lib/export";
import { IconAdd, IconEdit, IconDelete, IconSearch, IconRefresh } from "@/components/admin/icons";

interface AdminProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  isPublished: boolean;
  category: { id: number; name: string };
  createdAt: string;
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
  const [pageSize, setPageSize] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { confirm, ConfirmDialog } = useConfirm();
  const debouncedSearch = useDebounce(search);

  // Ctrl+K 聚焦搜索
  useEffect(() => {
    const handler = () => {
      const input = document.querySelector<HTMLInputElement>('[data-search="products"]');
      input?.focus();
    };
    document.addEventListener("admin:focus-search", handler);
    return () => document.removeEventListener("admin:focus-search", handler);
  }, []);

  const params = new URLSearchParams();
  params.set("pageSize", String(pageSize));
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (categoryFilter) params.set("categoryId", categoryFilter);
  if (statusFilter) params.set("status", statusFilter);

  const { data, error, isLoading, mutate } = useSWR<PageData>(
    `/api/admin/products?${params.toString()}`, fetcher,
  );
  const { data: categories } = useSWR<Category[]>("/api/admin/categories", fetcher);
  const products = data?.products || [];

  // 批量选择状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));
  const someSelected = products.some((p) => selectedIds.has(p.id)) && !allSelected;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  // 批量操作
  const batchAction = async (action: "publish" | "unpublish" | "delete") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const actionLabels = { publish: "上架", unpublish: "下架", delete: "删除" };
    const ok = action === "delete"
      ? await confirm({ title: "批量删除", message: `确定删除选中的 ${ids.length} 个商品？此操作不可恢复。`, confirmText: "确定删除", variant: "danger" })
      : true;

    if (!ok) return;

    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });

    if (res.ok) {
      toast.success(`已${actionLabels[action]} ${ids.length} 个商品`);
      setSelectedIds(new Set());
      mutate();
    } else {
      const err = await res.json();
      toast.error(err.error || "批量操作失败");
    }
  };

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
    if (!form.name || !form.price || !form.categoryId) { toast.error("请填写名称、价格和分类"); return; }
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setModalOpen(false); mutate(); toast.success(isEdit ? "商品已更新" : "商品已创建"); } else { const err = await res.json(); toast.error(err.error || "操作失败"); }
    } catch { toast.error("操作失败，请重试"); } finally { setSubmitting(false); }
  };

  const togglePublish = async (product: AdminProduct) => {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !product.isPublished }),
    });
    if (res.ok) { mutate(); toast.success(product.isPublished ? "已下架" : "已上架"); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: "删除商品", message: "确定删除此商品？此操作不可恢复。", confirmText: "确定删除", variant: "danger" });
    if (!ok) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) { mutate(); toast.success("商品已删除"); } else { toast.error("删除失败，该商品可能有关联订单"); }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleExport = () => {
    exportToCSV(
      products.map((p) => ({
        id: p.id, name: p.name, 分类: p.category.name,
        价格: `¥${p.price.toFixed(2)}`, 库存: p.stock,
        状态: p.isPublished ? "已上架" : "已下架",
      })),
      [
        { key: "id", label: "ID" }, { key: "name", label: "名称" },
        { key: "分类", label: "分类" }, { key: "价格", label: "价格" },
        { key: "库存", label: "库存" }, { key: "状态", label: "状态" },
      ],
      `商品列表_${new Date().toISOString().slice(0, 10)}`,
    );
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
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="搜索商品名称... (Ctrl+K)" className="input-search w-56 pl-9" data-search="products" />
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
          <button onClick={handleExport} className="btn-default text-sm" title="导出CSV">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出
          </button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-700">已选 {selectedIds.size} 项</span>
          <div className="flex gap-2">
            <button onClick={() => batchAction("publish")} className="btn-primary text-xs">批量上架</button>
            <button onClick={() => batchAction("unpublish")} className="btn-default text-xs">批量下架</button>
            <button onClick={() => batchAction("delete")} className="btn-danger text-xs">批量删除</button>
          </div>
          <button onClick={clearSelection} className="ml-auto text-sm text-gray-400 hover:text-gray-600">取消选择</button>
        </div>
      )}

      {/* 表格 */}
      {isLoading ? (
        <LoadingSkeleton variant="table" rows={8} />
      ) : error ? (
        <ErrorState message="加载失败" onRetry={() => mutate()} />
      ) : products.length === 0 ? (
        <EmptyState title="暂无商品" description="点击右上角新增按钮添加第一个商品" action={{ label: "新增商品", onClick: openCreate }} />
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead><tr>
              <th style={{ width: 40 }}>
                <TableCheckbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} />
              </th>
              <th style={{ width: 60 }}>ID</th><th>名称</th><th>分类</th>
              <th style={{ width: 100 }} className="text-right">价格</th><th style={{ width: 80 }} className="text-right">库存</th>
              <th style={{ width: 150 }}>创建时间</th>
              <th style={{ width: 120 }} className="text-center">状态</th><th style={{ width: 120 }} className="text-center">操作</th>
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={selectedIds.has(p.id) ? "bg-blue-50/50" : ""}>
                  <td>
                    <TableCheckbox checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td className="text-gray-400">{p.id}</td>
                  <td className="font-medium text-gray-800">{p.name}</td>
                  <td className="text-gray-500">{p.category.name}</td>
                  <td className="text-right font-medium" style={{ color: "#409eff" }}>¥{p.price.toFixed(2)}</td>
                  <td className="text-right">{p.stock}</td>
                  <td className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString("zh-CN")}</td>
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

      {data && data.totalPages > 1 && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />}

      {ConfirmDialog}

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
              <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="input-search w-full" placeholder="https://..." />
              {form.imageUrl && (
                <div className="mt-2 flex h-32 items-center justify-center rounded border bg-gray-50">
                  <img src={form.imageUrl} alt="预览" className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded accent-[#409eff]" />
                <span className="text-gray-700">上架</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

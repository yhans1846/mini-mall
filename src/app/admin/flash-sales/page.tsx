// src/app/admin/flash-sales/page.tsx — 秒杀活动管理（分页 + 搜索 + 状态筛选 + 批量操作）
"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import Modal from "@/components/admin/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import TableCheckbox from "@/components/admin/TableCheckbox";
import LoadingSkeleton from "@/components/admin/LoadingSkeleton";
import ErrorState from "@/components/admin/ErrorState";
import Pagination from "@/components/admin/Pagination";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { IconAdd, IconEdit, IconDelete, IconRefresh, IconSearch } from "@/components/admin/icons";

interface FlashSaleItem {
  id: number; flashPrice: number; flashStock: number;
  startTime: string; endTime: string; isActive: boolean;
  product: { id: number; name: string; price: number };
}

interface ProductOption { id: number; name: string; price: number; }

interface PageData {
  flashSales: FlashSaleItem[]; total: number;
  page: number; pageSize: number; totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTimeLocal(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

function getStatusInfo(fs: FlashSaleItem): { label: string; type: "success" | "warning" | "danger" | "info" | "default" } {
  const now = new Date();
  const start = new Date(fs.startTime);
  const end = new Date(fs.endTime);
  if (!fs.isActive) return { label: "已禁用", type: "danger" };
  if (now < start) return { label: "未开始", type: "warning" };
  if (now > end) return { label: "已结束", type: "info" };
  return { label: "进行中", type: "success" };
}

const EMPTY_FORM = { productId: "", flashPrice: "", flashStock: "", startTime: "", endTime: "" };

export default function AdminFlashSalesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter) params.set("status", statusFilter);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  const { data, error, isLoading, mutate } = useSWR<PageData>(
    `/api/admin/flash-sales?${params.toString()}`, fetcher,
  );
  const { data: productsData } = useSWR("/api/admin/products?pageSize=500", fetcher);
  const { confirm, ConfirmDialog } = useConfirm();

  const allProducts: ProductOption[] = [];
  if (productsData && "products" in productsData) {
    allProducts.push(...(productsData as { products: ProductOption[] }).products);
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = editingId !== null;

  // 批量时间设置
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchTime, setBatchTime] = useState({ startTime: "", endTime: "" });
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const flashSales = data?.flashSales || [];

  // 全选/取消
  const allSelected = flashSales.length > 0 && flashSales.every((fs) => selectedIds.has(fs.id));
  const someSelected = flashSales.some((fs) => selectedIds.has(fs.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(flashSales.map((fs) => fs.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };
  const openCreate = () => { resetForm(); setModalOpen(true); };
  const openEdit = (fs: FlashSaleItem) => {
    setEditingId(fs.id);
    setForm({
      productId: fs.product.id.toString(), flashPrice: fs.flashPrice.toString(), flashStock: fs.flashStock.toString(),
      startTime: formatDateTimeLocal(fs.startTime), endTime: formatDateTimeLocal(fs.endTime),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.flashPrice || !form.startTime || !form.endTime) return;
    setSubmitting(true);
    const url = isEdit ? `/api/admin/flash-sales/${editingId}` : "/api/admin/flash-sales";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setModalOpen(false); mutate(); toast.success(isEdit ? "秒杀活动已更新" : "秒杀活动已创建"); } else { const err = await res.json(); toast.error(err.error || "操作失败"); }
    setSubmitting(false);
  };

  const handleToggleActive = async (fs: FlashSaleItem) => {
    const res = await fetch(`/api/admin/flash-sales/${fs.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !fs.isActive }),
    });
    if (res.ok) { mutate(); toast.success(fs.isActive ? "已禁用" : "已启用"); } else { const err = await res.json(); toast.error(err.error || "操作失败"); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: "删除秒杀活动", message: "确定删除此秒杀活动？此操作不可恢复。", confirmText: "确定删除", variant: "danger" });
    if (!ok) return;
    const res = await fetch(`/api/admin/flash-sales/${id}`, { method: "DELETE" });
    if (res.ok) { mutate(); toast.success("秒杀活动已删除"); } else { const err = await res.json(); toast.error(err.error || "删除失败"); }
  };

  // 批量开启
  const openBatchEnable = () => {
    setBatchTime({ startTime: formatDateTimeLocal(new Date().toISOString()), endTime: "" });
    setBatchModalOpen(true);
  };

  const handleBatchEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchTime.startTime || !batchTime.endTime) { toast.error("请选择开始和结束时间"); return; }
    setBatchSubmitting(true);
    const ids = Array.from(selectedIds);
    let success = 0;
    await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`/api/admin/flash-sales/${id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true, startTime: batchTime.startTime, endTime: batchTime.endTime }),
        });
        if (res.ok) success++;
      }),
    );
    setBatchSubmitting(false);
    setBatchModalOpen(false);
    clearSelection();
    mutate();
    toast.success(`批量操作完成：${success}/${ids.length} 个活动已更新`);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">秒杀活动管理</h1>
        <button onClick={openCreate} className="btn-primary"><IconAdd className="h-4 w-4" />新增活动</button>
      </div>

      {/* 搜索/筛选栏 */}
      <div className="admin-card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="搜索商品名称..."
              className="input-search w-56 pl-9" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-search w-32">
            <option value="">全部状态</option>
            <option value="active">进行中</option>
            <option value="upcoming">未开始</option>
            <option value="ended">已结束</option>
            <option value="inactive">已禁用</option>
          </select>
          <button onClick={() => mutate()} className="btn-default" title="刷新"><IconRefresh className="h-4 w-4" />刷新</button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="admin-card mb-4 flex items-center gap-3 bg-blue-50/50 px-4 py-3">
          <span className="text-sm font-medium text-blue-700">已选 {selectedIds.size} 项</span>
          <button onClick={openBatchEnable} className="btn-primary text-xs">批量开启</button>
          <button onClick={clearSelection} className="ml-auto text-sm text-gray-400 hover:text-gray-600">取消选择</button>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} />
      ) : error ? (
        <ErrorState message="加载失败" onRetry={() => mutate()} />
      ) : (
        <>
          <div className="admin-card overflow-hidden">
            <table className="admin-table">
              <thead><tr>
                <th style={{ width: 40 }}>
                  <TableCheckbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll} />
                </th>
                <th style={{ width: 50 }}>ID</th><th>商品</th><th style={{ width: 100 }}>秒杀价</th>
                <th style={{ width: 80 }}>库存</th><th style={{ width: 160 }}>开始时间</th><th style={{ width: 160 }}>结束时间</th>
                <th style={{ width: 110 }} className="text-center">状态</th><th style={{ width: 120 }} className="text-center">操作</th>
              </tr></thead>
              <tbody>
                {flashSales.map((fs) => {
                  const status = getStatusInfo(fs);
                  return (
                    <tr key={fs.id} className={selectedIds.has(fs.id) ? "bg-blue-50/50" : ""}>
                      <td>
                        <TableCheckbox checked={selectedIds.has(fs.id)} onChange={() => toggleSelect(fs.id)} />
                      </td>
                      <td className="text-gray-400">{fs.id}</td>
                      <td className="font-medium text-gray-800">{fs.product.name}</td>
                      <td><span style={{ color: "#ff4949" }} className="font-semibold">¥{fs.flashPrice.toFixed(2)}</span><span className="ml-1 text-xs text-gray-400 line-through">¥{fs.product.price.toFixed(2)}</span></td>
                      <td>{fs.flashStock}</td>
                      <td className="text-xs text-gray-500">{formatDateTime(fs.startTime)}</td>
                      <td className="text-xs text-gray-500">{formatDateTime(fs.endTime)}</td>
                      <td className="text-center"><StatusBadge label={status.label} type={status.type} /></td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(fs)} className="rounded p-1.5 text-gray-500 transition-colors hover:text-[#409eff] hover:bg-blue-50" title="编辑"><IconEdit className="h-4 w-4" /></button>
                          <button onClick={() => handleToggleActive(fs)} className="rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:text-yellow-600 hover:bg-yellow-50">{fs.isActive ? "禁用" : "启用"}</button>
                          <button onClick={() => handleDelete(fs.id)} className="rounded p-1.5 text-gray-500 transition-colors hover:text-red-500 hover:bg-red-50" title="删除"><IconDelete className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 0 && (
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total}
              onChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
          )}
        </>
      )}

      {/* 新增/编辑 Modal */}
      <Modal open={modalOpen} title={isEdit ? "编辑秒杀活动" : "新增秒杀活动"} onClose={() => setModalOpen(false)} width="max-w-xl"
        footer={<div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={() => setModalOpen(false)} className="btn-default text-sm">取消</button>
          <button type="submit" form="flash-form" disabled={submitting} className="btn-primary text-sm">{submitting ? "提交中..." : isEdit ? "保存" : "创建"}</button>
        </div>}
      >
        <form id="flash-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">商品</label>
              <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="input-search w-full" required>
                <option value="">请选择商品</option>
                {allProducts.map((p) => (<option key={p.id} value={p.id}>{p.name} (¥{p.price.toFixed(2)})</option>))}
              </select>
            </div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">秒杀价 *</label>
              <input type="number" step="0.01" value={form.flashPrice} onChange={(e) => setForm({ ...form, flashPrice: e.target.value })} className="input-search w-full" placeholder="0.00" required /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">秒杀库存</label>
              <input type="number" value={form.flashStock} onChange={(e) => setForm({ ...form, flashStock: e.target.value })} className="input-search w-full" placeholder="0" /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">开始时间 *</label>
              <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-search w-full" required /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">结束时间 *</label>
              <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-search w-full" required /></div>
          </div>
        </form>
      </Modal>

      {/* 批量开启：时间设置 Modal */}
      <Modal open={batchModalOpen} title="批量设置秒杀时间" onClose={() => setBatchModalOpen(false)} width="max-w-md"
        footer={<div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={() => setBatchModalOpen(false)} className="btn-default text-sm">取消</button>
          <button type="submit" form="batch-form" disabled={batchSubmitting} className="btn-primary text-sm">{batchSubmitting ? "提交中..." : "批量开启"}</button>
        </div>}
      >
        <form id="batch-form" onSubmit={handleBatchEnable} className="space-y-4">
          <p className="text-sm text-gray-500">将选中的 {selectedIds.size} 个秒杀活动统一设置为以下时间范围并启用：</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">开始时间 *</label>
              <input type="datetime-local" value={batchTime.startTime} onChange={(e) => setBatchTime({ ...batchTime, startTime: e.target.value })} className="input-search w-full" required /></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">结束时间 *</label>
              <input type="datetime-local" value={batchTime.endTime} onChange={(e) => setBatchTime({ ...batchTime, endTime: e.target.value })} className="input-search w-full" required /></div>
          </div>
        </form>
      </Modal>

      {ConfirmDialog}
    </div>
  );
}

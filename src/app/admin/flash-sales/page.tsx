// src/app/admin/flash-sales/page.tsx — 后台秒杀活动管理
"use client";

import { useState } from "react";
import useSWR from "swr";

interface FlashSaleItem {
  id: number;
  flashPrice: number;
  flashStock: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  product: {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
  };
}

interface PaginatedResponse {
  flashSales: FlashSaleItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ProductOption {
  id: number;
  name: string;
  price: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getStatus(fs: FlashSaleItem) {
  const now = new Date();
  const start = new Date(fs.startTime);
  const end = new Date(fs.endTime);
  if (!fs.isActive) return { label: "已禁用", cls: "bg-gray-100 text-gray-500" };
  if (now < start) return { label: "未开始", cls: "bg-yellow-100 text-yellow-700" };
  if (now > end) return { label: "已结束", cls: "bg-gray-100 text-gray-500" };
  return { label: "进行中", cls: "bg-green-100 text-green-700" };
}

export default function AdminFlashSalesPage() {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse>("/api/admin/flash-sales", fetcher);
  const { data: productsData } = useSWR<ProductOption[]>("/api/admin/products?pageSize=500", fetcher);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    productId: "",
    flashPrice: "",
    flashStock: "",
    startTime: "",
    endTime: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setForm({ productId: "", flashPrice: "", flashStock: "", startTime: "", endTime: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.flashPrice || !form.startTime || !form.endTime) return;
    setSubmitting(true);

    const url = editingId
      ? `/api/admin/flash-sales/${editingId}`
      : "/api/admin/flash-sales";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      resetForm();
      setShowForm(false);
      mutate();
    } else {
      const err = await res.json();
      alert(err.error || "操作失败");
    }
    setSubmitting(false);
  };

  const handleEdit = (fs: FlashSaleItem) => {
    setEditingId(fs.id);
    setForm({
      productId: fs.product.id.toString(),
      flashPrice: fs.flashPrice.toString(),
      flashStock: fs.flashStock.toString(),
      startTime: new Date(fs.startTime).toISOString().slice(0, 16),
      endTime: new Date(fs.endTime).toISOString().slice(0, 16),
    });
    setShowForm(true);
  };

  const handleToggleActive = async (fs: FlashSaleItem) => {
    const res = await fetch(`/api/admin/flash-sales/${fs.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !fs.isActive }),
    });
    if (res.ok) mutate();
    else {
      const err = await res.json();
      alert(err.error || "操作失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此秒杀活动？")) return;
    const res = await fetch(`/api/admin/flash-sales/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
    else {
      const err = await res.json();
      alert(err.error || "删除失败");
    }
  };

  // 收集所有商品作为下拉选项
  const allProducts: ProductOption[] = [];
  if (productsData && "products" in productsData) {
    const pd = productsData as { products: ProductOption[] };
    allProducts.push(...pd.products);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">秒杀活动管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          {showForm ? "取消" : "新增活动"}
        </button>
      </div>

      {/* 表单弹窗 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">商品</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={!!editingId}
              >
                <option value="">请选择商品</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (¥{p.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">秒杀价</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.flashPrice}
                onChange={(e) => setForm({ ...form, flashPrice: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">秒杀库存</label>
              <input
                type="number"
                min="0"
                value={form.flashStock}
                onChange={(e) => setForm({ ...form, flashStock: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">开始时间</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">结束时间</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {editingId ? "保存" : "创建"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
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
                <th className="px-4 py-3 text-left">商品</th>
                <th className="px-4 py-3 text-left">秒杀价</th>
                <th className="px-4 py-3 text-left">库存</th>
                <th className="px-4 py-3 text-left">开始时间</th>
                <th className="px-4 py-3 text-left">结束时间</th>
                <th className="px-4 py-3 text-center">状态</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.flashSales || []).map((fs) => {
                const status = getStatus(fs);
                return (
                  <tr key={fs.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{fs.id}</td>
                    <td className="px-4 py-3 font-medium">{fs.product.name}</td>
                    <td className="px-4 py-3 text-red-600 font-semibold">
                      ¥{fs.flashPrice.toFixed(2)}
                      <span className="ml-1 text-xs text-gray-400 line-through">
                        ¥{fs.product.price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{fs.flashStock}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(fs.startTime)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(fs.endTime)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(fs)} className="text-blue-600 hover:underline">
                          编辑
                        </button>
                        <button onClick={() => handleToggleActive(fs)} className="text-yellow-600 hover:underline">
                          {fs.isActive ? "禁用" : "启用"}
                        </button>
                        <button onClick={() => handleDelete(fs.id)} className="text-red-500 hover:underline">
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

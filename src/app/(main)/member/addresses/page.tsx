// src/app/member/addresses/page.tsx — 收货地址管理
"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import Link from "next/link";

interface Address {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AddressForm {
  name: string; phone: string; province: string; city: string; district: string; detail: string; isDefault: boolean;
}

const emptyForm: AddressForm = { name: "", phone: "", province: "", city: "", district: "", detail: "", isDefault: false };

export default function AddressPage() {
  const { data: addresses, error, isLoading, mutate } = useSWR<Address[]>("/api/addresses", fetcher);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof AddressForm, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditingId(null); };

  const openEdit = (addr: Address) => {
    setForm({ name: addr.name, phone: addr.phone, province: addr.province, city: addr.city, district: addr.district, detail: addr.detail, isDefault: addr.isDefault });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.province || !form.city || !form.detail) return;
    setSubmitting(true);
    const url = editingId ? `/api/addresses/${editingId}` : "/api/addresses";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { resetForm(); mutate(); }
    else { const err = await res.json(); toast.error(err.error || "操作失败"); }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该地址？")) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
  };

  const handleSetDefault = async (addr: Address) => {
    if (addr.isDefault) return;
    const res = await fetch(`/api/addresses/${addr.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addr, isDefault: true }),
    });
    if (res.ok) mutate();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/member" className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">收货地址</h1>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          新增地址
        </button>
      </div>

      {/* 表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border bg-white p-5">
          <h3 className="mb-4 font-medium text-gray-900">{editingId ? "编辑地址" : "新增地址"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="收货人姓名" required
              className="col-span-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="手机号" required
              className="col-span-1 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="text" value={form.province} onChange={e => set("province", e.target.value)} placeholder="省" required
              className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="text" value={form.city} onChange={e => set("city", e.target.value)} placeholder="市" required
              className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="text" value={form.district} onChange={e => set("district", e.target.value)} placeholder="区"
              className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="text" value={form.detail} onChange={e => set("detail", e.target.value)} placeholder="详细地址" required
              className="col-span-2 rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.isDefault} onChange={e => set("isDefault", e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            设为默认地址
          </label>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={resetForm}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">取消</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400">
              {submitting ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      )}

      {/* 地址列表 */}
      {error ? (
        <p className="py-10 text-center text-gray-500">加载失败</p>
      ) : !addresses || addresses.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center text-gray-400">
          <svg className="mx-auto mb-3 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>暂无收货地址</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{addr.name}</span>
                  <span className="text-sm text-gray-500">{addr.phone}</span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">默认</span>
                  )}
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => openEdit(addr)} className="text-blue-600 hover:underline">编辑</button>
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr)} className="text-gray-500 hover:underline">设为默认</button>
                  )}
                  <button onClick={() => handleDelete(addr.id)} className="text-red-500 hover:underline">删除</button>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {addr.province}{addr.city}{addr.district}{addr.detail}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

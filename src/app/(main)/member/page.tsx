// src/app/member/page.tsx — 会员中心（全面重设计）
"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import Link from "next/link";
import { formatPrice, MEMBERSHIP_TIERS } from "@/lib/utils";

interface MemberData {
  id: number; name: string; email: string; avatar: string;
  membershipLevel: number; totalSpent: number; createdAt: string;
  currentTier: { level: number; name: string; discountRate: number };
  nextTier: { level: number; name: string; threshold: number; discountRate: number; remaining: number; progress: number } | null;
}

interface Order { id: number; status: string; totalAmount: number; createdAt: string; items: { product: { name: string; imageUrl: string } }[] }
interface OrdersResponse { orders: Order[]; total: number; page: number; pageSize: number; totalPages: number }

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error("fail"); return r.json(); });

const LEVEL_COLORS = [
  { bg: "from-gray-500 to-gray-600", badge: "bg-gray-100 text-gray-700" },
  { bg: "from-amber-400 to-orange-500", badge: "bg-amber-50 text-amber-700" },
  { bg: "from-blue-400 to-blue-600", badge: "bg-blue-50 text-blue-700" },
  { bg: "from-emerald-400 to-emerald-600", badge: "bg-emerald-50 text-emerald-700" },
];

const ORDER_STATS = [
  { status: "PENDING", label: "待付款", color: "text-amber-600 bg-amber-50" },
  { status: "SHIPPED", label: "已发货", color: "text-violet-600 bg-violet-50" },
  { status: "COMPLETED", label: "已完成", color: "text-emerald-600 bg-emerald-50" },
];

export default function MemberPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { data: member, error, isLoading, mutate } = useSWR<MemberData>(session ? "/api/member" : null, fetcher);
  const { data: recentOrders } = useSWR<OrdersResponse>(session ? "/api/orders?page=1&pageSize=3" : null, fetcher);
  // 各状态订单数量
  const { data: pendingData } = useSWR<OrdersResponse>(session ? "/api/orders?page=1&pageSize=1&status=PENDING" : null, fetcher);
  const { data: shippedData } = useSWR<OrdersResponse>(session ? "/api/orders?page=1&pageSize=1&status=SHIPPED" : null, fetcher);
  const { data: completedData } = useSWR<OrdersResponse>(session ? "/api/orders?page=1&pageSize=1&status=COMPLETED" : null, fetcher);

  const orderCounts = [
    { status: "PENDING", label: "待付款", color: "text-amber-600 bg-amber-50", count: pendingData?.total || 0 },
    { status: "SHIPPED", label: "已发货", color: "text-violet-600 bg-violet-50", count: shippedData?.total || 0 },
    { status: "COMPLETED", label: "已完成", color: "text-emerald-600 bg-emerald-50", count: completedData?.total || 0 },
  ];

  // 昵称编辑
  const [showNickname, setShowNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameSubmitting, setNicknameSubmitting] = useState(false);
  // 密码修改
  const [showPassword, setShowPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  // 头像裁剪
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1.8);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [avatarSubmitting, setAvatarSubmitting] = useState(false);

  const levelColor = LEVEL_COLORS[member?.membershipLevel || 0];

  // 头像上传
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropMouseDown = (e: React.MouseEvent) => { setIsDragging(true); setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }); };
  const handleCropMouseMove = (e: React.MouseEvent) => { if (!isDragging) return; setCropOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleCropMouseUp = () => setIsDragging(false);

  const handleCropConfirm = async () => {
    if (!rawImage || !imageRef.current || !containerRef.current) return;
    setAvatarSubmitting(true);
    try {
      const img = imageRef.current;
      const container = containerRef.current;
      const cr = container.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      const sx = (-cropOffset.x) / cropZoom;
      const sy = (-cropOffset.y) / cropZoom;
      const sw = 200 / cropZoom;
      const sh = 200 / cropZoom;
      const canvas = document.createElement("canvas");
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 200, 200);
      const base64 = canvas.toDataURL("image/jpeg", 0.9);
      const res = await fetch("/api/member/avatar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "上传失败"); return; }
      setRawImage(null);
      mutate();
      updateSession();
    } finally { setAvatarSubmitting(false); }
  };

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setNicknameSubmitting(true);
    const res = await fetch("/api/member/profile", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nickname.trim() }),
    });
    if (res.ok) { setShowNickname(false); mutate(); updateSession(); }
    else { const err = await res.json(); toast.error(err.error || "修改失败"); }
    setNicknameSubmitting(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 6) { setPasswordError("新密码不能少于6位"); return; }
    setPasswordSubmitting(true);
    const res = await fetch("/api/member/password", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (res.ok) { toast.success("密码修改成功"); setShowPassword(false); setOldPassword(""); setNewPassword(""); }
    else { const err = await res.json(); setPasswordError(err.error || "修改失败"); }
    setPasswordSubmitting(false);
  };

  if (status === "unauthenticated") { router.push("/auth/login"); return null; }

  if (status === "loading" || isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-24 rounded-2xl bg-gray-100" />
          <div className="h-48 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <p className="text-lg">加载失败</p>
        <button onClick={() => mutate()} className="mt-3 text-sm text-blue-600 hover:underline">重试</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      {/* ===== 用户信息卡片（玻璃质感） ===== */}
      <div className={`relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br ${levelColor.bg} p-6 text-white shadow-lg`}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="h-16 w-16 cursor-pointer overflow-hidden rounded-full ring-2 ring-white/40" onClick={() => fileInputRef.current?.click()}>
              {member.avatar ? (
                <img src={member.avatar} alt="头像" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black/20 text-xl font-bold">{member.name.charAt(0)}</div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition hover:opacity-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold">{member.name}</h2>
              <button onClick={() => { setNickname(member.name); setShowNickname(true); }} className="shrink-0 rounded p-1 hover:bg-white/20">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
            </div>
            <p className="mt-0.5 text-sm text-white/80">{member.currentTier.name} · {formatPrice(member.totalSpent)}</p>
            <p className="text-xs text-white/60">注册于 {new Date(member.createdAt).toLocaleDateString("zh-CN")}</p>
          </div>
        </div>
        {member.nextTier ? (
          <div className="relative z-10 mt-4">
            <div className="flex justify-between text-xs text-white/70"><span>距 {member.nextTier.name} 还差 {formatPrice(member.nextTier.remaining)}</span><span>{member.nextTier.progress}%</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white/60 transition-all" style={{ width: `${member.nextTier.progress}%` }} /></div>
          </div>
        ) : (
          <p className="relative z-10 mt-3 text-sm text-yellow-200">🌟 已达最高等级，感谢您的支持！</p>
        )}
      </div>

      {/* ===== 订单统计卡片 ===== */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {orderCounts.map((s) => (
          <Link key={s.status} href={`/orders?status=${s.status}`}
            className={`rounded-xl ${s.color} p-3 text-center transition-all hover:shadow-md hover:-translate-y-0.5`}>
            <p className="text-xl font-bold">{s.count}</p>
            <p className="mt-0.5 text-xs">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* ===== 等级权益表 ===== */}
      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">等级权益</h3>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {MEMBERSHIP_TIERS.map((tier) => {
            const isCurrent = tier.level === member.membershipLevel;
            return (
              <div key={tier.level} className={`rounded-lg p-2 ${isCurrent ? "ring-2 ring-blue-500 bg-blue-50" : "bg-gray-50"}`}>
                <div className="font-medium text-gray-800">{tier.name}</div>
                <div className="mt-1 text-gray-500">{tier.discountRate < 1 ? `${(tier.discountRate * 10).toFixed(1)}折` : "无折扣"}</div>
                {tier.threshold > 0 && <div className="mt-1 text-gray-400">¥{tier.threshold.toLocaleString()}</div>}
                {isCurrent && <div className="mt-1 text-[10px] font-medium text-blue-600">当前</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== 最近订单 ===== */}
      {recentOrders?.orders && recentOrders.orders.length > 0 && (
        <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">最近订单</h3>
            <Link href="/orders" className="text-xs text-blue-600 hover:underline">查看全部 →</Link>
          </div>
          <div className="space-y-2">
            {recentOrders.orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-gray-700">#{order.id} {order.items[0]?.product.name}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("zh-CN")}</p>
                </div>
                <p className="text-sm font-medium text-red-500">{formatPrice(order.totalAmount)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ===== 功能入口 ===== */}
      <div className="mb-4 divide-y overflow-hidden rounded-xl border bg-white shadow-sm">
        <Link href="/orders" className="flex items-center gap-3 px-5 py-4 transition hover:bg-gray-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
          </div>
          <div className="flex-1"><p className="text-sm font-medium text-gray-900">我的订单</p><p className="text-xs text-gray-500">查看和管理所有订单</p></div>
          <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </Link>
        <Link href="/member/addresses" className="flex items-center gap-3 px-5 py-4 transition hover:bg-gray-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div className="flex-1"><p className="text-sm font-medium text-gray-900">收货地址</p><p className="text-xs text-gray-500">管理收货地址</p></div>
          <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </Link>
        <button onClick={() => { setOldPassword(""); setNewPassword(""); setPasswordError(""); setShowPassword(true); }}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gray-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <div className="flex-1"><p className="text-sm font-medium text-gray-900">修改密码</p><p className="text-xs text-gray-500">修改登录密码</p></div>
          <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* ===== 退出登录 ===== */}
      <button onClick={() => signOut({ redirectTo: "/auth/login" })}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-5 py-3 text-sm text-red-500 transition hover:bg-red-50 hover:border-red-200">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        退出登录
      </button>

      {/* ===== 昵称编辑弹窗 ===== */}
      {showNickname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNickname(false)}>
          <div className="w-80 rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-medium text-gray-900">修改昵称</h3>
            <form onSubmit={handleNicknameSubmit}>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={20} placeholder="请输入新昵称" autoFocus
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"/>
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNickname(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">取消</button>
                <button type="submit" disabled={nicknameSubmitting || !nickname.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== 密码修改弹窗 ===== */}
      {showPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowPassword(false)}>
          <div className="w-80 rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-medium text-gray-900">修改密码</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="原密码" required autoFocus
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"/>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="新密码（至少6位）" required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"/>
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowPassword(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">取消</button>
                <button type="submit" disabled={passwordSubmitting || !oldPassword || newPassword.length < 6}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400">确认修改</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== 头像裁剪弹窗 ===== */}
      {rawImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-medium text-gray-900">裁剪头像</h3>
            <div ref={containerRef}
              className="relative mx-auto h-64 w-64 cursor-move overflow-hidden rounded-full bg-gray-100"
              onMouseDown={handleCropMouseDown} onMouseMove={handleCropMouseMove} onMouseUp={handleCropMouseUp} onMouseLeave={handleCropMouseUp}>
              <img ref={imageRef} src={rawImage} alt="裁剪预览" className="pointer-events-none absolute"
                style={{ width: `${cropZoom * 100}%`, height: `${cropZoom * 100}%`, maxWidth: "none", objectFit: "cover", transform: `translate(${cropOffset.x}px, ${cropOffset.y}px)` }} draggable={false} />
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">拖动图片调整位置</p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button onClick={() => setCropZoom(z => Math.max(0.5, z - 0.2))} className="flex h-7 w-7 items-center justify-center rounded-full border text-gray-500 hover:bg-gray-100" title="缩小">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/></svg>
              </button>
              <span className="w-12 text-center text-xs text-gray-500">{Math.round(cropZoom * 100)}%</span>
              <button onClick={() => setCropZoom(z => Math.min(4, z + 0.2))} className="flex h-7 w-7 items-center justify-center rounded-full border text-gray-500 hover:bg-gray-100" title="放大">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setRawImage(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">取消</button>
              <button onClick={handleCropConfirm} disabled={avatarSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-blue-400">
                {avatarSubmitting ? "上传中..." : "确认"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

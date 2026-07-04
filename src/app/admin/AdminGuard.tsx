// src/app/admin/AdminGuard.tsx — 后台权限守卫（若依风格）
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#f0f2f5" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200" style={{ borderTopColor: "#409eff" }} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ backgroundColor: "#f0f2f5" }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <svg className="h-8 w-8" style={{ color: "#409eff" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-800">请先登录</h1>
        <p className="text-sm text-gray-500">需要登录后才能访问管理后台</p>
        <Link href="/auth/login" className="btn-primary">去登录</Link>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ backgroundColor: "#f0f2f5" }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg className="h-8 w-8" style={{ color: "#ff4949" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-800">无权限访问</h1>
        <p className="text-sm text-gray-500">当前账号没有管理后台的访问权限</p>
        <Link href="/" className="btn-primary">返回首页</Link>
      </div>
    );
  }

  return <>{children}</>;
}

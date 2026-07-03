// src/app/admin/AdminGuard.tsx — 后台权限守卫
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // 加载中
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  // 未登录
  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="text-6xl">🔒</div>
        <h1 className="text-xl font-bold text-gray-900">请先登录</h1>
        <p className="text-sm text-gray-500">需要登录后才能访问管理后台</p>
        <Link
          href="/auth/login"
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          去登录
        </Link>
      </div>
    );
  }

  // 已登录但非管理员
  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="text-6xl">⛔</div>
        <h1 className="text-xl font-bold text-gray-900">无权限访问</h1>
        <p className="text-sm text-gray-500">当前账号没有管理后台的访问权限</p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          返回首页
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

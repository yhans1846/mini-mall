// src/app/admin/layout.tsx — 后台布局（侧边栏 + 内容区）
import type { Metadata } from "next";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminGuard from "./AdminGuard";

export const metadata: Metadata = {
  title: "管理后台 - Mini Mall",
  icons: "/admin-favicon.svg",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </AdminGuard>
  );
}

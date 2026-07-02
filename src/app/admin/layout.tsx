// src/app/admin/layout.tsx — 后台布局（侧边栏 + 内容区）
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}

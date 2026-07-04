// src/app/admin/layout.tsx — 若依风格三栏布局
import type { Metadata } from "next";
import { SidebarProvider } from "@/components/admin/SidebarContext";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
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
      <SidebarProvider>
        <div className="flex min-h-screen" style={{ backgroundColor: "#f0f2f5" }}>
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Navbar />
            <main className="flex-1 p-5">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
}

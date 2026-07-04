// src/app/admin/layout.tsx — 三栏布局（SWRConfig + Toaster + 快捷键）
import type { Metadata } from "next";
import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/swr-config";
import { SidebarProvider } from "@/components/admin/SidebarContext";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";
import Toaster from "@/components/admin/Toaster";
import KeyboardShortcuts from "./KeyboardShortcuts";
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
      <SWRConfig value={swrConfig}>
        <SidebarProvider>
          <div className="flex min-h-screen" style={{ backgroundColor: "#f0f2f5" }}>
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <Navbar />
              <main className="flex-1 p-5">{children}</main>
            </div>
          </div>
          <Toaster />
          <KeyboardShortcuts />
        </SidebarProvider>
      </SWRConfig>
    </AdminGuard>
  );
}

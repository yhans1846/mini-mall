// src/components/admin/Sidebar.tsx — 若依风格暗色侧边栏
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import {
  IconDashboard, IconProduct, IconFlash,
  IconOrder, IconCategory, IconUser, IconHome,
} from "./icons";

const NAV_ITEMS = [
  { href: "/admin", label: "仪表盘", icon: IconDashboard },
  { href: "/admin/products", label: "商品管理", icon: IconProduct },
  { href: "/admin/flash-sales", label: "秒杀活动", icon: IconFlash },
  { href: "/admin/orders", label: "订单管理", icon: IconOrder },
  { href: "/admin/users", label: "用户管理", icon: IconUser },
  { href: "/admin/categories", label: "分类管理", icon: IconCategory },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside
      className="flex shrink-0 flex-col transition-all duration-300"
      style={{
        width: collapsed ? 64 : 200,
        backgroundColor: "#1a1f2e",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center justify-center border-b"
        style={{ borderColor: "#101420" }}
      >
        <Link href="/admin" className="flex items-center gap-2">
          {collapsed ? (
            <span className="text-xl font-bold text-white">M</span>
          ) : (
            <span className="text-lg font-bold tracking-wide text-white">Mini Mall</span>
          )}
        </Link>
      </div>

      {/* 导航 */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "text-white"
                  : "text-[#bfcbd9] hover:bg-white/5 hover:text-white"
              }`}
              style={active ? { backgroundColor: "#409eff" } : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* 底部：返回前台 */}
      <div className="border-t p-3" style={{ borderColor: "#101420" }}>
        <Link
          href="/"
          className="flex items-center gap-2 rounded px-3 py-2 text-xs text-[#bfcbd9] transition-colors hover:text-white"
          title="返回前台"
        >
          <IconHome className="h-4 w-4" />
          {!collapsed && <span>返回前台</span>}
        </Link>
      </div>
    </aside>
  );
}

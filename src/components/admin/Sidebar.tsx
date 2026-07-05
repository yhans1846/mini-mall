// src/components/admin/Sidebar.tsx — 暗色侧边栏（支持子菜单）
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import {
  IconDashboard, IconProduct, IconFlash,
  IconOrder, IconCategory, IconUser, IconHome, IconTrending,
} from "./icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { href: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "仪表盘", icon: IconDashboard },
  { href: "/admin/products", label: "商品管理", icon: IconProduct },
  { href: "/admin/categories", label: "分类管理", icon: IconCategory },
  { href: "/admin/flash-sales", label: "秒杀活动", icon: IconFlash },
  { href: "/admin/orders", label: "订单管理", icon: IconOrder },
  { href: "/admin/users", label: "用户管理", icon: IconUser },
  {
    href: "/admin/statistics", label: "统计管理", icon: IconTrending,
    children: [
      { href: "/admin/statistics", label: "综合概览" },
      { href: "/admin/statistics/sales", label: "销售统计" },
      { href: "/admin/statistics/products", label: "商品统计" },
      { href: "/admin/statistics/users", label: "用户统计" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    // 默认展开当前路径所在的父菜单
    const set = new Set<string>();
    NAV_ITEMS.forEach((item) => {
      if (item.children && pathname.startsWith(item.href)) set.add(item.href);
    });
    return set;
  });

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href); else next.add(href);
      return next;
    });
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const expanded = expandedMenus.has(item.href);

    if (collapsed && hasChildren) {
      // 折叠态：只显示父级图标，子菜单隐藏
      return (
        <Link
          key={item.href}
          href={item.children![0].href}
          className={`group relative mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
            active ? "text-white" : "text-[#bfcbd9] hover:bg-white/5 hover:text-white"
          }`}
          style={active ? { backgroundColor: "rgba(64,158,255,0.2)" } : undefined}
          title={item.label}
        >
          {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" style={{ backgroundColor: "#409eff" }} />}
          <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Icon className="h-4 w-4" />
          </span>
        </Link>
      );
    }

    return (
      <div key={item.href} className="mb-1">
        {hasChildren ? (
          <button
            onClick={() => toggleMenu(item.href)}
            className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
              active ? "text-white" : "text-[#bfcbd9] hover:bg-white/5 hover:text-white"
            }`}
            style={active ? { backgroundColor: "rgba(64,158,255,0.2)" } : undefined}
            title={collapsed ? item.label : undefined}
          >
            {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" style={{ backgroundColor: "#409eff" }} />}
            <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
              <Icon className="h-4 w-4" />
            </span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
              active ? "text-white" : "text-[#bfcbd9] hover:translate-x-0.5 hover:bg-white/5 hover:text-white"
            }`}
            style={active ? { backgroundColor: "rgba(64,158,255,0.2)" } : undefined}
            title={collapsed ? item.label : undefined}
          >
            {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" style={{ backgroundColor: "#409eff" }} />}
            <span className={`shrink-0 transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
              <Icon className="h-4 w-4" />
            </span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )}
        {/* 子菜单 */}
        {!collapsed && hasChildren && expanded && (
          <div className="ml-3 mt-0.5 border-l pl-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {item.children!.map((child) => {
              const childActive = isActive(child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block rounded-md px-3 py-2 text-xs transition-all duration-200 ${
                    childActive
                      ? "font-medium text-white"
                      : "text-[#8f97b0] hover:text-white"
                  }`}
                  style={childActive ? { backgroundColor: "rgba(64,158,255,0.15)" } : undefined}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className="flex shrink-0 flex-col transition-all duration-300"
      style={{
        width: collapsed ? 64 : 200,
        background: "linear-gradient(180deg, #1a1f2e 0%, #1e2640 100%)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center justify-center border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "linear-gradient(135deg, rgba(64,158,255,0.15) 0%, transparent 100%)" }}
      >
        <Link href="/admin" className="flex items-center gap-2">
          {collapsed ? (
            <span className="text-xl font-bold text-white">M</span>
          ) : (
            <span className="text-lg font-bold tracking-wide text-white">Mini Mall</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map(renderNavItem)}
      </nav>

      {/* 底部：返回前台 */}
      <div className="border-t p-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#bfcbd9] transition-all duration-200 hover:translate-x-0.5 hover:text-white"
          title="返回前台"
        >
          <IconHome className="h-4 w-4" />
          {!collapsed && <span>返回前台</span>}
        </Link>
      </div>
    </aside>
  );
}

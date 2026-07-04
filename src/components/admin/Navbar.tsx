// src/components/admin/Navbar.tsx — 顶部导航栏（面包屑 + 用户信息）
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { IconHamburger, IconUser, IconLogout } from "./icons";

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin": "仪表盘",
  "/admin/products": "商品管理",
  "/admin/flash-sales": "秒杀活动",
  "/admin/orders": "订单管理",
  "/admin/categories": "分类管理",
  "/admin/users": "用户管理",
};

/** 根据 pathname 自动生成面包屑 */
function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string }[] = [];

  crumbs.push({ label: "首页" });

  let current = "";
  for (const seg of segments) {
    if (seg === "admin") continue;
    current = `/admin/${seg}`;
    if (BREADCRUMB_MAP[current]) {
      crumbs.push({ label: BREADCRUMB_MAP[current] });
    } else {
      const parentLabel = crumbs[crumbs.length - 1]?.label || "详情";
      if (parentLabel === "订单管理") {
        crumbs.push({ label: `订单 #${seg}` });
      } else {
        crumbs.push({ label: "详情" });
      }
      break;
    }
  }

  return crumbs;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
}

export default function Navbar() {
  const { toggle, collapsed } = useSidebar();
  const crumbs = useBreadcrumb();
  const router = useRouter();
  const [adminName, setAdminName] = useState("管理员");

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data: AdminUser | null) => {
        if (data?.name) setAdminName(data.name);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin-login");
    router.refresh();
  };

  return (
    <header
      className="flex h-14 items-center justify-between border-b bg-white px-4"
      style={{ borderColor: "#e6e6e6" }}
    >
      {/* 左侧：汉堡菜单 + 面包屑 */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100"
          title={collapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
          <IconHamburger className="h-5 w-5" />
        </button>

        <nav className="flex items-center gap-1 text-sm text-gray-500">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="mx-1 text-gray-300">/</span>}
              <span className={i === crumbs.length - 1 ? "font-medium text-gray-800" : ""}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* 右侧：用户信息 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <IconUser className="h-4 w-4" />
          <span>{adminName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-500 transition-colors hover:text-red-500"
          title="退出登录"
        >
          <IconLogout className="h-4 w-4" />
          <span>退出</span>
        </button>
      </div>
    </header>
  );
}

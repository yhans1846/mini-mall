// src/components/layout/AdminSidebar.tsx — 后台侧边栏
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "仪表盘", icon: "📊" },
  { href: "/admin/products", label: "商品管理", icon: "📦" },
  { href: "/admin/orders", label: "订单管理", icon: "📋" },
  { href: "/admin/categories", label: "分类管理", icon: "🏷️" },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r bg-white">
      <div className="p-4">
        <Link href="/admin" className="text-lg font-bold text-blue-600">
          后台管理
        </Link>
      </div>
      <nav className="space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t p-4">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-blue-600"
        >
          ← 返回前台
        </Link>
      </div>
    </aside>
  );
}

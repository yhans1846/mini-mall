"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

/** 导航链接配置 */
const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/products", label: "商品" },
] as const;

/** 登录后可见的路由前缀 */
const AUTH_PREFIXES = ["/cart", "/orders", "/member"];

/** 判断路径是否匹配导航项 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // 对于商品等分组路由，用前缀匹配
  if (href === "/products") return pathname === "/products" || pathname.startsWith("/products/");
  // 其余用精确前缀匹配
  return pathname === href || pathname.startsWith(href + "/");
}

/** 渲染单个导航链接（桌面和移动共用） */
function NavLink({
  href,
  label,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
}) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  // session 加载中，渲染空白占位防闪烁
  if (status === "loading") {
    return (
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-xl font-bold text-blue-600">Mini Mall</span>
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </header>
    );
  }

  // 登录态相关链接
  const authedItems = session
    ? [
        { href: "/cart", label: "购物车" },
        { href: "/orders", label: "我的订单" },
        { href: "/member", label: "会员中心" },
      ]
    : [];

  const adminItems = isAdmin
    ? [{ href: "/admin", label: "后台管理" }]
    : [];

  const allItems = [...NAV_ITEMS, ...authedItems, ...adminItems];

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-600">Mini Mall</span>
        </Link>

        {/* 桌面导航 */}
        <nav aria-label="主导航" className="hidden items-center gap-1 md:flex">
          {allItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              pathname={pathname}
            />
          ))}
        </nav>

        {/* 桌面右侧：用户信息 */}
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {session.user?.name}
              </span>
              <button
                onClick={() =>
                  signOut({ redirectTo: "/" }).catch(() => {
                    /* signOut 网络失败静默处理 */
                  })
                }
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                退出
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                登录
              </Link>
              <Link
                href="/auth/register"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                注册
              </Link>
            </div>
          )}
        </div>

        {/* 移动端汉堡按钮 */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* 移动端菜单遮罩 */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* 移动端菜单 */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="absolute left-0 right-0 z-50 border-t bg-white md:hidden"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeMenu();
          }}
        >
          <nav aria-label="移动端导航" className="flex flex-col px-4 py-3">
            {allItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                pathname={pathname}
                onClick={closeMenu}
              />
            ))}
            <hr className="my-2 border-gray-200" />
            {session ? (
              <div className="flex flex-col gap-2 px-3 py-2">
                <span className="text-sm text-gray-600">
                  {session.user?.name}
                </span>
                <button
                  onClick={() =>
                    signOut({ redirectTo: "/" }).catch(() => {
                      /* signOut 网络失败静默处理 */
                    })
                  }
                  className="rounded-md px-0 py-1 text-left text-sm text-gray-600 hover:text-gray-900"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2">
                <Link
                  href="/auth/login"
                  onClick={closeMenu}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  登录
                </Link>
                <Link
                  href="/auth/register"
                  onClick={closeMenu}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";

/** 导航链接配置 */
const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/products", label: "商品" },
] as const;

/** 购物车 API 返回类型 */
interface CartItemCount { id: number }

/** 判断路径是否匹配导航项 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/products") return pathname === "/products" || pathname.startsWith("/products/");
  return pathname === href || pathname.startsWith(href + "/");
}

/** 渲染单个导航链接（带下划线动画） */
function NavLink({ href, label, pathname, onClick }: { href: string; label: string; pathname: string; onClick?: () => void }) {
  const active = isActive(pathname, href);
  return (
    <Link href={href} onClick={onClick}
      className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {label}
      {active && <span className="absolute bottom-0 left-1/2 h-0.5 w-4/5 -translate-x-1/2 rounded-full bg-blue-600" />}
    </Link>
  );
}

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const isAdmin = session?.user?.role === "ADMIN";

  // 获取购物车数量
  const { data: cartItems } = useSWR<CartItemCount[]>(
    session ? "/api/cart" : null,
    (url: string) => fetch(url).then((r) => r.ok ? r.json() : null),
    { refreshInterval: 30000 },
  );
  const cartCount = cartItems?.length || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput("");
    }
  };

  // session 加载中
  if (status === "loading") {
    return (
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-xl font-bold text-blue-600">Mini Mall</span>
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
        </div>
      </header>
    );
  }

  const authedItems = session
    ? [{ href: "/cart", label: "购物车" }, { href: "/orders", label: "我的订单" }, { href: "/member", label: "会员中心" }]
    : [];

  const allItems = [...NAV_ITEMS, ...authedItems];

  function closeMenu() { setMenuOpen(false); }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-xl font-bold text-blue-600">Mini Mall</span>
        </Link>

        {/* 桌面导航 */}
        <nav aria-label="主导航" className="hidden items-center gap-1 md:flex">
          {allItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
          ))}
        </nav>

        {/* 搜索框（桌面） */}
        <form onSubmit={handleSearch} className="hidden flex-1 max-w-xs md:flex">
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索商品..." className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
          </div>
        </form>

        {/* 桌面右侧：用户信息 */}
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <a href="/admin" target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50">
                  后台管理
                </a>
              )}
              {/* 购物车图标 + 角标 */}
              <Link href="/cart" className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100" title="购物车">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              <Link href="/member" className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
                {session.user?.avatar ? (
                  <img src={session.user.avatar} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-gray-100" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                    {(session.user?.name || "U").charAt(0)}
                  </div>
                )}
                <span>{session.user?.name}</span>
              </Link>
              <button onClick={() => signOut({ redirectTo: "/" }).catch(() => {})}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                退出
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">登录</Link>
              <Link href="/auth/register" className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md">注册</Link>
            </div>
          )}
        </div>

        {/* 移动端汉堡按钮 */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden" aria-label={menuOpen ? "关闭菜单" : "打开菜单"} aria-expanded={menuOpen} aria-controls="mobile-menu">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 移动端菜单 */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={closeMenu} aria-hidden="true" />
          <div id="mobile-menu" className="absolute left-0 right-0 z-50 border-t bg-white md:hidden" onKeyDown={(e) => { if (e.key === "Escape") closeMenu(); }}>
            <nav className="flex flex-col px-4 py-3">
              {/* 移动端搜索 */}
              <form onSubmit={(e) => { handleSearch(e); closeMenu(); }} className="mb-3">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="搜索商品..." className="w-full rounded-full border border-gray-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400" />
                </div>
              </form>
              {allItems.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} onClick={closeMenu} />
              ))}
              <hr className="my-2 border-gray-200" />
              {session ? (
                <div className="flex flex-col gap-2 px-3 py-2">
                  {isAdmin && (
                    <a href="/admin" target="_blank" rel="noopener noreferrer" onClick={closeMenu}
                      className="rounded-lg px-0 py-1 text-left text-sm font-medium text-orange-600">后台管理</a>
                  )}
                  <Link href="/member" onClick={closeMenu} className="flex items-center gap-2 text-sm text-gray-600">
                    {session.user?.avatar ? (
                      <img src={session.user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                        {(session.user?.name || "U").charAt(0)}
                      </div>
                    )}
                    <span>{session.user?.name}</span>
                  </Link>
                  <button onClick={() => signOut({ redirectTo: "/" }).catch(() => {})}
                    className="rounded-lg px-0 py-1 text-left text-sm text-gray-600">退出</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2">
                  <Link href="/auth/login" onClick={closeMenu} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">登录</Link>
                  <Link href="/auth/register" onClick={closeMenu} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">注册</Link>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

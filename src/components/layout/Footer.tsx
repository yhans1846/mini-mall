import Link from "next/link";
import CopyrightYear from "./CopyrightYear";

const quickLinks = [
  { href: "/", label: "首页" },
  { href: "/products", label: "商品" },
  { href: "/cart", label: "购物车" },
  { href: "/orders", label: "我的订单" },
];

const serviceLinks = [
  { href: "/member", label: "会员中心" },
  { href: "/auth/login", label: "登录" },
  { href: "/auth/register", label: "注册" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* 品牌信息 */}
          <div>
            <h3 className="mb-3 text-lg font-bold text-blue-600">Mini Mall</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              微型电商平台，提供精选商品与优质购物体验。
            </p>
            <div className="mt-4 flex gap-3">
              {["微信", "微博", "客服"].map((name) => (
                <div key={name} className="flex h-8 w-8 cursor-default items-center justify-center rounded-full bg-white text-xs text-gray-400 shadow-sm transition-colors hover:text-blue-500">
                  {name.charAt(0)}
                </div>
              ))}
            </div>
          </div>

          {/* 快速链接 */}
          <nav aria-label="快速链接">
            <h4 className="mb-3 text-sm font-semibold text-gray-800">快速链接</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-blue-600">› {link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 客户服务 */}
          <nav aria-label="客户服务">
            <h4 className="mb-3 text-sm font-semibold text-gray-800">客户服务</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-blue-600">› {link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-gray-200/80 pt-6 text-center text-sm text-gray-400">
          <p>&copy; <CopyrightYear /> Mini Mall. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

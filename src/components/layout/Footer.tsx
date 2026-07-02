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
    <footer className="mt-auto border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* 品牌信息 */}
          <div>
            <h3 className="mb-3 text-lg font-bold text-blue-600">Mini Mall</h3>
            <p className="text-sm text-gray-600">
              微型电商平台，提供精选商品与优质购物体验。
            </p>
          </div>

          {/* 快速链接 */}
          <nav aria-label="快速链接">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              快速链接
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-blue-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 客户服务 */}
          <nav aria-label="客户服务">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              客户服务
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-blue-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          <p>
            &copy; <CopyrightYear /> Mini Mall. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

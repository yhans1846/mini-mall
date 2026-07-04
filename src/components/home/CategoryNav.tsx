// src/components/home/CategoryNav.tsx — 分类图标入口（视觉升级）
"use client";

import Link from "next/link";

interface Category { id: number; name: string }
interface CategoryNavProps { categories: Category[] }

const CATEGORY_ICONS: Record<string, string> = {
  "服装": "👕", "电子产品": "📱", "家居用品": "🏠", "食品饮料": "🍜", "图书": "📚", "运动户外": "🏃",
};

const GRADIENTS: Record<string, string> = {
  "服装": "linear-gradient(135deg,#667eea,#764ba2)",
  "电子产品": "linear-gradient(135deg,#4facfe,#00f2fe)",
  "家居用品": "linear-gradient(135deg,#43e97b,#38f9d7)",
  "食品饮料": "linear-gradient(135deg,#f093fb,#f5576c)",
  "图书": "linear-gradient(135deg,#fa709a,#fee140)",
  "运动户外": "linear-gradient(135deg,#a18cd1,#fbc2eb)",
};
const DEFAULT_GRADIENT = "linear-gradient(135deg,#667eea,#764ba2)";

export default function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <section className="py-6">
      <div className="flex items-center justify-center gap-5 sm:gap-8">
        {categories.map((cat) => {
          const icon = CATEGORY_ICONS[cat.name] || "📦";
          const gradient = GRADIENTS[cat.name] || DEFAULT_GRADIENT;
          return (
            <Link key={cat.id} href={`/products?categoryId=${cat.id}`}
              className="group flex flex-col items-center gap-2 transition-all duration-300 hover:-translate-y-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl sm:h-16 sm:w-16 sm:text-3xl"
                style={{ background: gradient }}>
                {icon}
              </div>
              <span className="text-xs font-medium text-gray-600 transition-colors group-hover:text-gray-800 sm:text-sm">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

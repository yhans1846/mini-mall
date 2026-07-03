// src/components/home/CategoryNav.tsx — 分类图标入口
"use client";

import Link from "next/link";

interface Category {
  id: number;
  name: string;
}

interface CategoryNavProps {
  categories: Category[];
}

const CATEGORY_ICONS: Record<string, string> = {
  "服装": "👕", "电子产品": "📱", "家居用品": "🏠",
  "食品饮料": "🍜", "图书": "📚", "运动户外": "🏃",
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
    <section className="py-4">
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        {categories.map((cat) => {
          const icon = CATEGORY_ICONS[cat.name] || "📦";
          const gradient = GRADIENTS[cat.name] || DEFAULT_GRADIENT;
          return (
            <Link
              key={cat.id}
              href={`/products?categoryId=${cat.id}`}
              className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white shadow-sm sm:h-14 sm:w-14 sm:text-2xl"
                style={{ background: gradient }}
              >
                {icon}
              </div>
              <span className="text-xs font-medium text-gray-600 sm:text-sm">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

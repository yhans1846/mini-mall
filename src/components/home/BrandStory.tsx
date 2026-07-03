// src/components/home/BrandStory.tsx — 品牌故事
import React from "react";

const STATS = [
  { value: "200+", label: "精选商品" },
  { value: "6", label: "商品分类" },
  { value: "100%", label: "正品保障" },
] as const;

export default function BrandStory() {
  return (
    <section className="mb-8 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 px-6 py-10 text-center sm:px-10">
      {/* 品牌名 */}
      <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Mini Mall
      </h2>

      {/* Slogan */}
      <p className="mt-2 text-base font-medium text-blue-600 sm:text-lg">
        精选好物 · 用心服务
      </p>

      {/* 简介 */}
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
        Mini Mall 致力于为每一位顾客提供高品质的购物体验。
      </p>
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
        从精选商品到贴心服务，我们用心做好每一个细节。
      </p>

      {/* 数据统计 */}
      <div className="mt-6 flex items-center justify-center gap-6 sm:gap-10">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center">
            <span className="text-xl font-bold text-gray-900 sm:text-2xl">
              {stat.value}
            </span>
            <span className="mt-0.5 text-xs text-gray-500 sm:text-sm">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

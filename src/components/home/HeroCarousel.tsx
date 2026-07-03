// src/components/home/HeroCarousel.tsx — 首页轮播 Banner
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Slide {
  title: string;
  subtitle: string;
  link: string;
  linkText: string;
  colors: string; // Tailwind gradient
}

const SLIDES: Slide[] = [
  {
    title: "Mini Mall 精选好物",
    subtitle: "精选商品，品质生活，从 Mini Mall 开始",
    link: "/products",
    linkText: "逛逛商品",
    colors: "from-blue-500 to-blue-700",
  },
  {
    title: "数码新品上市",
    subtitle: "智能手表 Pro、无线蓝牙耳机限时特惠",
    link: "/products?categoryId=2",
    linkText: "立即选购",
    colors: "from-purple-500 to-purple-700",
  },
  {
    title: "夏季焕新",
    subtitle: "轻薄羽绒服、经典纯棉 T 恤低至 6 折",
    link: "/products?categoryId=1",
    linkText: "去看看",
    colors: "from-rose-500 to-rose-700",
  },
  {
    title: "心悦会员专享",
    subtitle: "累计消费享等级折扣，最高 9 折",
    link: "/member",
    linkText: "了解详情",
    colors: "from-amber-500 to-orange-700",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % SLIDES.length);
  }, []);

  // 自动轮播
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const slide = SLIDES[current];

  return (
    <section
      className={`-mx-4 mb-8 bg-gradient-to-r ${slide.colors} px-4 py-16 text-white sm:rounded-lg sm:mx-0 relative overflow-hidden`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 指示点 */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`第 ${i + 1} 张轮播`}
          />
        ))}
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{slide.title}</h1>
        <p className="mt-3 text-lg text-white/80">{slide.subtitle}</p>
        <Link
          href={slide.link}
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-medium text-blue-600 shadow transition-colors hover:bg-blue-50"
        >
          {slide.linkText}
        </Link>
      </div>
    </section>
  );
}

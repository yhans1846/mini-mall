// src/components/home/HeroCarousel.tsx — 首页轮播 Banner（视觉增强）
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Slide {
  title: string; subtitle: string; link: string; linkText: string; colors: string;
}

const SLIDES: Slide[] = [
  { title: "Mini Mall 精选好物", subtitle: "精选商品，品质生活，从 Mini Mall 开始", link: "/products", linkText: "逛逛商品", colors: "from-blue-500 to-blue-700" },
  { title: "数码新品上市", subtitle: "智能手表 Pro、无线蓝牙耳机限时特惠", link: "/products?categoryId=2", linkText: "立即选购", colors: "from-purple-500 to-purple-700" },
  { title: "夏季焕新", subtitle: "轻薄羽绒服、经典纯棉 T 恤低至 6 折", link: "/products?categoryId=1", linkText: "去看看", colors: "from-rose-500 to-rose-700" },
  { title: "心悦会员专享", subtitle: "累计消费享等级折扣，最高 9 折", link: "/member", linkText: "了解详情", colors: "from-amber-500 to-orange-700" },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animating, setAnimating] = useState(false);

  const next = useCallback(() => {
    setAnimating(true);
    setTimeout(() => { setCurrent((c) => (c + 1) % SLIDES.length); setAnimating(false); }, 200);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const slide = SLIDES[current];

  return (
    <section
      className={`relative -mx-4 mb-8 overflow-hidden bg-gradient-to-r ${slide.colors} px-4 py-20 text-white sm:mx-0 sm:rounded-2xl`}
      onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}
    >
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white" />
        <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-white" />
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/30" />
      </div>

      {/* 指示点 */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => { setAnimating(true); setTimeout(() => { setCurrent(i); setAnimating(false); }, 150); }}
            className={`rounded-full transition-all duration-300 ${i === current ? "h-2.5 w-8 bg-white shadow-md" : "h-2.5 w-2.5 bg-white/40 hover:bg-white/70"}`}
            aria-label={`第 ${i + 1} 张轮播`} />
        ))}
      </div>

      {/* 内容 */}
      <div className={`relative text-center transition-all duration-200 ${animating ? "opacity-0 translate-y-2" : "opacity-100"}`}>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl animate-fadeScaleIn">{slide.title}</h1>
        <p className="mt-4 text-lg text-white/80 animate-fadeInUp">{slide.subtitle}</p>
        <Link href={slide.link}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-gray-800 shadow-lg transition-all hover:shadow-xl hover:scale-105 animate-slideInRight">
          {slide.linkText}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      </div>
    </section>
  );
}

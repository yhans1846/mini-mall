// src/app/page.tsx — 首页（服务端组件）
import HeroCarousel from "@/components/home/HeroCarousel";

export default async function Home() {
  return (
    <div>
      {/* Hero 轮播 */}
      <HeroCarousel />

      {/* 新品推荐 */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">新品推荐</h2>
        <p className="text-sm text-gray-500">
          <a href="/products" className="text-blue-600 hover:underline">去商品页浏览全部商品 →</a>
        </p>
      </section>
    </div>
  );
}

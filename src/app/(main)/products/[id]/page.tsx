// src/app/products/[id]/page.tsx — 商品详情页（图片轮播/品牌/副标题/规格/标签/视频/产地）
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import Link from "next/link";
import CountdownTimer from "@/components/ui/CountdownTimer";
import type { Product, Category, SpecItem } from "@/types";

interface ProductDetail extends Product { category: Category }

function formatPrice(price: number): string { return `¥${price.toFixed(2)}`; }

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("加载失败");
  return res.json();
});

const TAG_COLORS: Record<string, string> = {
  "新品": "bg-green-100 text-green-700",
  "热销": "bg-red-100 text-red-700",
  "限定": "bg-purple-100 text-purple-700",
  "推荐": "bg-blue-100 text-blue-700",
  "特惠": "bg-orange-100 text-orange-700",
  "清仓": "bg-yellow-100 text-yellow-700",
  "爆款": "bg-pink-100 text-pink-700",
  "甄选": "bg-indigo-100 text-indigo-700",
  "人气": "bg-cyan-100 text-cyan-700",
  "独家": "bg-amber-100 text-amber-700",
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || "bg-gray-100 text-gray-600";
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: product, error, isLoading } = useSWR<ProductDetail>(
    `/api/products/${params.id}`, fetcher,
  );

  // 自动轮播（3.5s 间隔）
  useEffect(() => {
    if (!product || isPaused) return;
    const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean);
    if (allImages.length <= 1) return;
    const timer = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % allImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [product, isPaused]);

  const goToImage = useCallback((idx: number) => setSelectedImage(idx), []);
  const prevImage = useCallback(() => {
    if (!product) return;
    const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean);
    setSelectedImage((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [product]);
  const nextImage = useCallback(() => {
    if (!product) return;
    const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean);
    setSelectedImage((prev) => (prev + 1) % allImages.length);
  }, [product]);

  const doAddToCart = useCallback(async (qty: number, thenCheckout: boolean) => {
    if (adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product!.id, quantity: qty }),
      });
      if (res.status === 401) { router.push("/auth/login"); return; }
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "添加失败"); return; }
      if (thenCheckout) {
        router.push("/orders/checkout");
      } else {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    } catch { toast.error("添加失败，请重试"); }
    finally { setAdding(false); }
  }, [product?.id, adding, router]);

  const handleAddToCart = () => doAddToCart(quantity, false);
  const handleBuyNow = () => doAddToCart(quantity, true);

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse">
          <div className="mb-3 h-6 w-32 rounded bg-gray-200" />
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square rounded-lg bg-gray-200" />
            <div className="space-y-4">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-6 w-16 rounded bg-gray-200" />
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-6 w-1/4 rounded bg-gray-200" />
              <div className="h-20 rounded bg-gray-200" />
              <div className="h-12 w-40 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center py-16 text-gray-500">
        <p className="text-lg">商品不存在或已下架</p>
        <Link href="/products" className="mt-3 text-sm font-medium text-blue-600 hover:underline">返回商品列表</Link>
      </div>
    );
  }

  const hasStock = product.stock > 0;
  const currentPrice = product.flashSale ? product.flashSale.flashPrice : product.price;
  const allImages = product.images?.length ? [product.imageUrl, ...product.images].filter(Boolean) : [product.imageUrl];

  return (
    <div className="py-6">
      {/* 面包屑 */}
      <nav className="mb-4 text-sm text-gray-400">
        <Link href="/" className="hover:text-blue-600">首页</Link><span className="mx-2">/</span>
        <Link href="/products" className="hover:text-blue-600">商品</Link><span className="mx-2">/</span>
        <Link href={`/products?categoryId=${product.categoryId}`} className="hover:text-blue-600">{product.category.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.name}</span>
      </nav>

      {/* ──── 主体：图片 + 信息 ──── */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* 左：图片轮播 */}
        <div onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <div className="relative overflow-hidden rounded-xl bg-gray-50">
            {product.flashSale && (
              <span className="absolute left-3 top-3 z-10 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1.5 text-sm font-semibold text-white shadow-lg">⚡ 限时秒杀</span>
            )}
            {product.flashSale && (
              <div className="absolute right-3 top-3 z-10">
                <CountdownTimer endTime={product.flashSale.endTime} className="!bg-black/60 !text-white !text-xs !px-2 !py-1 !rounded-lg !font-medium" />
              </div>
            )}
            {allImages[selectedImage] ? (
              <div className="relative aspect-square">
                <img src={allImages[selectedImage]} alt={product.name} className="h-full w-full object-cover transition-opacity duration-500" />
                {/* 左右箭头 */}
                {allImages.length > 1 && (
                  <>
                    <button onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2 text-gray-700 shadow-md backdrop-blur-sm transition-all hover:bg-white/90 hover:scale-110">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2 text-gray-700 shadow-md backdrop-blur-sm transition-all hover:bg-white/90 hover:scale-110">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </>
                )}
                {/* 底部指示点 */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {allImages.map((_, idx) => (
                      <button key={idx} onClick={() => goToImage(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === selectedImage ? "w-6 bg-white shadow-md" : "w-2 bg-white/60 hover:bg-white/80"
                        }`} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center text-6xl text-gray-300">{product.name.charAt(0)}</div>
            )}
          </div>
          {/* 缩略图列表 */}
          {allImages.length > 1 && (
            <div className="mt-3 flex gap-2">
              {allImages.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    idx === selectedImage ? "border-blue-500 shadow-sm" : "border-gray-200 opacity-70 hover:opacity-100"
                  }`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右：商品信息 */}
        <div className="flex flex-col justify-start">
          {/* 分类 + 品牌 */}
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">{product.category.name}</span>
            {product.brand && <span className="rounded-lg bg-gray-50 px-3 py-1 text-sm text-gray-500">{product.brand}</span>}
          </div>

          {/* 标题 */}
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{product.name}</h1>

          {/* 副标题 */}
          {product.subtitle && (
            <p className="mt-1 text-sm text-gray-500">{product.subtitle}</p>
          )}

          {/* 价格 */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-red-500">{formatPrice(currentPrice)}</span>
            {product.flashSale && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          {/* 标签 */}
          {product.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span key={tag} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getTagColor(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 产地 · 重量 */}
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
            {product.origin && <span>📍 {product.origin}</span>}
            {product.weight && <span>⚖️ {product.weight}kg</span>}
          </div>

          {/* 库存 */}
          <p className="mt-2 text-sm text-gray-500">
            库存：{hasStock ? `${product.stock} 件` : "暂时无货"}
            {product.salesCount !== undefined && product.salesCount > 0 && (
              <span className="ml-4">已售 {product.salesCount} 件</span>
            )}
          </p>

          <hr className="my-5 border-gray-100" />

          {/* 操作区域 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-200">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 disabled:text-gray-300">−</button>
              <span className="min-w-[3rem] text-center text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 disabled:text-gray-300">+</button>
            </div>

            <button onClick={handleAddToCart} disabled={adding || !hasStock}
              className={`rounded-lg px-8 py-2.5 text-sm font-medium text-white transition-all ${
                added ? "bg-green-500" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              } disabled:bg-gray-300`}>
              {!hasStock ? "暂时无货" : added ? "已加入 ✓" : adding ? "添加中..." : "加入购物车"}
            </button>

            <button onClick={handleBuyNow} disabled={adding || !hasStock}
              className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-8 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-orange-600 hover:to-red-600 active:scale-95 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none">
              立即购买
            </button>
          </div>
        </div>
      </div>

      {/* ──── 规格参数表 ──── */}
      {product.specs?.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">规格参数</h3>
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <tbody>
                {product.specs.map((spec: SpecItem, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="w-40 whitespace-nowrap px-5 py-3 font-medium text-gray-700">{spec.key}</td>
                    <td className="px-5 py-3 text-gray-600">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──── 商品视频 ──── */}
      {product.videoUrl && (
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">商品视频</h3>
          <div className="aspect-video max-w-2xl overflow-hidden rounded-xl bg-black">
            <video src={product.videoUrl} controls className="h-full w-full" poster={allImages[0]}>
              您的浏览器不支持视频播放
            </video>
          </div>
        </div>
      )}

      {/* ──── 商品描述 ──── */}
      {product.description && (
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">商品描述</h3>
          <div className="rounded-xl bg-gray-50 px-6 py-5 text-sm leading-relaxed text-gray-600">
            <p>{product.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/home/HeroCarousel";
import CategoryNav from "@/components/home/CategoryNav";
import FlashSale from "@/components/home/FlashSale";
import HotRanking from "@/components/home/HotRanking";
import BrandStory from "@/components/home/BrandStory";
import NewArrivals from "@/components/home/NewArrivals";

export default async function Home() {
  const [categories, hotProducts, newProducts] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" } }),
    // 热销 Top 8
    (async () => {
      const products = await prisma.product.findMany({ where: { isPublished: true } });
      const orderItems = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } } },
        _sum: { quantity: true },
      });
      const salesMap = new Map(orderItems.map((o) => [o.productId, o._sum.quantity || 0]));
      products.sort((a, b) => {
        const sa = salesMap.get(a.id) || 0;
        const sb = salesMap.get(b.id) || 0;
        if (sa !== sb) return sb - sa;
        return b.id - a.id;
      });
      return products.slice(0, 8);
    })(),
    // 新品 Top 8
    prisma.product.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { category: true },
    }),
  ]);

  return (
    <div>
      <HeroCarousel />
      <CategoryNav categories={categories} />

      {/* 秒杀 + 热销并排（桌面） */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-4">
        <div className="lg:col-span-3">
          <FlashSale />
        </div>
        <div className="lg:col-span-2">
          <HotRanking products={hotProducts} />
        </div>
      </div>

      {/* 新品上市 */}
      <NewArrivals products={newProducts} />

      <BrandStory />
    </div>
  );
}

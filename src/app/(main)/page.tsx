import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/home/HeroCarousel";
import CategoryNav from "@/components/home/CategoryNav";
import FlashSale from "@/components/home/FlashSale";
import HotRanking from "@/components/home/HotRanking";
import BrandStory from "@/components/home/BrandStory";

export default async function Home() {
  const [categories, hotProducts] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" } }),
    (async () => {
      const products = await prisma.product.findMany({
        where: { isPublished: true },
      });
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
  ]);

  return (
    <div>
      <HeroCarousel />
      <CategoryNav categories={categories} />
      <FlashSale />
      <HotRanking products={hotProducts} />
      <BrandStory />
    </div>
  );
}

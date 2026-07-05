// src/components/home/NewArrivals.tsx — 新品上市
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category: { name: string };
}

function formatPrice(price: number) {
  return `¥${price.toFixed(2)}`;
}

export default function NewArrivals({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">🆕 新品上市</h2>
          <span className="rounded bg-gradient-to-r from-blue-500 to-cyan-400 px-2 py-0.5 text-[10px] font-medium text-white">NEW</span>
        </div>
        <Link href="/products?sort=newest" className="text-sm text-blue-600 transition-colors hover:text-blue-800">
          更多 &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group animate-fadeInUp stagger-{(index % 4) + 1} relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* 图片 */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl text-gray-300">{product.name.charAt(0)}</div>
              )}
              <span className="absolute left-0 top-0 rounded-br-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">新品</span>
            </div>
            {/* 信息 */}
            <div className="p-3">
              <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">{product.category.name}</span>
              <h3 className="mt-1 text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{product.name}</h3>
              <p className="mt-1.5 text-base font-bold text-red-500">{formatPrice(product.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

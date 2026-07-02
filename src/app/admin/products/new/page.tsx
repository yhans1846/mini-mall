// src/app/admin/products/new/page.tsx — 新增商品
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import type { Category } from "@/types";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">新增商品</h1>
      <ProductForm categories={categories as unknown as Category[]} />
    </div>
  );
}

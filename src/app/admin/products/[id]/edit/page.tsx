// src/app/admin/products/[id]/edit/page.tsx — 编辑商品
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import type { Category } from "@/types";
import { notFound } from "next/navigation";

interface Params { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.category.findMany({ orderBy: { id: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">编辑商品</h1>
      <ProductForm
        categories={categories as unknown as Category[]}
        initialData={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
          isPublished: product.isPublished,
        }}
      />
    </div>
  );
}

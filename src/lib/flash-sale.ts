// src/lib/flash-sale.ts — 秒杀相关工具函数

import { prisma } from "./prisma";

/**
 * 为商品附加当前生效的秒杀信息
 * 查询该商品是否有正在进行的秒杀活动，有则附加 flashSale 字段
 */
export async function attachFlashSale<T extends { id: number }>(
  product: T
): Promise<T & { flashSale: { flashPrice: number; flashStock: number; endTime: Date } | null }> {
  const now = new Date();
  const flashSale = await prisma.flashSale.findFirst({
    where: {
      productId: product.id,
      isActive: true,
      startTime: { lte: now },
      endTime: { gt: now },
    },
    select: {
      flashPrice: true,
      flashStock: true,
      endTime: true,
    },
  });

  return {
    ...product,
    flashSale: flashSale
      ? {
          flashPrice: flashSale.flashPrice,
          flashStock: flashSale.flashStock,
          endTime: flashSale.endTime,
        }
      : null,
  };
}

/**
 * 批量附加秒杀信息
 */
export async function attachFlashSales<T extends { id: number }>(
  products: T[]
): Promise<(T & { flashSale: { flashPrice: number; flashStock: number; endTime: Date } | null })[]> {
  if (products.length === 0) return [];

  const productIds = products.map((p) => p.id);
  const now = new Date();

  const flashSales = await prisma.flashSale.findMany({
    where: {
      productId: { in: productIds },
      isActive: true,
      startTime: { lte: now },
      endTime: { gt: now },
    },
    select: {
      productId: true,
      flashPrice: true,
      flashStock: true,
      endTime: true,
    },
  });

  const flashMap = new Map(
    flashSales.map((fs) => [
      fs.productId,
      { flashPrice: fs.flashPrice, flashStock: fs.flashStock, endTime: fs.endTime },
    ])
  );

  return products.map((p) => ({
    ...p,
    flashSale: flashMap.get(p.id) || null,
  }));
}

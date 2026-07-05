// src/lib/utils.ts — 通用工具函数

import type { SpecItem } from "@/types";

/** 会员等级配置 */
export const MEMBERSHIP_TIERS = [
  { level: 0, name: "普通会员", threshold: 0, discountRate: 1.0 },
  { level: 1, name: "心悦1级", threshold: 8000, discountRate: 0.98 },
  { level: 2, name: "心悦2级", threshold: 80000, discountRate: 0.95 },
  { level: 3, name: "心悦3级", threshold: 800000, discountRate: 0.90 },
] as const;

/** 根据累计消费金额计算会员等级（只升不降） */
export function calcMembershipLevel(totalSpent: number): number {
  let level = 0;
  for (const tier of MEMBERSHIP_TIERS) {
    if (totalSpent >= tier.threshold) {
      level = tier.level;
    }
  }
  return level;
}

/** 根据等级获取折扣率 */
export function getDiscountRate(level: number): number {
  const tier = MEMBERSHIP_TIERS.find((t) => t.level === level);
  return tier?.discountRate ?? 1.0;
}

/** 格式化价格 */
export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

/** 将 Prisma Product（JSON字段为String）转换为前端 Product 类型 */
export function transformProduct<T extends { images?: string; specs?: string; tags?: string }>(product: T): T & { images: string[]; specs: SpecItem[]; tags: string[] } {
  return {
    ...product,
    images: safeJsonParse(product.images, []),
    specs: safeJsonParse(product.specs, []),
    tags: safeJsonParse(product.tags, []),
  };
}

function safeJsonParse<T>(val: string | undefined | null, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

/** 验证管理员身份（admin-token JWT） */
export async function verifyAdmin() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token")?.value;
    if (!token) return null;
    const { decode } = await import("next-auth/jwt");
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET!;
    const payload = await decode({ token, secret, salt: "admin-token" });
    if (!payload?.id) return null;
    const { prisma } = await import("./prisma");
    return await prisma.adminUser.findUnique({ where: { id: parseInt(payload.id as string, 10) } });
  } catch {
    return null;
  }
}

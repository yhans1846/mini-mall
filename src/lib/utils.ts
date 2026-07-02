// src/lib/utils.ts — 通用工具函数

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

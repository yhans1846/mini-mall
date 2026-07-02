// src/app/member/page.tsx — 会员中心
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { formatPrice } from "@/lib/utils";

interface MemberData {
  id: number;
  name: string;
  email: string;
  membershipLevel: number;
  totalSpent: number;
  createdAt: string;
  currentTier: {
    level: number;
    name: string;
    discountRate: number;
  };
  nextTier: {
    level: number;
    name: string;
    threshold: number;
    discountRate: number;
    remaining: number;
    progress: number;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("not authorized");
  return r.json();
});

const TIERS = [
  { level: 0, name: "普通会员", threshold: 0, discount: "无", discountRate: 1.0 },
  { level: 1, name: "心悦1级", threshold: "¥8,000", discount: "9.8折", discountRate: 0.98 },
  { level: 2, name: "心悦2级", threshold: "¥80,000", discount: "9.5折", discountRate: 0.95 },
  { level: 3, name: "心悦3级", threshold: "¥800,000", discount: "9折", discountRate: 0.90 },
];

export default function MemberPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: member, error, isLoading } = useSWR<MemberData>(
    session ? "/api/member" : null,
    fetcher
  );

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-40 rounded-lg bg-gray-200" />
          <div className="h-60 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center py-16 text-gray-500">
        <p className="text-lg">加载失败</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold">会员中心</h1>

      {/* 会员卡片 */}
      <div className="mb-6 overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <div className="p-6">
          <p className="text-sm text-blue-100">尊敬的会员</p>
          <p className="mt-1 text-xl font-bold">{member.name}</p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{member.currentTier.name}</span>
            <span className="text-sm text-blue-200">
              (折扣 {Math.round((1 - member.currentTier.discountRate) * 100)}%)
            </span>
          </div>

          <p className="mt-2 text-sm text-blue-100">
            累计消费：{formatPrice(member.totalSpent)}
          </p>

          {/* 升级进度条 */}
          {member.nextTier ? (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-blue-200">
                <span>距 {member.nextTier.name} 还差 {formatPrice(member.nextTier.remaining)}</span>
                <span>{member.nextTier.progress}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-blue-900/30">
                <div
                  className="h-full rounded-full bg-yellow-400 transition-all"
                  style={{ width: `${member.nextTier.progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-yellow-300">已达最高等级，感谢您的支持！</p>
          )}
        </div>
      </div>

      {/* 等级权益说明 */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3 font-medium text-gray-900">
          等级权益
        </div>
        <div className="divide-y">
          {TIERS.map((tier) => {
            const isCurrent = tier.level === member.membershipLevel;
            const isUnlocked = tier.level <= member.membershipLevel;
            return (
              <div
                key={tier.level}
                className={`flex items-center justify-between px-4 py-3 ${
                  isCurrent ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${isUnlocked ? "text-gray-900" : "text-gray-400"}`}>
                    {tier.name}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                      当前
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className={isUnlocked ? "text-gray-600" : "text-gray-400"}>
                    消费 {tier.threshold}
                  </span>
                  <span className={isUnlocked ? "font-medium text-gray-900" : "text-gray-400"}>
                    {tier.discount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 会员信息 */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-medium text-gray-900">账号信息</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>邮箱：{member.email}</p>
          <p>注册时间：{new Date(member.createdAt).toLocaleString("zh-CN")}</p>
        </div>
      </div>
    </div>
  );
}

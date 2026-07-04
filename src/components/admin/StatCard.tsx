// src/components/admin/StatCard.tsx — 仪表盘统计卡片（现代化设计）
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  color: string;
  trend?: { value: number; isUp: boolean };
}

export default function StatCard({ icon, label, value, color, trend }: StatCardProps) {
  return (
    <div className="admin-card flex items-center gap-4 p-5">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          boxShadow: `0 2px 8px ${color}33`,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums tracking-tight" style={{ color }}>
          {value}
        </p>
        {trend && (
          <p className={`mt-0.5 text-xs font-medium ${trend.isUp ? "text-green-500" : "text-red-500"}`}>
            {trend.isUp ? "↑" : "↓"} {trend.value}%
          </p>
        )}
      </div>
    </div>
  );
}

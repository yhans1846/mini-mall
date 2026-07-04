// StatusPieChart.tsx — 订单状态分布（饼图）
"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PAID: "#409eff",
  SHIPPED: "#8b5cf6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待付款",
  PAID: "已支付",
  SHIPPED: "已发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

interface StatusPieChartProps {
  data: { status: string; count: number }[];
}

export default function StatusPieChart({ data }: StatusPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUS_LABELS[d.status] || d.status,
      value: d.count,
      color: STATUS_COLORS[d.status] || "#909399",
    }));

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: "0.5rem", border: "1px solid #ebeef5", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.8rem" }}
            formatter={(value, name) => [`${value} 单`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* 中心总数 */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <span className="text-2xl font-bold text-gray-800">{total}</span>
        <span className="text-xs text-gray-400">总订单</span>
      </div>
    </div>
  );
}

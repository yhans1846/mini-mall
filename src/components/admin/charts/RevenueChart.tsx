// RevenueChart.tsx — 近 7 日销售额趋势（面积图 + 折线）
"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: { date: string; amount: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
    amount: d.amount,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#409eff" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#409eff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `¥${v}`} />
        <Tooltip
          contentStyle={{ borderRadius: "0.5rem", border: "1px solid #ebeef5", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.8rem" }}
          formatter={(value) => [`¥${Number(value).toFixed(2)}`, "销售额"]}
        />
        <Area type="monotone" dataKey="amount" stroke="#409eff" strokeWidth={2} fill="url(#revenueGradient)" dot={{ r: 3, fill: "#fff", stroke: "#409eff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// MonthlyChart.tsx — 本月每日销售额（柱状图）
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface MonthlyChartProps {
  data: { date: string; amount: number }[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).getDate() + "日",
    amount: d.amount,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#409eff" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#409eff" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `¥${v}`} />
        <Tooltip
          contentStyle={{ borderRadius: "0.5rem", border: "1px solid #ebeef5", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "0.8rem" }}
          formatter={(value) => [`¥${Number(value).toFixed(2)}`, "销售额"]}
        />
        <Bar dataKey="amount" fill="url(#barGradient)" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {chartData.map((entry, idx) => {
            const today = new Date().getDate();
            const d = parseInt(entry.date, 10);
            return <Cell key={idx} fill={d === today ? "#409eff" : `url(#barGradient)`} fillOpacity={d === today ? 1 : 0.6} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

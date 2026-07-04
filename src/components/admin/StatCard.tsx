// src/components/admin/StatCard.tsx — 仪表盘统计卡片
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

export default function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="admin-card flex items-center gap-4 p-5">
      <div
        className="flex h-14 w-14 items-center justify-center rounded text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}

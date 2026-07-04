// src/components/admin/StatusBadge.tsx — 状态标签
interface StatusBadgeProps {
  label: string;
  type?: "success" | "warning" | "danger" | "info" | "default";
}

const COLOR_MAP: Record<string, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  default: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function StatusBadge({ label, type = "default" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${COLOR_MAP[type] || COLOR_MAP.default}`}>
      {label}
    </span>
  );
}

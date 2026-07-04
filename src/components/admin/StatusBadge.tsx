// src/components/admin/StatusBadge.tsx — 状态标签（带圆点指示器）
interface StatusBadgeProps {
  label: string;
  type?: "success" | "warning" | "danger" | "info" | "default";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  danger:  { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  info:    { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-500" },
  default: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" },
};

const SIZE_MAP: Record<string, string> = {
  sm: "px-2 py-0.5 text-[0.65rem]",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

export default function StatusBadge({ label, type = "default", size = "md", dot = true }: StatusBadgeProps) {
  const c = COLOR_MAP[type] || COLOR_MAP.default;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${c.bg} ${c.text} ${c.border} ${SIZE_MAP[size] || SIZE_MAP.md}`}>
      {dot && <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot}`} />}
      {label}
    </span>
  );
}

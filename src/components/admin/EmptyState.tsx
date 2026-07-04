// EmptyState.tsx — 空状态组件
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title = "暂无数据", description, action }: EmptyStateProps) {
  return (
    <div className="admin-card flex flex-col items-center gap-3 p-10 text-center">
      {icon && <div className="text-gray-300">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} className="btn-primary text-sm mt-1">
          {action.label}
        </button>
      )}
    </div>
  );
}

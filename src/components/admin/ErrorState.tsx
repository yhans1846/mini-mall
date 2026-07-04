// ErrorState.tsx — 错误状态组件
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = "加载失败", onRetry }: ErrorStateProps) {
  return (
    <div className="admin-card flex flex-col items-center gap-3 p-10 text-center">
      <svg className="h-10 w-10 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <p className="text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-default text-sm">
          重试
        </button>
      )}
    </div>
  );
}

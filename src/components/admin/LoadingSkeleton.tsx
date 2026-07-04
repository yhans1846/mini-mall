// LoadingSkeleton.tsx — 骨架屏组件
interface LoadingSkeletonProps {
  variant?: "table" | "card" | "chart" | "form";
  rows?: number;
}

export default function LoadingSkeleton({ variant = "table", rows = 5 }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="admin-card animate-pulse p-4">
            <div className="mb-2 h-4 w-16 rounded bg-gray-200" />
            <div className="h-7 w-12 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className="admin-card animate-pulse p-5">
        <div className="mb-3 h-5 w-24 rounded bg-gray-200" />
        <div className="h-40 rounded bg-gray-100" />
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="admin-card animate-pulse space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-gray-100" />
        ))}
      </div>
    );
  }

  // table (default)
  return (
    <div className="admin-card animate-pulse p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="mb-3 h-8 rounded bg-gray-100" />
      ))}
    </div>
  );
}

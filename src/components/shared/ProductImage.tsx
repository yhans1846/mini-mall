// ProductImage.tsx — 统一商品图片（含加载态 + 错误 fallback）
"use client";

import { useState } from "react";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  badge?: React.ReactNode;
}

export default function ProductImage({ src, alt, className = "", badge }: ProductImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fallback = (
    <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
      <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );

  if (!src || error) {
    return (
      <div className="relative">
        {fallback}
        {badge && <div className="absolute left-2 top-2">{badge}</div>}
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 z-10 animate-pulse bg-gray-100 ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"} ${className}`}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
      {badge && <div className="absolute left-2 top-2 z-10">{badge}</div>}
    </div>
  );
}

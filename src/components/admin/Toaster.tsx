// Toaster.tsx — Sonner Toast 封装，统一后台通知样式
"use client";

import { Toaster as SonnerToaster } from "sonner";

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        duration: 2000,
        style: {
          fontSize: "0.875rem",
          borderRadius: "0.5rem",
          border: "1px solid #ebeef5",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        },
      }}
    />
  );
}

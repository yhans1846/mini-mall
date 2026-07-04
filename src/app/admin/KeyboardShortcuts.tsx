// KeyboardShortcuts.tsx — 后台全局快捷键
"use client";

import { useEffect, useState, useCallback } from "react";
import ShortcutsHelp from "@/components/admin/ShortcutsHelp";

export default function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ? 或 Ctrl+/ 显示快捷键面板
    if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setHelpOpen((prev) => !prev);
      return;
    }
    // Ctrl+K 聚焦搜索框 — 冒泡到页面处理
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      // 触发自定义事件，页面监听
      document.dispatchEvent(new CustomEvent("admin:focus-search"));
      return;
    }
    // Escape 关闭帮助面板
    if (e.key === "Escape" && helpOpen) {
      setHelpOpen(false);
      return;
    }
  }, [helpOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
  );
}

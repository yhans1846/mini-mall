// useKeyboardShortcuts.ts — 全局键盘快捷键 hook
"use client";

import { useEffect, useCallback } from "react";

type ShortcutHandler = (e: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  handler: ShortcutHandler;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const matchKey = e.key.toLowerCase() === s.key.toLowerCase();
        const matchCtrl = s.ctrl ? e.ctrlKey || e.metaKey : true;
        const matchMeta = s.meta ? e.metaKey : true;

        if (matchKey && matchCtrl && matchMeta) {
          if (s.preventDefault !== false) {
            e.preventDefault();
            e.stopPropagation();
          }
          s.handler(e);
          return;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/** 快捷键描述列表，用于展示帮助面板 */
export const SHORTCUT_DESCRIPTIONS: { keys: string; desc: string }[] = [
  { keys: "Ctrl + K", desc: "聚焦搜索框" },
  { keys: "Ctrl + N", desc: "新增（当前页面）" },
  { keys: "Ctrl + R", desc: "刷新列表" },
  { keys: "Escape", desc: "关闭弹窗 / 清空搜索" },
  { keys: "Ctrl + S", desc: "保存表单" },
  { keys: "?", desc: "显示快捷键帮助" },
];

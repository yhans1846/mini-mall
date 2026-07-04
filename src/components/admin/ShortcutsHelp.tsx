// ShortcutsHelp.tsx — 快捷键帮助面板
"use client";

import Modal from "./Modal";
import { SHORTCUT_DESCRIPTIONS } from "@/hooks/useKeyboardShortcuts";

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  return (
    <Modal open={open} title="键盘快捷键" onClose={onClose} width="max-w-sm"
      footer={<div className="flex justify-end border-t px-5 py-3">
        <button onClick={onClose} className="btn-default text-sm">关闭</button>
      </div>}
    >
      <div className="space-y-2">
        {SHORTCUT_DESCRIPTIONS.map((s) => (
          <div key={s.keys} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2">
            <kbd className="rounded border bg-white px-2 py-0.5 font-mono text-xs text-gray-700 shadow-sm">
              {s.keys}
            </kbd>
            <span className="text-sm text-gray-600">{s.desc}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

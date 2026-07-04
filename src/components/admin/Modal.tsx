// src/components/admin/Modal.tsx — 通用 Modal 弹窗
"use client";

import { useEffect, useRef } from "react";
import { IconClose } from "./icons";

interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  width?: string;
}

export default function Modal({ open, title, children, onClose, footer, width = "max-w-lg" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className={`${width} mx-4 w-full rounded-lg bg-white shadow-xl`}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {/* 底部操作栏 */}
        {footer !== undefined ? footer : (
          <div className="flex justify-end gap-2 border-t px-5 py-3">
            <button onClick={onClose} className="btn-default text-sm">取消</button>
          </div>
        )}
      </div>
    </div>
  );
}

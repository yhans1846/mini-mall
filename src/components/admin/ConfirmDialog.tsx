// ConfirmDialog.tsx — 确认弹窗（基于 Modal，支持 Promise 模式）
"use client";

import { useState, useCallback } from "react";
import Modal from "./Modal";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

// 对外暴露的 hook：调用 confirm() 返回 Promise<boolean>
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts: ConfirmOptions = typeof options === "string" ? { message: options } : options;
    return new Promise((resolve) => {
      setState({ open: true, options: opts, resolve });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    state?.resolve(result);
    setState(null);
  }, [state]);

  const variantStyles = {
    danger: { button: "btn-danger text-sm", color: "#ff4949" },
    warning: { button: "btn-primary text-sm", color: "#ffba00" },
    info: { button: "btn-primary text-sm", color: "#409eff" },
  };

  const vs = variantStyles[state?.options.variant || "danger"];

  const ConfirmDialogComponent = state ? (
    <Modal
      open={state.open}
      title={state.options.title || "确认操作"}
      onClose={() => handleClose(false)}
      width="max-w-sm"
      footer={
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={() => handleClose(false)} className="btn-default text-sm">
            {state.options.cancelText || "取消"}
          </button>
          <button onClick={() => handleClose(true)} className={vs.button} style={{ backgroundColor: vs.color }}>
            {state.options.confirmText || "确定"}
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-600">{state.options.message}</p>
    </Modal>
  ) : null;

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}

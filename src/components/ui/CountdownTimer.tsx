// src/components/ui/CountdownTimer.tsx — 倒计时组件
"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: string;
  className?: string;
}

export default function CountdownTimer({ endTime, className = "" }: CountdownTimerProps) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setText("已结束");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (!text) return null;

  return (
    <span className={`inline-block rounded bg-gray-800 px-2 py-0.5 font-mono text-xs text-white ${className}`}>
      {text}
    </span>
  );
}

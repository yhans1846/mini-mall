"use client";

import { useState, useEffect } from "react";

/** 客户端版权年份组件，避免服务端静态渲染时年份冻结 */
export default function CopyrightYear() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <span>{year}</span>;
}

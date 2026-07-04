// src/lib/export.ts — CSV 导出工具（支持中文）
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  filename: string,
) {
  const BOM = "﻿";
  const headerRow = headers.map((h) => `"${h.label}"`).join(",");
  const dataRows = data.map((row) =>
    headers.map((h) => {
      const val = row[h.key];
      const str = val == null ? "" : String(val);
      // 转义引号
      return `"${str.replace(/"/g, '""')}"`;
    }).join(","),
  );
  const csv = BOM + [headerRow, ...dataRows].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

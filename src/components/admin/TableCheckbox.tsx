// TableCheckbox.tsx — 表格复选框组件（全选/半选/单选）
"use client";

interface TableCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function TableCheckbox({ checked, indeterminate, onChange, label }: TableCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 select-none">
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => { if (el) el.indeterminate = !!indeterminate; }}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#409eff] accent-[#409eff] focus:ring-[#409eff]"
      />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </label>
  );
}

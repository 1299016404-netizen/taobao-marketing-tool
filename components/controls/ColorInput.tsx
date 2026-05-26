"use client";

import { Input } from "@/components/ui/input";
import { isHexColor } from "@/lib/utils";

type ColorInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  const valid = isHexColor(value);
  const colorValue = valid ? value : "#FF3D00";

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <label className="relative size-10 shrink-0 overflow-hidden rounded-md border border-[rgba(20,22,28,0.16)] bg-white/82">
          <span
            className="absolute inset-1 rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
            style={{ backgroundColor: colorValue }}
          />
          <input
            aria-label={label}
            type="color"
            value={colorValue}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#FF3D00"
          spellCheck={false}
          className={!valid ? "border-red-400/70 text-red-600" : ""}
        />
      </div>
    </div>
  );
}

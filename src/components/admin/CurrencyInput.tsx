"use client";

import { formatCOPInput, parseCOPInput } from "@/lib/currency";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
  id,
}: CurrencyInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={value ? formatCOPInput(value) : ""}
      onChange={(e) => onChange(parseCOPInput(e.target.value))}
      placeholder={placeholder}
      className={className}
    />
  );
}

"use client";

import { BUSINESS } from "@/data/menu";

const ITEMS = [
  "Salchipapas",
  "Hot Dogs",
  "Hamburguesas",
  "Asados al Carbón",
  "Sodas Saborizadas",
  "Zarzal",
  BUSINESS.name,
];

export function MarqueeStrip() {
  const sequence = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden border-y border-neon/20 bg-neon py-3">
      <div className="flex animate-marquee gap-8 whitespace-nowrap">
        {sequence.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.25em] text-white"
          >
            {item}
            <span className="mx-8 opacity-40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

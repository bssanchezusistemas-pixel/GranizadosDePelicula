"use client";

import { formatCOP } from "@/lib/currency";
import type { ProductoTopDia } from "@/data/caja";

interface TopProductsCardProps {
  productos: ProductoTopDia[];
}

export function TopProductsCard({ productos }: TopProductsCardProps) {
  if (productos.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-sm font-bold uppercase tracking-wide">
          Productos más vendidos
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Top {productos.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["#", "Producto", "Cantidad", "Total"].map((h) => (
                <th
                  key={h}
                  className="border-y border-zinc-800 bg-zinc-950/40 px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr
                key={p.nombre}
                className="border-b border-zinc-800 last:border-none"
              >
                <td className="px-5 py-3 text-sm text-zinc-500">{i + 1}</td>
                <td className="px-5 py-3 text-sm font-medium text-white">
                  {p.nombre}
                </td>
                <td className="px-5 py-3 text-sm text-zinc-300">
                  {p.cantidad}
                </td>
                <td className="px-5 py-3 text-sm font-bold text-neon">
                  {formatCOP(p.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

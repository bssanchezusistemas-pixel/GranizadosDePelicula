import type { ItemPedidoCarrito, PedidoItemCaja } from "@/data/caja";

export type PrintStation = "bar" | "cocina" | "caja";

const BAR_CATEGORIES: ReadonlySet<string> = new Set([
  "helados",
  "bebidas",
  "limonadas",
]);

export function getStationForCategory(
  categoriaId: string | null | undefined,
): PrintStation {
  if (categoriaId && BAR_CATEGORIES.has(categoriaId)) {
    return "bar";
  }
  return "cocina";
}

export function getStationLabel(station: PrintStation): string {
  if (station === "bar") return "COMANDA BAR";
  if (station === "cocina") return "COMANDA COCINA";
  return "RECIBO CAJA";
}

type SplittableItem = {
  categoriaId?: string | null;
  categoria_id?: string | null;
};

export function splitItemsByStation<T extends SplittableItem>(
  items: T[],
): { bar: T[]; cocina: T[] } {
  const bar: T[] = [];
  const cocina: T[] = [];
  for (const item of items) {
    const cat = item.categoriaId ?? item.categoria_id ?? null;
    if (getStationForCategory(cat) === "bar") {
      bar.push(item);
    } else {
      cocina.push(item);
    }
  }
  return { bar, cocina };
}

export function cartItemToStation(item: ItemPedidoCarrito): PrintStation {
  return getStationForCategory(item.categoriaId);
}

export function pedidoItemToStation(item: PedidoItemCaja): PrintStation {
  return getStationForCategory(item.categoria_id);
}

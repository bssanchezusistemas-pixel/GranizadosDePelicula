import {
  MENU_CATEGORIES,
  formatCartLineName,
  getLinePrice,
  type MenuItem,
} from "@/data/menu";
import type { ItemPedidoCarrito } from "@/data/caja";

const MENU_BY_ID = new Map<string, MenuItem>();

for (const cat of MENU_CATEGORIES) {
  for (const item of cat.items) {
    MENU_BY_ID.set(item.id, item);
  }
}

export function resolveMenuUnitPrice(productoId: string): number | null {
  const [baseId, sizeLabel] = productoId.split("::");
  const item = MENU_BY_ID.get(baseId);
  if (!item) return null;

  if (sizeLabel) {
    const size = item.sizes?.find((s) => s.label === sizeLabel);
    return size?.price ?? null;
  }

  const price = getLinePrice(item);
  return price > 0 ? price : null;
}

export function resolveMenuLineName(productoId: string): string | null {
  const [baseId, sizeLabel] = productoId.split("::");
  const item = MENU_BY_ID.get(baseId);
  if (!item) return null;

  if (sizeLabel) {
    const size = item.sizes?.find((s) => s.label === sizeLabel);
    if (!size) return null;
    return formatCartLineName(item, size);
  }

  return item.name;
}

/** Valida precios y nombres contra el menú; devuelve items saneados. */
export function sanitizeCartItems(items: ItemPedidoCarrito[]): ItemPedidoCarrito[] {
  return items.map((item) => {
    const expectedPrice = resolveMenuUnitPrice(item.productoId);
    if (expectedPrice === null) {
      throw new Error(`Producto no válido: ${item.productoId}`);
    }

    const expectedName = resolveMenuLineName(item.productoId);
    if (!expectedName) {
      throw new Error(`Producto no válido: ${item.productoId}`);
    }

    if (item.cantidad < 1 || item.cantidad > 99) {
      throw new Error("Cantidad no válida.");
    }

    return {
      ...item,
      nombre: expectedName,
      precioUnitario: expectedPrice,
    };
  });
}

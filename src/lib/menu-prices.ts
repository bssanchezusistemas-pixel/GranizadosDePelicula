import {
  formatCartLineName,
  getLinePrice,
  type MenuItem,
} from "@/data/menu";
import { buildMenuIndex } from "@/lib/menu/get-menu";
import type { ItemPedidoCarrito } from "@/data/caja";

export async function resolveMenuUnitPrice(
  productoId: string,
): Promise<number | null> {
  const menuById = await buildMenuIndex();
  const [baseId, sizeLabel] = productoId.split("::");
  const item = menuById.get(baseId);
  if (!item) return null;

  if (sizeLabel) {
    const size = item.sizes?.find((s) => s.label === sizeLabel);
    return size?.price ?? null;
  }

  const price = getLinePrice(item);
  return price > 0 ? price : null;
}

export async function resolveMenuLineName(
  productoId: string,
): Promise<string | null> {
  const menuById = await buildMenuIndex();
  const [baseId, sizeLabel] = productoId.split("::");
  const item = menuById.get(baseId);
  if (!item) return null;

  if (sizeLabel) {
    const size = item.sizes?.find((s) => s.label === sizeLabel);
    if (!size) return null;
    return formatCartLineName(item, size);
  }

  return item.name;
}

export async function sanitizeCartItems(
  items: ItemPedidoCarrito[],
): Promise<ItemPedidoCarrito[]> {
  return Promise.all(
    items.map(async (item) => {
      const expectedPrice = await resolveMenuUnitPrice(item.productoId);
      if (expectedPrice === null) {
        throw new Error(`Producto no válido: ${item.productoId}`);
      }

      const expectedName = await resolveMenuLineName(item.productoId);
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
    }),
  );
}

export async function getMenuItemFromIndex(
  productoId: string,
): Promise<MenuItem | null> {
  const [baseId] = productoId.split("::");
  const menuById = await buildMenuIndex();
  return menuById.get(baseId) ?? null;
}

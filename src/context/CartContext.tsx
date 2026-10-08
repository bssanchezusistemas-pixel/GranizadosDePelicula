"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  formatCOP,
  formatCartLineName,
  getCartLineId,
  getLinePrice,
  type CartAdditionItem,
  type MenuItem,
  type MenuItemSize,
} from "@/data/menu";
import type { FormaPago } from "@/data/domicilios";
import { prefersReducedMotion } from "@/lib/cart-anchor";

export type TipoEntregaCliente = "domicilio" | "recoger";

export interface CartLine {
  lineId: string;
  item: MenuItem;
  quantity: number;
  selectedSize?: MenuItemSize;
  adiciones?: CartAdditionItem[];
  exclusiones?: string[];
  notas?: string;
}

export interface AddToCartOptions {
  selectedSize?: MenuItemSize;
  adiciones?: CartAdditionItem[];
  exclusiones?: string[];
  notas?: string;
  flyFrom?: DOMRect;
}

const FORMA_PAGO_LABEL: Record<FormaPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export const COSTO_DOMICILIO = 2_000;

interface CartContextValue {
  lines: CartLine[];
  isOpen: boolean;
  totalItems: number;
  subtotalPrice: number;
  costoDomicilio: number;
  totalPrice: number;
  tipoEntrega: TipoEntregaCliente;
  direccion: string;
  nombreRecoge: string;
  formaPago: FormaPago;
  addItem: (item: MenuItem, options?: AddToCartOptions) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setTipoEntrega: (tipo: TipoEntregaCliente) => void;
  setDireccion: (direccion: string) => void;
  setNombreRecoge: (nombre: string) => void;
  setFormaPago: (forma: FormaPago) => void;
  isCheckoutValid: () => boolean;
  buildOrderMessage: () => string;
  flyAnimation: { from: DOMRect; key: number } | null;
  cartBadgePulse: number;
  completeFlyAnimation: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [tipoEntrega, setTipoEntregaState] =
    useState<TipoEntregaCliente>("recoger");
  const [direccion, setDireccion] = useState("");
  const [nombreRecoge, setNombreRecoge] = useState("");
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [flyAnimation, setFlyAnimation] = useState<{
    from: DOMRect;
    key: number;
  } | null>(null);
  const [cartBadgePulse, setCartBadgePulse] = useState(0);

  const setTipoEntrega = useCallback((tipo: TipoEntregaCliente) => {
    setTipoEntregaState(tipo);
    if (tipo !== "recoger") setNombreRecoge("");
    if (tipo !== "domicilio") setDireccion("");
  }, []);

  const completeFlyAnimation = useCallback(() => {
    setFlyAnimation(null);
    setCartBadgePulse((n) => n + 1);
  }, []);

  const addItem = useCallback((item: MenuItem, options?: AddToCartOptions) => {
    const selectedSize =
      options?.selectedSize ??
      (item.sizes?.length === 1 ? item.sizes[0] : undefined);

    if (item.sizes?.length && !selectedSize) {
      return;
    }

    const validAdiciones = options?.adiciones
      ? options.adiciones
          .filter(
            (a) =>
              a &&
              typeof a.name === "string" &&
              a.name.trim().length > 0,
          )
          .map((a) => ({
            name: a.name.trim(),
            price: Number(a.price) || 0,
          }))
          .filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                (other) => other.name.toLowerCase() === item.name.toLowerCase(),
              ),
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      : undefined;

    const validExclusiones = options?.exclusiones
      ? options.exclusiones
          .map((e) => e.trim())
          .filter(Boolean)
          .filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                (other) => other.toLowerCase() === item.toLowerCase(),
              ),
          )
          .sort((a, b) => a.localeCompare(b))
      : undefined;

    const validNotas = options?.notas
      ?.trim()
      .replace(/^["'“”«»]+|["'“”«»]+$/g, "")
      .trim();

    const hasAdiciones = Boolean(validAdiciones && validAdiciones.length > 0);
    const hasExclusiones = Boolean(validExclusiones && validExclusiones.length > 0);
    const hasNotas = Boolean(validNotas && validNotas.length > 0);

    const customization =
      hasAdiciones || hasExclusiones || hasNotas
        ? {
            adiciones: hasAdiciones ? validAdiciones : undefined,
            exclusiones: hasExclusiones ? validExclusiones : undefined,
            notas: hasNotas ? validNotas : undefined,
          }
        : undefined;

    const lineId = getCartLineId(item, selectedSize, customization);

    setLines((prev) => {
      const existing = prev.find((line) => line.lineId === lineId);
      if (existing) {
        return prev.map((line) =>
          line.lineId === lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          lineId,
          item,
          quantity: 1,
          selectedSize,
          adiciones: customization?.adiciones,
          exclusiones: customization?.exclusiones,
          notas: customization?.notas,
        },
      ];
    });

    if (options?.flyFrom) {
      if (prefersReducedMotion()) {
        setCartBadgePulse((n) => n + 1);
      } else {
        setFlyAnimation({ from: options.flyFrom, key: Date.now() });
      }
    }
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setLines((prev) => {
      const target = prev.find((line) => line.lineId === lineId);
      if (!target) return prev;
      if (target.quantity <= 1) {
        return prev.filter((line) => line.lineId !== lineId);
      }
      return prev.map((line) =>
        line.lineId === lineId
          ? { ...line, quantity: line.quantity - 1 }
          : line,
      );
    });
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totalItems = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  const subtotalPrice = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          getLinePrice(line.item, line.selectedSize, line.adiciones) *
            line.quantity,
        0,
      ),
    [lines],
  );

  const costoDomicilio =
    tipoEntrega === "domicilio" && lines.length > 0 ? COSTO_DOMICILIO : 0;

  const totalPrice = useMemo(
    () => subtotalPrice + costoDomicilio,
    [subtotalPrice, costoDomicilio],
  );

  const isCheckoutValid = useCallback(() => {
    if (lines.length === 0) return false;
    if (tipoEntrega === "domicilio") {
      return direccion.trim().length >= 5;
    }
    return nombreRecoge.trim().length >= 2;
  }, [lines.length, tipoEntrega, direccion, nombreRecoge]);

  const buildOrderMessage = useCallback(() => {
    if (lines.length === 0) {
      return "¡Hola! Quiero hacer un pedido en Granizados de Película 🎬";
    }

    const itemsText = lines
      .map((line) => {
        const unitPrice = getLinePrice(line.item, line.selectedSize, line.adiciones);
        const name = formatCartLineName(line.item, line.selectedSize);
        const header = `${line.quantity}x ${name} — ${formatCOP(unitPrice * line.quantity)}`;

        const details: string[] = [];
        if (line.adiciones && line.adiciones.length > 0) {
          const adicionesStr = line.adiciones
            .map((a) =>
              a.price > 0 ? `${a.name} (+${formatCOP(a.price)})` : a.name,
            )
            .join(", ");
          details.push(`  • Adiciones: ${adicionesStr}`);
        }
        if (line.exclusiones && line.exclusiones.length > 0) {
          details.push(`  • Sin: ${line.exclusiones.join(", ")}`);
        }
        if (line.notas && line.notas.trim().length > 0) {
          const singleLineNota = line.notas
            .trim()
            .replace(/^["'“”«»]+|["'“”«»]+$/g, "")
            .replace(/\r?\n+/g, ", ");
          details.push(`  • Nota: "${singleLineNota}"`);
        }

        if (details.length > 0) {
          return `${header}\n${details.join("\n")}`;
        }
        return header;
      })
      .join("\n");

    const adicionalDomicilioLine =
      tipoEntrega === "domicilio"
        ? `1x Adicional Domicilio — ${formatCOP(COSTO_DOMICILIO)}`
        : null;

    const itemsConAdicional = adicionalDomicilioLine
      ? `${itemsText}\n${adicionalDomicilioLine}`
      : itemsText;

    const entregaLines =
      tipoEntrega === "domicilio"
        ? [
            `*Entrega:* Domicilio (+${formatCOP(COSTO_DOMICILIO)})`,
            `*Dirección:* ${direccion.trim()}`,
          ]
        : [
            "*Entrega:* Recoger en local",
            `*Recoge:* ${nombreRecoge.trim()}`,
          ];

    return [
      "¡Hola! Quiero pedir en *Granizados de Película* 🎬",
      "",
      "*Mi pedido:*",
      itemsConAdicional,
      "",
      `*Total:* ${formatCOP(totalPrice)}`,
      "",
      ...entregaLines,
      `*Pago:* ${FORMA_PAGO_LABEL[formaPago]}`,
      "",
      "Gracias!",
    ].join("\n");
  }, [
    lines,
    totalPrice,
    tipoEntrega,
    direccion,
    nombreRecoge,
    formaPago,
  ]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      isOpen,
      totalItems,
      subtotalPrice,
      costoDomicilio,
      totalPrice,
      tipoEntrega,
      direccion,
      nombreRecoge,
      formaPago,
      addItem,
      removeItem,
      clearCart,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((open) => !open),
      setTipoEntrega,
      setDireccion,
      setNombreRecoge,
      setFormaPago,
      isCheckoutValid,
      buildOrderMessage,
      flyAnimation,
      cartBadgePulse,
      completeFlyAnimation,
    }),
    [
      lines,
      isOpen,
      totalItems,
      subtotalPrice,
      costoDomicilio,
      totalPrice,
      tipoEntrega,
      direccion,
      nombreRecoge,
      formaPago,
      addItem,
      removeItem,
      clearCart,
      setTipoEntrega,
      isCheckoutValid,
      buildOrderMessage,
      flyAnimation,
      cartBadgePulse,
      completeFlyAnimation,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

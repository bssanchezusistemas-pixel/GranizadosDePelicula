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
  BUSINESS,
  formatCOP,
  formatCartLineName,
  getCartLineId,
  getLinePrice,
  type MenuItem,
  type MenuItemSize,
} from "@/data/menu";
import type { FormaPago } from "@/data/domicilios";

export type TipoEntregaCliente = "domicilio" | "recoger";

export interface CartLine {
  lineId: string;
  item: MenuItem;
  quantity: number;
  selectedSize?: MenuItemSize;
}

export interface AddToCartOptions {
  selectedSize?: MenuItemSize;
}

const FORMA_PAGO_LABEL: Record<FormaPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

interface CartContextValue {
  lines: CartLine[];
  isOpen: boolean;
  totalItems: number;
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

  const setTipoEntrega = useCallback((tipo: TipoEntregaCliente) => {
    setTipoEntregaState(tipo);
    if (tipo !== "recoger") setNombreRecoge("");
    if (tipo !== "domicilio") setDireccion("");
  }, []);

  const addItem = useCallback((item: MenuItem, options?: AddToCartOptions) => {
    const selectedSize =
      options?.selectedSize ??
      (item.sizes?.length === 1 ? item.sizes[0] : undefined);

    if (item.sizes?.length && !selectedSize) {
      return;
    }

    const lineId = getCartLineId(item, selectedSize);

    setLines((prev) => {
      const existing = prev.find((line) => line.lineId === lineId);
      if (existing) {
        return prev.map((line) =>
          line.lineId === lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...prev, { lineId, item, quantity: 1, selectedSize }];
    });
    setIsOpen(true);
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

  const totalPrice = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum + getLinePrice(line.item, line.selectedSize) * line.quantity,
        0,
      ),
    [lines],
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
        const unitPrice = getLinePrice(line.item, line.selectedSize);
        const name = formatCartLineName(line.item, line.selectedSize);
        return `${line.quantity}x ${name} — ${formatCOP(unitPrice * line.quantity)}`;
      })
      .join("\n");

    const entregaLines =
      tipoEntrega === "domicilio"
        ? [
            "*Entrega:* Domicilio",
            `*Dirección:* ${direccion.trim()}`,
          ]
        : [
            "*Entrega:* Recoger en local",
            `*Recoge:* ${nombreRecoge.trim()}`,
            `*Lugar:* ${BUSINESS.address}, ${BUSINESS.city}`,
          ];

    return [
      "¡Hola! Quiero pedir en *Granizados de Película* 🎬",
      "",
      "*Mi pedido:*",
      itemsText,
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
    }),
    [
      lines,
      isOpen,
      totalItems,
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

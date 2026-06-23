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
  PEDIDOS_MOCK,
  PEDIDO_INICIAL,
  REPARTIDORES,
  type FormaPago,
  type ItemPedido,
  type Pedido,
  type TipoComision,
  type TipoEntrega,
} from "@/data/ventas";
import { BASE_EFECTIVO_DEFAULT } from "@/data/domicilios";

export interface NuevoPedidoInput {
  items: ItemPedido[];
  total: number;
  tipoEntrega: TipoEntrega;
  formaPago: FormaPago;
  direccion?: string;
  domiciliarioId?: string;
  domiciliarioNombre?: string;
  pagaCon?: number;
  comisionPagadaPor?: TipoComision;
}

interface VentasContextValue {
  pedidos: Pedido[];
  /** Próximo número de pedido que se asignará al confirmar. */
  siguienteNumero: number;
  /** Base de efectivo por repartidor (0 = trabaja sin base). */
  bases: Record<string, number>;
  agregarPedido: (input: NuevoPedidoInput) => Pedido;
  /** Marca un pedido domiciliario como aceptado por su repartidor. */
  aceptarPedido: (pedidoId: string) => void;
  /** Fija la base de un repartidor (0 = sin base). */
  setBase: (repartidorId: string, monto: number) => void;
  /** Alterna entre la base por defecto (200.000) y sin base (0). */
  toggleBase: (repartidorId: string) => void;
  /** Limpia el día: vuelve al estado inicial (solo mock). */
  reiniciarDia: () => void;
}

const VentasContext = createContext<VentasContextValue | null>(null);

function calcularSiguienteNumero(pedidos: Pedido[]): number {
  if (pedidos.length === 0) return PEDIDO_INICIAL;
  const max = pedidos.reduce(
    (m, p) => (p.numeroPedido > m ? p.numeroPedido : m),
    PEDIDO_INICIAL - 1,
  );
  return Math.max(PEDIDO_INICIAL, max + 1);
}

export function VentasProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>(PEDIDOS_MOCK);
  // Base de efectivo por repartidor. Por defecto todos salen con base.
  const [bases, setBases] = useState<Record<string, number>>(() =>
    Object.fromEntries(REPARTIDORES.map((r) => [r.id, BASE_EFECTIVO_DEFAULT])),
  );

  const siguienteNumero = useMemo(
    () => calcularSiguienteNumero(pedidos),
    [pedidos],
  );

  const agregarPedido = useCallback(
    (input: NuevoPedidoInput): Pedido => {
      const nuevo: Pedido = {
        id: `pedido-${Date.now()}`,
        numeroPedido: calcularSiguienteNumero(pedidos),
        items: input.items,
        total: input.total,
        tipoEntrega: input.tipoEntrega,
        formaPago: input.formaPago,
        direccion: input.direccion,
        creadoEn: new Date().toISOString(),
        domiciliarioId: input.domiciliarioId,
        domiciliarioNombre: input.domiciliarioNombre,
        pagaCon: input.pagaCon,
        comisionPagadaPor: input.comisionPagadaPor,
        // Los domicilios nuevos nacen pendientes hasta que el repartidor los acepta.
        estadoDomicilio:
          input.tipoEntrega === "domicilio" ? "pendiente" : undefined,
      };
      setPedidos((prev) => [...prev, nuevo]);
      return nuevo;
    },
    [pedidos],
  );

  const aceptarPedido = useCallback((pedidoId: string) => {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? { ...p, estadoDomicilio: "aceptado" } : p,
      ),
    );
  }, []);

  const setBase = useCallback((repartidorId: string, monto: number) => {
    setBases((prev) => ({ ...prev, [repartidorId]: monto }));
  }, []);

  const toggleBase = useCallback((repartidorId: string) => {
    setBases((prev) => ({
      ...prev,
      [repartidorId]:
        prev[repartidorId] > 0 ? 0 : BASE_EFECTIVO_DEFAULT,
    }));
  }, []);

  const reiniciarDia = useCallback(() => setPedidos([]), []);

  const value = useMemo<VentasContextValue>(
    () => ({
      pedidos,
      siguienteNumero,
      bases,
      agregarPedido,
      aceptarPedido,
      setBase,
      toggleBase,
      reiniciarDia,
    }),
    [
      pedidos,
      siguienteNumero,
      bases,
      agregarPedido,
      aceptarPedido,
      setBase,
      toggleBase,
      reiniciarDia,
    ],
  );

  return (
    <VentasContext.Provider value={value}>{children}</VentasContext.Provider>
  );
}

export function useVentas() {
  const context = useContext(VentasContext);
  if (!context) {
    throw new Error("useVentas must be used within VentasProvider");
  }
  return context;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductGrid } from "@/components/caja/ProductGrid";
import { CartPanel, itemCarritoKey } from "@/components/caja/CartPanel";
import { CheckoutBar } from "@/components/caja/CheckoutBar";
import { PrintBridgeStatus } from "@/components/caja/PrintBridgeStatus";
import {
  confirmarPedidoAction,
  getDomiciliariosConJornadaAction,
  getSiguienteNumeroAction,
  getUbicacionesAction,
} from "@/app/caja/actions";
import type { FormaPago } from "@/data/domicilios";
import { formatCOP } from "@/lib/currency";
import {
  COMISION_DOMICILIO,
  type DomiciliarioConJornada,
  type ItemPedidoCarrito,
  type PedidoCaja,
  type TipoEntrega,
  type Ubicacion,
} from "@/data/caja";
import { buildOrderTicket } from "@/lib/print/build-ticket";
import { sendPrintTicket } from "@/lib/print/send";

export default function CajaPage() {
  const router = useRouter();
  const [items, setItems] = useState<ItemPedidoCarrito[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [siguienteNumero, setSiguienteNumero] = useState<number | null>(null);
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("mesa");
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [ubicacionId, setUbicacionId] = useState<string | null>(null);
  const [nombreRecoge, setNombreRecoge] = useState("");
  const [direccion, setDireccion] = useState("");
  const [pagaCon, setPagaCon] = useState(0);
  const [domiciliarios, setDomiciliarios] = useState<DomiciliarioConJornada[]>(
    [],
  );
  const [domiciliarioId, setDomiciliarioId] = useState<string | null>(null);
  const [cargandoDomiciliarios, setCargandoDomiciliarios] = useState(false);
  const [ultimoPedido, setUltimoPedido] = useState<PedidoCaja | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printAviso, setPrintAviso] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      const [ubs, num] = await Promise.all([
        getUbicacionesAction(),
        getSiguienteNumeroAction(),
      ]);
      setUbicaciones(ubs);
      setSiguienteNumero(num);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos.");
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cargarDomiciliarios = useCallback(async () => {
    setCargandoDomiciliarios(true);
    try {
      const lista = await getDomiciliariosConJornadaAction();
      setDomiciliarios(lista);
      setDomiciliarioId((prev) =>
        prev && lista.some((d) => d.id === prev) ? prev : null,
      );
    } catch {
      setDomiciliarios([]);
      setDomiciliarioId(null);
    } finally {
      setCargandoDomiciliarios(false);
    }
  }, []);

  useEffect(() => {
    if (tipoEntrega === "domicilio") {
      cargarDomiciliarios();
    }
  }, [tipoEntrega, cargarDomiciliarios]);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0),
    [items],
  );

  function agregarAlCarrito(nuevo: ItemPedidoCarrito) {
    setItems((prev) => {
      const key = itemCarritoKey(nuevo);
      const existente = prev.find((i) => itemCarritoKey(i) === key);
      if (existente) {
        return prev.map((i) =>
          itemCarritoKey(i) === key
            ? { ...i, cantidad: i.cantidad + 1 }
            : i,
        );
      }
      return [...prev, nuevo];
    });
  }

  function incrementar(key: string) {
    setItems((prev) =>
      prev.map((i) =>
        itemCarritoKey(i) === key ? { ...i, cantidad: i.cantidad + 1 } : i,
      ),
    );
  }

  function decrementar(key: string) {
    setItems((prev) =>
      prev
        .map((i) =>
          itemCarritoKey(i) === key ? { ...i, cantidad: i.cantidad - 1 } : i,
        )
        .filter((i) => i.cantidad > 0),
    );
  }

  function quitar(key: string) {
    setItems((prev) => prev.filter((i) => itemCarritoKey(i) !== key));
  }

  async function confirmar() {
    if (items.length === 0 || confirmando) return;
    setConfirmando(true);
    setError(null);
    setPrintAviso(null);
    const itemsParaImprimir = items;
    try {
      const pedido = await confirmarPedidoAction({
        items: itemsParaImprimir,
        tipoEntrega,
        formaPago,
        ubicacionId: ubicacionId ?? undefined,
        nombreRecoge: nombreRecoge.trim() || undefined,
        direccion: direccion.trim() || undefined,
        pagaCon: pagaCon > 0 ? pagaCon : undefined,
        comisionPagadaPor:
          tipoEntrega === "domicilio" ? "cliente" : undefined,
        domiciliarioId: domiciliarioId ?? undefined,
      });

      setItems([]);
      if (tipoEntrega !== "mesa") {
        setNombreRecoge("");
        setDireccion("");
        setPagaCon(0);
        setDomiciliarioId(null);
      }
      setUltimoPedido(pedido);
      await cargarDatos();
      router.refresh();

      const ticket = buildOrderTicket({
        items: itemsParaImprimir,
        pedido,
        tipoEntrega,
        formaPago,
        ubicaciones,
        ubicacionId,
        nombreRecoge,
        direccion,
        pagaCon,
      });
      void sendPrintTicket(ticket).then((result) => {
        if (!result.ok) {
          setPrintAviso(result.error ?? "No se pudo imprimir la comanda.");
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo confirmar el pedido.");
    } finally {
      setConfirmando(false);
    }
  }

  const totalMostrar =
    tipoEntrega === "domicilio" ? total + COMISION_DOMICILIO : total;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neon">
            Estación de caja
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase text-white sm:text-3xl">
            Toma de pedidos
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrintBridgeStatus />
          {siguienteNumero !== null && (
          <div className="rounded-xl border border-white/8 bg-cinema-gray px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Próximo #
            </p>
            <p className="font-[family-name:var(--font-display)] text-xl text-neon">
              {siguienteNumero}
            </p>
          </div>
          )}
        </div>
      </div>

      {printAviso && (
        <div className="mb-5 rounded-xl border border-amber-700/40 bg-amber-900/15 px-5 py-3 text-sm font-bold text-amber-200">
          {printAviso}
          <button
            type="button"
            onClick={() => setPrintAviso(null)}
            className="ml-3 text-[10px] uppercase tracking-wide text-amber-400/80 hover:text-amber-300"
          >
            Cerrar
          </button>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-700/40 bg-red-900/15 px-5 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      )}

      {ultimoPedido && (
        <div className="mb-5 rounded-xl border border-emerald-700/40 bg-emerald-900/15 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-emerald-300">
                ✓ Pedido #{ultimoPedido.numero_pedido} confirmado
              </p>
              {(ultimoPedido.tipo_entrega === "recoger" ||
                ultimoPedido.tipo_entrega === "domicilio") &&
                ultimoPedido.forma_pago === "efectivo" && (
                  <div className="mt-3 space-y-1 text-sm text-white/70">
                    <p>
                      Total: {formatCOP(Number(ultimoPedido.total))}
                      {ultimoPedido.paga_con != null && (
                        <> · Paga con {formatCOP(Number(ultimoPedido.paga_con))}</>
                      )}
                    </p>
                    {ultimoPedido.devuelta != null &&
                      Number(ultimoPedido.devuelta) >= 0 && (
                        <p className="font-[family-name:var(--font-display)] text-2xl text-amber-400">
                          Devuelta: {formatCOP(Number(ultimoPedido.devuelta))}
                        </p>
                      )}
                  </div>
                )}
            </div>
            <button
              type="button"
              onClick={() => setUltimoPedido(null)}
              className="rounded-lg border border-emerald-700/50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <ProductGrid onAdd={agregarAlCarrito} />
        </div>
        <aside className="lg:sticky lg:top-[85px] lg:self-start">
          <div className="space-y-4">
            <div className="h-[340px] sm:h-[420px]">
              <CartPanel
                items={items}
                total={totalMostrar}
                onIncrementar={incrementar}
                onDecrementar={decrementar}
                onQuitar={quitar}
                onVaciar={() => setItems([])}
              />
            </div>
            <CheckoutBar
              total={total}
              tipoEntrega={tipoEntrega}
              formaPago={formaPago}
              ubicaciones={ubicaciones}
              ubicacionId={ubicacionId}
              nombreRecoge={nombreRecoge}
              direccion={direccion}
              pagaCon={pagaCon}
              carritoVacio={items.length === 0}
              confirmando={confirmando}
              onTipoEntrega={(t) => {
                setTipoEntrega(t);
                if (t !== "mesa") setUbicacionId(null);
                if (t !== "recoger") setNombreRecoge("");
                if (t !== "domicilio") {
        setDireccion("");
        setDomiciliarioId(null);
                }
                if (t !== "domicilio" && t !== "recoger") {
                  setPagaCon(0);
                }
              }}
              onFormaPago={setFormaPago}
              onUbicacion={setUbicacionId}
              onNombreRecoge={setNombreRecoge}
              onDireccion={setDireccion}
              onPagaCon={setPagaCon}
              domiciliarios={domiciliarios}
              domiciliarioId={domiciliarioId}
              cargandoDomiciliarios={cargandoDomiciliarios}
              onDomiciliario={setDomiciliarioId}
              onConfirmar={confirmar}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

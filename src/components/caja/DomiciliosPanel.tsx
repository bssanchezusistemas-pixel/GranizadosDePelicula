"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { RiderCard } from "@/components/admin/RiderCard";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { NewDeliveryModal } from "@/components/admin/NewDeliveryModal";
import { CuadrarCajaModal } from "@/components/admin/CuadrarCajaModal";
import { IniciarJornadaModal } from "@/components/admin/IniciarJornadaModal";
import { EditDeliveryModal } from "@/components/admin/EditDeliveryModal";
import { DeletePedidoModal } from "@/components/admin/DeletePedidoModal";
import { ReiniciarDiaModal } from "@/components/admin/ReiniciarDiaModal";
import { EditarBaseModal } from "@/components/admin/EditarBaseModal";
import {
  crearDomicilioAction,
  cuadrarCajaAction,
  getResumenDomiciliariosAction,
  iniciarJornadaAction,
  actualizarPedidoAction,
  eliminarPedidoAction,
  reiniciarDiaAction,
  actualizarBaseEfectivoAction,
} from "@/app/caja/domicilios/actions";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fechaHoyBogota } from "@/lib/dates";
import { formatCOP } from "@/lib/currency";
import type { DomiciliarioConResumen, PedidoDomicilio } from "@/data/domicilios";

export function DomiciliosPanel() {
  const [riders, setRiders] = useState<DomiciliarioConResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [riderCuadrarId, setRiderCuadrarId] = useState<string | null>(null);
  const [riderIniciarId, setRiderIniciarId] = useState<string | null>(null);
  const [pedidoEditar, setPedidoEditar] = useState<PedidoDomicilio | null>(null);
  const [pedidoEliminar, setPedidoEliminar] = useState<PedidoDomicilio | null>(
    null,
  );
  const [showReiniciarDia, setShowReiniciarDia] = useState(false);
  const [riderEditarBaseId, setRiderEditarBaseId] = useState<string | null>(null);
  const [filtroDomiciliarioId, setFiltroDomiciliarioId] = useState<string | null>(
    null,
  );
  const pedidosSectionRef = useRef<HTMLDivElement>(null);

  const fecha = fechaHoyBogota();
  const configured = isSupabaseConfigured();

  const cargarDatos = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getResumenDomiciliariosAction(fecha);
      setRiders(data);
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "No se pudieron cargar los domicilios.",
      );
    } finally {
      setLoading(false);
    }
  }, [fecha, configured]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const todosPedidos = riders.flatMap((r) => r.pedidos);
  const pedidosVisibles = filtroDomiciliarioId
    ? todosPedidos.filter((p) => p.domiciliario_id === filtroDomiciliarioId)
    : todosPedidos;
  const algunSinBase = riders.some((r) => r.sinBase);
  const domiciliarioFiltrado = filtroDomiciliarioId
    ? riders.find((r) => r.id === filtroDomiciliarioId)
    : null;
  const domiciliariosConJornada = riders.filter((r) => r.jornadaIniciada);
  const totalDomicilios = todosPedidos.length;
  const debeEntregarTotal = riders.reduce((sum, r) => sum + r.debeEntregar, 0);
  const efectivoEntregadoTotal = riders.reduce(
    (sum, r) => sum + r.efectivoEntregado,
    0,
  );
  const diferenciaTotal = debeEntregarTotal - efectivoEntregadoTotal;

  async function handleSave(input: Parameters<typeof crearDomicilioAction>[0]) {
    await crearDomicilioAction(input);
    await cargarDatos();
  }

  function handleVerPedidos(riderId: string) {
    setFiltroDomiciliarioId(riderId);
    requestAnimationFrame(() => {
      pedidosSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function handleCuadrarSave(monto: number) {
    if (!riderCuadrarId) return;
    await cuadrarCajaAction({
      domiciliario_id: riderCuadrarId,
      fecha,
      monto,
    });
    await cargarDatos();
  }

  async function handleIniciarSave(baseEfectivo: number) {
    if (!riderIniciarId) return;
    await iniciarJornadaAction({
      domiciliario_id: riderIniciarId,
      fecha,
      base_efectivo: baseEfectivo,
    });
    await cargarDatos();
  }

  async function handleEditarBaseSave(baseEfectivo: number) {
    if (!riderEditarBaseId) return;
    await actualizarBaseEfectivoAction({
      domiciliario_id: riderEditarBaseId,
      fecha,
      base_efectivo: baseEfectivo,
    });
    await cargarDatos();
  }

  async function handleEditarSave(
    input: Parameters<typeof actualizarPedidoAction>[0],
  ) {
    await actualizarPedidoAction(input);
    await cargarDatos();
  }

  async function handleEliminarConfirm() {
    if (!pedidoEliminar) return;
    await eliminarPedidoAction(pedidoEliminar.id);
    await cargarDatos();
  }

  async function handleReiniciarDiaConfirm() {
    await reiniciarDiaAction(fecha);
    setFiltroDomiciliarioId(null);
    await cargarDatos();
  }

  const riderCuadrar = riderCuadrarId
    ? riders.find((r) => r.id === riderCuadrarId)
    : null;
  const riderIniciar = riderIniciarId
    ? riders.find((r) => r.id === riderIniciarId)
    : null;
  const riderEditarBase = riderEditarBaseId
    ? riders.find((r) => r.id === riderEditarBaseId)
    : null;

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neon">
            Control de caja
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase text-white sm:text-3xl">
            Domicilios de hoy
          </h1>
          <p className="mt-1 text-sm text-white/40">
            {riders.length} repartidores activos · {totalDomicilios} pedidos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-cinema-gray px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-neon" />
            {new Date()
              .toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })
              .toUpperCase()}
          </div>
          <button
            type="button"
            onClick={() => setShowReiniciarDia(true)}
            disabled={
              !configured ||
              (totalDomicilios === 0 && domiciliariosConJornada.length === 0)
            }
            className="rounded-full border border-amber-700/50 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-amber-300 hover:border-amber-500 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
          >
            Reiniciar día
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={!configured || domiciliariosConJornada.length === 0}
            className="rounded-full bg-neon px-4 py-2 text-[10px] font-black uppercase tracking-wide text-white hover:bg-neon-soft disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            + Pedido externo
          </button>
        </div>
      </div>

      {!configured && (
        <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-900/15 px-5 py-4 text-sm text-amber-200">
          <p className="font-bold">Supabase no está configurado</p>
          <p className="mt-2 text-amber-200/80">
            Copia <code className="text-amber-100">.env.local.example</code> a{" "}
            <code className="text-amber-100">.env.local</code> y reinicia el
            servidor.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 rounded-lg border border-red-700/40 bg-red-900/15 px-5 py-4 text-sm text-red-200">
          <p className="font-bold">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/50">Cargando...</p>
      ) : configured ? (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3.5 md:grid-cols-4">
            <MetricCard
              label="Domicilios hoy"
              value={String(totalDomicilios)}
              sub={riders
                .map((r) => `${r.nombre}: ${r.pedidos.length}`)
                .join(" · ")}
            />
            <MetricCard
              label="Debe entregar"
              value={formatCOP(debeEntregarTotal)}
              sub={
                algunSinBase
                  ? "base + ventas o cobro clientes"
                  : "base + ventas efectivo"
              }
            />
            <MetricCard
              label="Ya entregado"
              value={formatCOP(efectivoEntregadoTotal)}
              sub={diferenciaTotal <= 0 ? "Todo cuadrado ✓" : undefined}
              subVariant="ok"
            />
            <MetricCard
              label="Diferencia"
              value={formatCOP(Math.max(diferenciaTotal, 0))}
              sub={
                diferenciaTotal > 0 ? "pendiente por cuadrar" : "sin pendientes"
              }
              subVariant={diferenciaTotal > 0 ? "warn" : "ok"}
            />
          </div>

          <div className="mb-9 grid grid-cols-1 gap-4 md:grid-cols-2">
            {riders.map((rider) => (
              <RiderCard
                key={rider.id}
                rider={rider}
                onVerPedidos={handleVerPedidos}
                onCuadrarCaja={(id) => setRiderCuadrarId(id)}
                onIniciarJornada={(id) => setRiderIniciarId(id)}
                onEditarBase={(id) => setRiderEditarBaseId(id)}
              />
            ))}
            {riders.length === 0 && (
              <p className="text-sm text-white/50">
                No hay domiciliarios activos registrados.
              </p>
            )}
          </div>

          <div ref={pedidosSectionRef} className="scroll-mt-6">
            <OrdersTable
              pedidos={pedidosVisibles}
              domiciliarios={riders}
              filtroNombre={domiciliarioFiltrado?.nombre}
              onLimpiarFiltro={
                filtroDomiciliarioId
                  ? () => setFiltroDomiciliarioId(null)
                  : undefined
              }
              onEditar={setPedidoEditar}
              onEliminar={setPedidoEliminar}
            />
          </div>
        </>
      ) : null}

      {showModal && (
        <NewDeliveryModal
          domiciliarios={domiciliariosConJornada}
          numerosPedidoUsados={todosPedidos.map((p) => p.numero_pedido)}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {riderCuadrar && (
        <CuadrarCajaModal
          rider={riderCuadrar}
          onClose={() => setRiderCuadrarId(null)}
          onSave={handleCuadrarSave}
        />
      )}

      {riderIniciar && (
        <IniciarJornadaModal
          rider={riderIniciar}
          onClose={() => setRiderIniciarId(null)}
          onSave={handleIniciarSave}
        />
      )}

      {riderEditarBase && (
        <EditarBaseModal
          rider={riderEditarBase}
          onClose={() => setRiderEditarBaseId(null)}
          onSave={handleEditarBaseSave}
        />
      )}

      {pedidoEditar && (
        <EditDeliveryModal
          pedido={pedidoEditar}
          domiciliarios={domiciliariosConJornada}
          numerosPedidoUsados={todosPedidos.map((p) => p.numero_pedido)}
          onClose={() => setPedidoEditar(null)}
          onSave={handleEditarSave}
        />
      )}

      {pedidoEliminar && (
        <DeletePedidoModal
          pedido={pedidoEliminar}
          onClose={() => setPedidoEliminar(null)}
          onConfirm={handleEliminarConfirm}
        />
      )}

      {showReiniciarDia && (
        <ReiniciarDiaModal
          totalPedidos={totalDomicilios}
          domiciliariosEnTurno={domiciliariosConJornada.length}
          onClose={() => setShowReiniciarDia(false)}
          onConfirm={handleReiniciarDiaConfirm}
        />
      )}
    </div>
  );
}

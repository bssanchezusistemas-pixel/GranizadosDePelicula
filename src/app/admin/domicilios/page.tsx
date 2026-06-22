"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/admin/MetricCard";
import { RiderCard } from "@/components/admin/RiderCard";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { NewDeliveryModal } from "@/components/admin/NewDeliveryModal";
import { getResumenDomiciliariosDelDia, crearDomicilio } from "@/lib/domicilios-queries";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { DomiciliarioConResumen } from "@/data/domicilios";

function formatCOP(value: number) {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DomiciliosPage() {
  const [riders, setRiders] = useState<DomiciliarioConResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fecha = hoyISO();
  const configured = isSupabaseConfigured();

  const cargarDatos = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getResumenDomiciliariosDelDia(fecha);
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
  const totalDomicilios = todosPedidos.length;
  const efectivoEsperadoTotal = riders.reduce(
    (sum, r) => sum + r.efectivoEsperado,
    0,
  );
  const efectivoEntregadoTotal = riders.reduce(
    (sum, r) => sum + Math.max(r.efectivoEsperado - r.diferencia, 0),
    0,
  );
  const diferenciaTotal = efectivoEsperadoTotal - efectivoEntregadoTotal;

  async function handleSave(input: Parameters<typeof crearDomicilio>[0]) {
    await crearDomicilio(input);
    await cargarDatos();
  }

  return (
    <div className="min-h-screen bg-cinema-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-5 sm:px-7">
          <div>
            <div className="font-black text-lg leading-tight">
              GRANIZADOS
              <span className="block text-[11px] font-extrabold tracking-wide text-neon">
                DE PELÍCULA
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-300 hover:border-zinc-500"
            >
              ← Ver landing
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300">
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
              onClick={() => setShowModal(true)}
              disabled={!configured}
              className="rounded-full bg-neon px-5 py-2 text-xs font-black hover:bg-neon-soft disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              + NUEVO DOMICILIO
            </button>
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-neon">
            Control de caja
          </div>
          <h1 className="font-black text-3xl">DOMICILIOS DE HOY</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {riders.length} domiciliarios activos · {totalDomicilios} pedidos en
            total
          </p>
        </div>

        {!configured && (
          <div className="mb-6 rounded-lg border border-amber-700/40 bg-amber-900/15 px-5 py-4 text-sm text-amber-200">
            <p className="font-bold">Supabase no está configurado</p>
            <p className="mt-2 text-amber-200/80">
              Copia <code className="text-amber-100">.env.local.example</code> a{" "}
              <code className="text-amber-100">.env.local</code>, agrega tus
              credenciales y ejecuta el SQL en{" "}
              <code className="text-amber-100">sql/001_create_tables.sql</code>.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 rounded-lg border border-red-700/40 bg-red-900/15 px-5 py-4 text-sm font-bold text-red-300">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : configured ? (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3.5 md:grid-cols-4">
              <MetricCard
                label="Domicilios hoy"
                value={String(totalDomicilios)}
                sub={riders
                  .map((r) => `${r.entregados + r.enCamino} ${r.nombre}`)
                  .join(" · ")}
              />
              <MetricCard
                label="Efectivo esperado"
                value={formatCOP(efectivoEsperadoTotal)}
                sub="de todos los domiciliarios"
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
                  onVerPedidos={() => {}}
                  onCuadrarCaja={() => {}}
                />
              ))}
              {riders.length === 0 && (
                <p className="text-sm text-zinc-500">
                  No hay domiciliarios activos registrados.
                </p>
              )}
            </div>

            <OrdersTable pedidos={todosPedidos} domiciliarios={riders} />
          </>
        ) : null}
      </div>

      {showModal && (
        <NewDeliveryModal
          domiciliarios={riders}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPedidosDelDiaAction,
  getPedidosPorFechaAction,
  getResumenSemanalCajaAction,
  reiniciarDiaCajaAction,
} from "@/app/caja/actions";
import { DailySummary } from "@/components/caja/DailySummary";
import { SalesTable } from "@/components/caja/SalesTable";
import { WeeklySummary } from "@/components/caja/WeeklySummary";
import type { PedidoCaja, ResumenSemanalCaja } from "@/data/caja";
import {
  fechaHoyBogota,
  formatFechaCorta,
  formatRangoFechas,
} from "@/lib/dates";

type VistaRegistro = "hoy" | "semana" | "fecha";

const TABS: { id: VistaRegistro; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Esta semana" },
  { id: "fecha", label: "Elegir fecha" },
];

export default function RegistroPage() {
  const hoy = fechaHoyBogota();
  const [vista, setVista] = useState<VistaRegistro>("hoy");
  const [fechaElegida, setFechaElegida] = useState(hoy);
  const [pedidos, setPedidos] = useState<PedidoCaja[]>([]);
  const [resumenSemana, setResumenSemana] = useState<ResumenSemanalCaja | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [reiniciando, setReiniciando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (vista === "semana") {
        const semana = await getResumenSemanalCajaAction(hoy);
        setResumenSemana(semana);
        setPedidos([]);
      } else {
        const fecha = vista === "hoy" ? hoy : fechaElegida;
        const data =
          vista === "hoy"
            ? await getPedidosDelDiaAction()
            : await getPedidosPorFechaAction(fecha);
        setPedidos(data);
        setResumenSemana(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el registro.");
      setPedidos([]);
      setResumenSemana(null);
    } finally {
      setLoading(false);
    }
  }, [vista, fechaElegida, hoy]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function seleccionarDiaDesdeSemana(fecha: string) {
    setFechaElegida(fecha);
    setVista("fecha");
  }

  async function handleReiniciar() {
    if (
      !confirm(
        "¿Cerrar operación del día? Se liberarán mesas y cocina. El registro de ventas de hoy se conserva.",
      )
    ) {
      return;
    }
    setReiniciando(true);
    try {
      await reiniciarDiaCajaAction();
      await cargar();
    } finally {
      setReiniciando(false);
    }
  }

  const tituloVista =
    vista === "hoy"
      ? "Registro de hoy"
      : vista === "semana"
        ? "Registro semanal"
        : `Registro del ${formatFechaCorta(fechaElegida)}`;

  const subtitulo =
    vista === "semana" && resumenSemana
      ? formatRangoFechas(resumenSemana.lunes, resumenSemana.domingo)
      : loading
        ? "Cargando..."
        : `${pedidos.length} pedidos registrados`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neon">
            Resumen de caja
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase text-white sm:text-3xl">
            {tituloVista}
          </h1>
          <p className="mt-1.5 text-sm text-white/40">{subtitulo}</p>
        </div>

        {vista === "hoy" && (
          <button
            type="button"
            onClick={handleReiniciar}
            disabled={reiniciando}
            className="rounded-full border border-amber-700/50 px-5 py-2 text-xs font-bold uppercase tracking-wide text-amber-300 transition hover:border-amber-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
          >
            {reiniciando ? "Cerrando..." : "Cerrar operación"}
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const activo = vista === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setVista(tab.id)}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                activo
                  ? "border-neon bg-neon/15 text-white"
                  : "border-white/10 text-white/55 hover:border-white/30"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {vista === "fecha" && (
        <div className="mb-6">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Fecha
          </label>
          <input
            type="date"
            value={fechaElegida}
            max={hoy}
            onChange={(e) => setFechaElegida(e.target.value)}
            className="rounded-lg border border-white/10 bg-cinema-black px-4 py-3 text-sm text-white focus:border-neon focus:outline-none"
          />
        </div>
      )}

      <div className="space-y-8">
        {error && (
          <div className="rounded-xl border border-red-700/40 bg-red-900/15 px-5 py-3 text-sm font-bold text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-white/50">Cargando registro...</p>
        ) : vista === "semana" && resumenSemana ? (
          <WeeklySummary
            resumen={resumenSemana}
            onSeleccionarDia={seleccionarDiaDesdeSemana}
          />
        ) : (
          <>
            <DailySummary
              pedidos={pedidos}
              tituloTotal={
                vista === "hoy" ? "Total vendido hoy" : "Total del día"
              }
            />
            <SalesTable
              pedidos={pedidos}
              titulo={
                vista === "hoy"
                  ? "Ventas de hoy — detalle"
                  : `Ventas del ${formatFechaCorta(fechaElegida)}`
              }
              mensajeVacio="No hay ventas registradas en esta fecha."
            />
          </>
        )}
      </div>
    </main>
  );
}

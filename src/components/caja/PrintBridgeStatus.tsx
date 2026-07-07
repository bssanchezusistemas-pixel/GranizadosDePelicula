"use client";

import { useEffect, useState } from "react";
import { checkPrintBridgeHealth } from "@/lib/print/send";

const POLL_MS = 20_000;

type Status = "checking" | "ready" | "service" | "offline";

export function PrintBridgeStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const health = await checkPrintBridgeHealth();
      if (cancelled) return;

      if (!health?.ok) {
        setStatus("offline");
        setDetail("Ejecuta el servicio de impresión en el PC de caja.");
        return;
      }

      const barOk = health.stations?.bar?.ready ?? health.printerReady;
      const cocinaOk = health.stations?.cocina?.ready ?? health.printerReady;

      if (barOk && cocinaOk) {
        setStatus("ready");
        setDetail("Bar (USB) + Cocina (red) listas");
        return;
      }

      if (barOk || cocinaOk || health.printerReady) {
        setStatus("service");
        const parts: string[] = [];
        if (!barOk) parts.push("Bar USB sin respuesta");
        if (!cocinaOk) parts.push("Cocina red sin respuesta");
        setDetail(
          parts.join(" · ") ||
            health.printerError ||
            "Revisa impresoras en .env",
        );
        return;
      }

      setStatus("service");
      setDetail(
        health.printerError ??
          "Configura PRINTER_BAR_NAME y PRINTER_COCINA_HOST en .env",
      );
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (status === "checking") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/40"
        title="Comprobando impresoras..."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        Impresoras
      </span>
    );
  }

  const styles =
    status === "ready"
      ? "border-emerald-700/40 text-emerald-400"
      : status === "service"
        ? "border-amber-700/40 text-amber-400"
        : "border-red-700/40 text-red-400";

  const dot =
    status === "ready"
      ? "bg-emerald-400"
      : status === "service"
        ? "bg-amber-400"
        : "bg-red-400";

  const label =
    status === "ready"
      ? "Impresoras listas"
      : status === "service"
        ? "Impresora parcial"
        : "Impresoras offline";

  return (
    <span
      className={`inline-flex max-w-xs items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${styles}`}
      title={detail ?? undefined}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      <span className="truncate">{label}</span>
    </span>
  );
}

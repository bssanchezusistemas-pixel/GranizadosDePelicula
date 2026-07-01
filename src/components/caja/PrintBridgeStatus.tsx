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

      if (health.printerReady) {
        setStatus("ready");
        setDetail(health.printer ? `Impresora: ${health.printer}` : null);
        return;
      }

      setStatus("service");
      setDetail(
        health.printerError ??
          (health.printer
            ? `Servicio activo pero no detecta "${health.printer}"`
            : "Configura PRINTER_NAME en .env del print-bridge"),
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
        title="Comprobando impresora..."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        Impresora
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
      ? "Impresora lista"
      : status === "service"
        ? "Driver / impresora"
        : "Impresora offline";

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

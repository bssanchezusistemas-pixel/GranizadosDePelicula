"use client";

import { useEffect, useState } from "react";
import { checkPrintBridgeHealth } from "@/lib/print/send";

const POLL_MS = 20_000;

export function PrintBridgeStatus() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [printerName, setPrinterName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const health = await checkPrintBridgeHealth();
      if (cancelled) return;
      setOnline(health?.ok === true);
      setPrinterName(health?.printer ?? null);
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (online === null) {
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

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        online
          ? "border-emerald-700/40 text-emerald-400"
          : "border-amber-700/40 text-amber-400"
      }`}
      title={
        online
          ? printerName
            ? `Impresora: ${printerName}`
            : "Servicio de impresión activo"
          : "Ejecuta npm run print:bridge en el PC de caja"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          online ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {online ? "Impresora lista" : "Impresora offline"}
    </span>
  );
}

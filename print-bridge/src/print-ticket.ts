import {
  getLineWidthForStation,
  sendRawBytesForStation,
} from "../station-printers.js";
import { buildComandaRaw } from "../templates/comanda.js";
import type { OrderTicket, PrintStation, TicketKind } from "../types.js";

export const MAX_PRINT_COPIES = 5;

function clampCopies(copies: number): number {
  if (!Number.isFinite(copies)) return 1;
  return Math.min(MAX_PRINT_COPIES, Math.max(1, Math.floor(copies)));
}

export async function printTicket(
  ticket: OrderTicket,
  options: {
    station: PrintStation;
    kind?: TicketKind;
    copies?: number;
  },
): Promise<void> {
  const station = options.station;
  const kind = options.kind ?? ticket.kind ?? "comanda";
  const total = clampCopies(options.copies ?? 1);
  const lineWidth = getLineWidthForStation(station);
  const enriched: OrderTicket = { ...ticket, station, kind };

  for (let i = 0; i < total; i++) {
    const copyLabel =
      total > 1 ? `--- Copia ${i + 1} de ${total} ---` : undefined;
    const buffer = buildComandaRaw(enriched, copyLabel, lineWidth);
    if (!buffer.length) {
      throw new Error("Ticket vacío.");
    }
    await sendRawBytesForStation(station, buffer);
  }
}

export async function isComandaPrinterReady(): Promise<boolean> {
  const { isStationReady } = await import("../station-printers.js");
  const bar = await isStationReady("bar");
  const cocina = await isStationReady("cocina");
  return bar && cocina;
}

/** @deprecated usar printTicket */
export async function printComanda(
  ticket: OrderTicket,
  copies = 1,
): Promise<void> {
  const station = ticket.station ?? "caja";
  await printTicket(ticket, { station, kind: ticket.kind ?? "comanda", copies });
}

import {
  formatCOP,
  getLineWidth,
  indent,
  lineLeftRight,
  normalizePrintText,
  separator,
  wrapText,
} from "../format.js";
import { RawEscPos } from "../raw-escpos.js";
import { isRawPrinterReady, sendRawBytes } from "../raw-send.js";
import type { OrderTicket } from "../types.js";

export const MAX_PRINT_COPIES = 5;

function clampCopies(copies: number): number {
  if (!Number.isFinite(copies)) return 1;
  return Math.min(MAX_PRINT_COPIES, Math.max(1, Math.floor(copies)));
}

function txt(value: string | undefined | null): string {
  return normalizePrintText(String(value ?? ""));
}

/** Ticket en texto plano — compatible impresoras POS por red o USB. */
export function buildComandaRaw(
  ticket: OrderTicket,
  copyLabel?: string,
): Buffer {
  const p = new RawEscPos();

  if (copyLabel) {
    p.alignCenter().line(txt(copyLabel)).blank();
  }

  p.alignCenter()
    .line("GRANIZADOS DE PELICULA")
    .line("COMANDA")
    .blank()
    .line(txt(`Pedido #${ticket.numeroPedido}`))
    .line(txt(ticket.hora))
    .blank();

  for (const line of wrapText(txt(ticket.destino))) {
    p.line(line);
  }

  if (ticket.mesero?.trim()) {
    p.line(`Mesero: ${txt(ticket.mesero)}`);
  }

  p.line(`Pago: ${txt(ticket.formaPago)}`).blank();

  p.alignLeft().line(separator());

  for (const item of ticket.items) {
    const qtyName = `${item.cantidad}x ${txt(item.nombre)}`;
    p.line(lineLeftRight(qtyName, formatCOP(item.precioLinea)));

    if (item.modificadores?.trim()) {
      for (const part of item.modificadores.split(" · ")) {
        for (const line of wrapText(txt(part.trim()), getLineWidth() - 3)) {
          p.line(indent(line));
        }
      }
    }
  }

  p.line(separator()).blank();

  if (
    ticket.comisionDomicilio != null &&
    ticket.comisionDomicilio > 0 &&
    ticket.subtotal !== ticket.total
  ) {
    p.line(lineLeftRight("Subtotal", formatCOP(ticket.subtotal)));
    p.line(lineLeftRight("Domicilio", formatCOP(ticket.comisionDomicilio)));
  }

  p.line(lineLeftRight("TOTAL", formatCOP(ticket.total)));

  if (ticket.pagaCon != null && ticket.pagaCon > 0) {
    p.line(lineLeftRight("Paga con", formatCOP(ticket.pagaCon)));
  }
  if (ticket.devuelta != null && ticket.devuelta > 0) {
    p.line(lineLeftRight("Devuelta", formatCOP(ticket.devuelta)));
  }

  p.blank().alignCenter().line("Gracias!").feed(4);

  return p.toBuffer();
}

export async function isComandaPrinterReady(): Promise<boolean> {
  return isRawPrinterReady();
}

async function printRawComanda(
  ticket: OrderTicket,
  copyLabel?: string,
): Promise<void> {
  const buffer = buildComandaRaw(ticket, copyLabel);
  if (!buffer.length) {
    throw new Error("Ticket vacío.");
  }
  await sendRawBytes(buffer);
}

export async function printComanda(
  ticket: OrderTicket,
  copies = 1,
): Promise<void> {
  const total = clampCopies(copies);

  for (let i = 0; i < total; i++) {
    const copyLabel =
      total > 1 ? `--- Copia ${i + 1} de ${total} ---` : undefined;
    await printRawComanda(ticket, copyLabel);
  }
}

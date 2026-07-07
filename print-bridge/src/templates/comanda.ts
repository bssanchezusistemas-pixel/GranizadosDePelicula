import {
  clampLine,
  formatCOP,
  indent,
  lineLeftRight,
  normalizePrintText,
  separator,
  wrapText,
} from "../format.js";
import { RawEscPos } from "../raw-escpos.js";
import type { OrderTicket } from "../types.js";
import type { PrintStation } from "../types.js";

function stationTitle(station?: PrintStation, kind?: string): string {
  if (kind === "recibo") return "FACTURA DE COBRO";
  if (kind === "completo") return "PEDIDO DOMICILIO";
  if (station === "bar") return "COMANDA BAR";
  if (station === "cocina") return "COMANDA COCINA";
  return "COMANDA";
}

function txt(value: string | undefined | null): string {
  return normalizePrintText(String(value ?? ""));
}

function renderItems(
  p: RawEscPos,
  ticket: OrderTicket,
  lineWidth: number,
): void {
  for (const item of ticket.items) {
    const price = formatCOP(item.precioLinea);
    const qtyName = `${item.cantidad}x ${txt(item.nombre)}`;

    if (qtyName.length + 1 + price.length > lineWidth) {
      for (const line of wrapText(qtyName, lineWidth)) {
        p.line(line, lineWidth);
      }
      p.line(price.padStart(lineWidth), lineWidth);
    } else {
      p.line(lineLeftRight(qtyName, price, lineWidth), lineWidth);
    }

    if (item.modificadores?.trim()) {
      for (const part of item.modificadores.split(" · ")) {
        for (const line of wrapText(txt(part.trim()), lineWidth - 3)) {
          p.line(indent(line, 3, lineWidth), lineWidth);
        }
      }
    }
  }
}

/** Ticket en texto plano ESC/POS. */
export function buildComandaRaw(
  ticket: OrderTicket,
  copyLabel?: string,
  lineWidth = 48,
): Buffer {
  const p = new RawEscPos();

  if (copyLabel) {
    p.alignCenter().line(txt(copyLabel), lineWidth).blank();
  }

  p.alignCenter()
    .line("GRANIZADOS DE PELICULA", lineWidth)
    .line(stationTitle(ticket.station, ticket.kind), lineWidth)
    .blank();

  for (const line of wrapText(
    txt(`Pedido #${ticket.numeroPedido} - ${ticket.hora}`),
    lineWidth,
  )) {
    p.line(line, lineWidth);
  }
  p.blank();

  p.alignCenter();
  for (const line of wrapText(txt(ticket.destino), lineWidth)) {
    p.line(line, lineWidth);
  }

  if (ticket.mesero?.trim()) {
    p.line(`Mesero: ${txt(ticket.mesero)}`, lineWidth);
  }

  if (ticket.kind !== "comanda") {
    p.line(`Pago: ${txt(ticket.formaPago)}`, lineWidth);
  }

  p.blank().alignLeft().line(separator("-", lineWidth), lineWidth);
  renderItems(p, ticket, lineWidth);
  p.line(separator("-", lineWidth), lineWidth).blank();

  const showTotals =
    ticket.kind === "recibo" ||
    ticket.kind === "completo" ||
    (ticket.comisionDomicilio != null && ticket.comisionDomicilio > 0);

  if (showTotals && ticket.kind !== "comanda") {
    if (ticket.subtotal !== ticket.total) {
      p.line(lineLeftRight("Subtotal", formatCOP(ticket.subtotal), lineWidth), lineWidth);
      if (ticket.comisionDomicilio != null && ticket.comisionDomicilio > 0) {
        p.line(
          lineLeftRight("Domicilio", formatCOP(ticket.comisionDomicilio), lineWidth),
          lineWidth,
        );
      }
    }

    p.line(lineLeftRight("TOTAL", formatCOP(ticket.total), lineWidth), lineWidth);

    if (ticket.pagaCon != null && ticket.pagaCon > 0) {
      p.line(lineLeftRight("Paga con", formatCOP(ticket.pagaCon), lineWidth), lineWidth);
    }
    if (ticket.devuelta != null && ticket.devuelta > 0) {
      p.line(lineLeftRight("Devuelta", formatCOP(ticket.devuelta), lineWidth), lineWidth);
    }
  }

  const footer =
    ticket.kind === "recibo"
      ? "Gracias por su visita!"
      : ticket.kind === "completo"
        ? "Pedido domicilio"
        : "Gracias!";

  p.blank().alignCenter().line(footer, lineWidth).finish();
  return p.toBuffer();
}

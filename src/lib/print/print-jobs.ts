import type { ItemPedidoCarrito, PedidoCaja, PedidoItemCaja } from "@/data/caja";
import type { FormaPago } from "@/data/domicilios";
import type { TipoEntrega, Ubicacion } from "@/data/caja";
import { buildOrderTicket, type BuildTicketInput } from "@/lib/print/build-ticket";
import { buildReceiptTicket } from "@/lib/print/build-receipt";
import { sendPrintJobs } from "@/lib/print/send";
import { splitItemsByStation, type PrintStation } from "@/lib/print/stations";
import type { OrderTicket, PrintResult, TicketKind } from "@/lib/print/types";

export interface ConfirmPrintContext {
  items: ItemPedidoCarrito[];
  pedido: PedidoCaja;
  tipoEntrega: TipoEntrega;
  formaPago: FormaPago;
  ubicaciones: Ubicacion[];
  ubicacionId: string | null;
  nombreRecoge: string;
  direccion: string;
  pagaCon: number;
}

function baseInput(ctx: ConfirmPrintContext): BuildTicketInput {
  return {
    items: ctx.items,
    pedido: ctx.pedido,
    tipoEntrega: ctx.tipoEntrega,
    formaPago: ctx.formaPago,
    ubicaciones: ctx.ubicaciones,
    ubicacionId: ctx.ubicacionId,
    nombreRecoge: ctx.nombreRecoge,
    direccion: ctx.direccion,
    pagaCon: ctx.pagaCon,
  };
}

export async function printOnConfirm(
  ctx: ConfirmPrintContext,
): Promise<PrintResult[]> {
  if (ctx.tipoEntrega === "domicilio") {
    const ticket = buildOrderTicket({
      ...baseInput(ctx),
      items: ctx.items,
    });
    ticket.station = "caja";
    ticket.kind = "completo";
    return sendPrintJobs([
      { ticket, station: "caja", kind: "completo", copies: 1 },
    ]);
  }

  const { bar, cocina } = splitItemsByStation(ctx.items);
  const jobs: {
    ticket: OrderTicket;
    station: PrintStation;
    kind: TicketKind;
    copies: number;
  }[] = [];

  if (bar.length > 0) {
    const ticket = buildOrderTicket({ ...baseInput(ctx), items: bar });
    ticket.station = "bar";
    ticket.kind = "comanda";
    jobs.push({ ticket, station: "bar", kind: "comanda", copies: 1 });
  }

  if (cocina.length > 0) {
    const ticket = buildOrderTicket({ ...baseInput(ctx), items: cocina });
    ticket.station = "cocina";
    ticket.kind = "comanda";
    jobs.push({ ticket, station: "cocina", kind: "comanda", copies: 1 });
  }

  if (jobs.length === 0) return [{ ok: true }];
  return sendPrintJobs(jobs);
}

export async function printMesaReceipt(input: {
  pedido: PedidoCaja;
  items: PedidoItemCaja[];
  pagaCon?: number;
  devuelta?: number;
}): Promise<PrintResult[]> {
  const ticket = buildReceiptTicket({
    pedido: input.pedido,
    items: input.items,
    pagaCon: input.pagaCon,
    devuelta: input.devuelta,
    kind: "recibo",
  });
  return sendPrintJobs([
    { ticket, station: "caja", kind: "recibo", copies: 1 },
  ]);
}

export async function printRecogerReceipt(input: {
  pedido: PedidoCaja;
  items: PedidoItemCaja[];
}): Promise<PrintResult[]> {
  const ticket = buildReceiptTicket({
    pedido: input.pedido,
    items: input.items,
    kind: "recibo",
  });
  return sendPrintJobs([
    { ticket, station: "caja", kind: "recibo", copies: 1 },
  ]);
}

export function formatPrintErrors(results: PrintResult[]): string | null {
  const failed = results.filter((r) => !r.ok);
  if (failed.length === 0) return null;
  return failed
    .map((r) => {
      const label =
        r.station === "bar"
          ? "Bar"
          : r.station === "cocina"
            ? "Cocina"
            : "Caja";
      return `${label}: ${r.error ?? "error desconocido"}`;
    })
    .join(" · ");
}

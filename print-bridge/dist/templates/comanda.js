import { formatCOP, getLineWidth, indent, lineLeftRight, normalizePrintText, separator, wrapText, } from "../format.js";
import { RawEscPos } from "../raw-escpos.js";
import { isRawPrinterReady, sendRawBytes } from "../raw-send.js";
export const MAX_PRINT_COPIES = 5;
function clampCopies(copies) {
    if (!Number.isFinite(copies))
        return 1;
    return Math.min(MAX_PRINT_COPIES, Math.max(1, Math.floor(copies)));
}
function txt(value) {
    return normalizePrintText(String(value ?? ""));
}
/** Ticket en texto plano — compatible impresoras POS por red o USB. */
export function buildComandaRaw(ticket, copyLabel) {
    const p = new RawEscPos();
    if (copyLabel) {
        p.alignCenter().line(txt(copyLabel)).blank();
    }
    p.alignCenter()
        .line("GRANIZADOS DE PELICULA")
        .line("COMANDA")
        .blank();
    for (const line of wrapText(txt(`Pedido #${ticket.numeroPedido} - ${ticket.hora}`))) {
        p.line(line);
    }
    p.blank();
    p.alignCenter();
    for (const line of wrapText(txt(ticket.destino))) {
        p.line(line);
    }
    if (ticket.mesero?.trim()) {
        p.line(`Mesero: ${txt(ticket.mesero)}`);
    }
    p.line(`Pago: ${txt(ticket.formaPago)}`).blank();
    p.alignLeft().line(separator());
    for (const item of ticket.items) {
        const price = formatCOP(item.precioLinea);
        const qtyName = `${item.cantidad}x ${txt(item.nombre)}`;
        const width = getLineWidth();
        if (qtyName.length + 1 + price.length > width) {
            for (const line of wrapText(qtyName, width)) {
                p.line(line);
            }
            p.line(price.padStart(width));
        }
        else {
            p.line(lineLeftRight(qtyName, price));
        }
        if (item.modificadores?.trim()) {
            for (const part of item.modificadores.split(" · ")) {
                for (const line of wrapText(txt(part.trim()), getLineWidth() - 3)) {
                    p.line(indent(line));
                }
            }
        }
    }
    p.line(separator()).blank();
    if (ticket.comisionDomicilio != null &&
        ticket.comisionDomicilio > 0 &&
        ticket.subtotal !== ticket.total) {
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
    p.blank().alignCenter().line("Gracias!").finish();
    return p.toBuffer();
}
export async function isComandaPrinterReady() {
    return isRawPrinterReady();
}
async function printRawComanda(ticket, copyLabel) {
    const buffer = buildComandaRaw(ticket, copyLabel);
    if (!buffer.length) {
        throw new Error("Ticket vacío.");
    }
    await sendRawBytes(buffer);
}
export async function printComanda(ticket, copies = 1) {
    const total = clampCopies(copies);
    for (let i = 0; i < total; i++) {
        const copyLabel = total > 1 ? `--- Copia ${i + 1} de ${total} ---` : undefined;
        await printRawComanda(ticket, copyLabel);
    }
}

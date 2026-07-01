import { formatCOP, indent, lineLeftRight, separator, wrapText, } from "../format.js";
import { executePrint } from "../printer.js";
export async function printComanda(ticket) {
    await executePrint((printer) => {
        printer.alignCenter();
        printer.bold(true);
        printer.setTextDoubleHeight();
        printer.println("GRANIZADOS DE PELICULA");
        printer.setTextNormal();
        printer.println("COMANDA");
        printer.newLine();
        printer.setTextDoubleHeight();
        printer.println(`#${ticket.numeroPedido} · ${ticket.hora}`);
        printer.setTextNormal();
        printer.newLine();
        for (const line of wrapText(ticket.destino, 48)) {
            printer.println(line);
        }
        if (ticket.mesero?.trim()) {
            printer.println(`Mesero: ${ticket.mesero.trim()}`);
        }
        printer.println(`Pago: ${ticket.formaPago}`);
        printer.newLine();
        printer.alignLeft();
        printer.println(separator());
        for (const item of ticket.items) {
            const qtyName = `${item.cantidad}x ${item.nombre}`;
            printer.bold(true);
            printer.println(lineLeftRight(qtyName, formatCOP(item.precioLinea)));
            printer.bold(false);
            if (item.modificadores?.trim()) {
                for (const part of item.modificadores.split(" · ")) {
                    for (const line of wrapText(part.trim(), 45)) {
                        printer.println(indent(line));
                    }
                }
            }
        }
        printer.println(separator());
        printer.newLine();
        if (ticket.comisionDomicilio != null &&
            ticket.comisionDomicilio > 0 &&
            ticket.subtotal !== ticket.total) {
            printer.println(lineLeftRight("Subtotal", formatCOP(ticket.subtotal)));
            printer.println(lineLeftRight("Domicilio", formatCOP(ticket.comisionDomicilio)));
        }
        printer.bold(true);
        printer.println(lineLeftRight("TOTAL", formatCOP(ticket.total)));
        printer.bold(false);
        if (ticket.pagaCon != null && ticket.pagaCon > 0) {
            printer.println(lineLeftRight("Paga con", formatCOP(ticket.pagaCon)));
        }
        if (ticket.devuelta != null && ticket.devuelta > 0) {
            printer.bold(true);
            printer.println(lineLeftRight("Devuelta", formatCOP(ticket.devuelta)));
            printer.bold(false);
        }
        printer.newLine();
        printer.alignCenter();
        printer.println("¡Gracias!");
        printer.newLine();
        printer.cut();
    });
}

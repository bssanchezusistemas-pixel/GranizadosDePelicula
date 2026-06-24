import {
  destinoPedido,
  FORMA_PAGO_LABEL,
  resumirItems,
  TIPO_ENTREGA_LABEL,
  type CierreDiarioCompleto,
  type PedidoCaja,
  type ResumenSemanalCaja,
} from "@/data/caja";
import { formatHoraBogota } from "@/lib/dates";

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(values: (string | number)[]): string {
  return values.map(escapeCsv).join(",");
}

export function buildCsvDiario(
  cierre: CierreDiarioCompleto,
  pedidos: PedidoCaja[],
): string {
  const lines: string[] = [];

  lines.push("RESUMEN DEL DÍA");
  lines.push(row(["Fecha", cierre.fecha]));
  lines.push(row(["Gran total", cierre.granTotal]));
  lines.push("");

  lines.push("CAJA (POS)");
  lines.push(
    row([
      "Pedidos",
      "Cerrados",
      "Total",
      "Efectivo",
      "Transferencia",
      "Mesa",
      "Recoger",
      "Domicilio",
    ]),
  );
  lines.push(
    row([
      cierre.caja.pedidos,
      cierre.caja.cerrados,
      cierre.caja.total,
      cierre.caja.efectivo,
      cierre.caja.transferencia,
      cierre.caja.porTipo.mesa,
      cierre.caja.porTipo.recoger,
      cierre.caja.porTipo.domicilio,
    ]),
  );
  lines.push("");

  lines.push("DOMICILIOS");
  lines.push(
    row([
      "Pedidos",
      "Total",
      "Efectivo",
      "Transferencia",
      "Debe entregar",
      "Entregado",
      "Diferencia",
    ]),
  );
  lines.push(
    row([
      cierre.domicilios.pedidos,
      cierre.domicilios.total,
      cierre.domicilios.efectivo,
      cierre.domicilios.transferencia,
      cierre.domicilios.debeEntregarTotal,
      cierre.domicilios.efectivoEntregadoTotal,
      cierre.domicilios.diferenciaTotal,
    ]),
  );
  lines.push("");

  if (cierre.repartidores.length > 0) {
    lines.push("REPARTIDORES");
    lines.push(
      row([
        "Nombre",
        "Pedidos",
        "Ventas",
        "Efectivo",
        "Debe entregar",
        "Entregado",
        "Diferencia",
        "Cuadrado",
      ]),
    );
    for (const r of cierre.repartidores) {
      lines.push(
        row([
          r.nombre,
          r.pedidos,
          r.totalVentas,
          r.ventasEfectivo,
          r.debeEntregar,
          r.efectivoEntregado,
          r.diferencia,
          r.cuadrado ? "Sí" : "No",
        ]),
      );
    }
    lines.push("");
  }

  if (cierre.topProductos.length > 0) {
    lines.push("TOP PRODUCTOS");
    lines.push(row(["Producto", "Cantidad", "Total"]));
    for (const p of cierre.topProductos) {
      lines.push(row([p.nombre, p.cantidad, p.total]));
    }
    lines.push("");
  }

  lines.push("VENTAS POS — DETALLE");
  lines.push(
    row([
      "Pedido",
      "Hora",
      "Tipo",
      "Destino",
      "Pago",
      "Total",
      "Estado",
      "Items",
    ]),
  );
  const ordenados = [...pedidos].sort(
    (a, b) => a.numero_pedido - b.numero_pedido,
  );
  for (const p of ordenados) {
    lines.push(
      row([
        p.numero_pedido,
        formatHoraBogota(p.creado_en),
        TIPO_ENTREGA_LABEL[p.tipo_entrega],
        destinoPedido(p),
        FORMA_PAGO_LABEL[p.forma_pago],
        Number(p.total),
        p.estado,
        resumirItems(
          (p.items ?? []).map((i) => ({
            nombre: i.nombre,
            cantidad: i.cantidad,
          })),
          5,
        ),
      ]),
    );
  }

  return lines.join("\n");
}

export function buildCsvSemanal(resumen: ResumenSemanalCaja): string {
  const lines: string[] = [];

  lines.push("RESUMEN SEMANAL");
  lines.push(row(["Desde", resumen.lunes]));
  lines.push(row(["Hasta", resumen.domingo]));
  lines.push(row(["Total semana", resumen.totales.total]));
  lines.push(row(["Pedidos", resumen.totales.pedidos]));
  lines.push(row(["Efectivo", resumen.totales.efectivo]));
  lines.push(row(["Transferencia", resumen.totales.transferencia]));
  lines.push("");

  lines.push("POR DÍA");
  lines.push(
    row([
      "Fecha",
      "Etiqueta",
      "Pedidos",
      "Cerrados",
      "Total",
      "Efectivo",
      "Transferencia",
    ]),
  );
  for (const dia of resumen.dias) {
    lines.push(
      row([
        dia.fecha,
        dia.etiqueta,
        dia.pedidos,
        dia.cerrados,
        dia.total,
        dia.efectivo,
        dia.transferencia,
      ]),
    );
  }

  return lines.join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\ufeff${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

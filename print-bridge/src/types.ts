export type PrintStation = "bar" | "cocina" | "caja";
export type TicketKind = "comanda" | "recibo" | "completo";

export interface OrderTicketItem {
  cantidad: number;
  nombre: string;
  precioLinea: number;
  modificadores?: string;
}

export interface OrderTicket {
  numeroPedido: number;
  hora: string;
  destino: string;
  mesero?: string;
  formaPago: string;
  items: OrderTicketItem[];
  subtotal: number;
  comisionDomicilio?: number;
  total: number;
  pagaCon?: number;
  devuelta?: number;
  station?: PrintStation;
  kind?: TicketKind;
}

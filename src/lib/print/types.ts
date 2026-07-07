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

export interface PrintJob {
  ticket: OrderTicket;
  station: PrintStation;
  kind: TicketKind;
  copies?: number;
}

export interface StationHealth {
  ready: boolean;
  interface?: string | null;
  error?: string | null;
}

export interface PrintBridgeHealth {
  ok: boolean;
  printer?: string | null;
  mode?: string | null;
  effectiveMode?: string | null;
  interface?: string | null;
  printerReady?: boolean;
  printerError?: string | null;
  port?: number;
  stations?: Partial<Record<PrintStation, StationHealth>>;
}

export interface PrintResult {
  ok: boolean;
  error?: string;
  station?: PrintStation;
}

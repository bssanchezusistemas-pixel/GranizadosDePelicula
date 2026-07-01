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
}

export interface PrintBridgeHealth {
  ok: boolean;
  printer?: string | null;
  interface?: string | null;
  printerReady?: boolean;
  printerError?: string | null;
  port?: number;
}

export interface PrintResult {
  ok: boolean;
  error?: string;
}

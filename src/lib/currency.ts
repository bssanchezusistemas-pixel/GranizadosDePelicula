export function parseCOPInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function formatCOPInput(value: number): string {
  if (!value) return "";
  return value.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

export function formatCOP(value: number): string {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

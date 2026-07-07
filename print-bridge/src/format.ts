export function getLineWidth(): number {
  const explicit = Number(process.env.PRINTER_WIDTH);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const name = (process.env.PRINTER_NAME ?? "").toLowerCase();
  // LR2000 / 80 mm ≈ 48 caracteres; 58 mm ≈ 32
  if (/lr2000|lr1100|pos-80|80c|80mm/.test(name)) return 48;
  if (/pos-58|58c|58mm/.test(name)) return 32;
  return 42;
}

export function clampLine(text: string, width = getLineWidth()): string {
  if (text.length <= width) return text;
  return width > 1 ? `${text.slice(0, width - 1)}.` : text.slice(0, width);
}
export function normalizePrintText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E]/g, "?");
}

export function formatCOP(amount: number): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "$0";
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function separator(char = "-", width = getLineWidth()): string {
  return char.repeat(width);
}

/** Izquierda + precio alineado a la derecha. */
export function lineLeftRight(
  left: string,
  right: string,
  width = getLineWidth(),
): string {
  const price = clampLine(right, width);
  if (price.length >= width) return price;

  const maxLeft = width - price.length - 1;
  const trimmed = clampLine(left, Math.max(1, maxLeft));
  const gap = width - trimmed.length - price.length;
  return trimmed + " ".repeat(Math.max(1, gap)) + price;
}

export function indent(text: string, spaces = 3, width = getLineWidth()): string {
  const prefix = " ".repeat(spaces);
  const line = prefix + text;
  return line.length > width ? line.slice(0, width) : line;
}

export function wrapText(text: string, width = getLineWidth()): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= width) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word.length > width ? word.slice(0, width) : word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

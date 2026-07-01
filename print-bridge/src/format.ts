const LINE_WIDTH = 48;

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function separator(char = "-"): string {
  return char.repeat(LINE_WIDTH);
}

/** Izquierda + precio alineado a la derecha en 48 columnas. */
export function lineLeftRight(left: string, right: string): string {
  const maxLeft = LINE_WIDTH - right.length - 1;
  const trimmed =
    left.length > maxLeft ? `${left.slice(0, maxLeft - 1)}…` : left;
  const gap = LINE_WIDTH - trimmed.length - right.length;
  return trimmed + " ".repeat(Math.max(1, gap)) + right;
}

export function indent(text: string, spaces = 3): string {
  const prefix = " ".repeat(spaces);
  return prefix + text;
}

export function wrapText(text: string, width = LINE_WIDTH): string[] {
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

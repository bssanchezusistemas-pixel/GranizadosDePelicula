const LINE_WIDTH = 48;
export function formatCOP(amount) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(amount);
}
export function separator(char = "-") {
    return char.repeat(LINE_WIDTH);
}
/** Izquierda + precio alineado a la derecha en 48 columnas. */
export function lineLeftRight(left, right) {
    const maxLeft = LINE_WIDTH - right.length - 1;
    const trimmed = left.length > maxLeft ? `${left.slice(0, maxLeft - 1)}…` : left;
    const gap = LINE_WIDTH - trimmed.length - right.length;
    return trimmed + " ".repeat(Math.max(1, gap)) + right;
}
export function indent(text, spaces = 3) {
    const prefix = " ".repeat(spaces);
    return prefix + text;
}
export function wrapText(text, width = LINE_WIDTH) {
    const words = text.split(/\s+/);
    const lines = [];
    let current = "";
    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= width) {
            current = next;
        }
        else {
            if (current)
                lines.push(current);
            current = word.length > width ? word.slice(0, width) : word;
        }
    }
    if (current)
        lines.push(current);
    return lines.length ? lines : [""];
}

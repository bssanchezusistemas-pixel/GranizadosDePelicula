export function getLineWidth() {
    const width = Number(process.env.PRINTER_WIDTH ?? 32);
    return Number.isFinite(width) && width > 0 ? width : 32;
}
/** Solo ASCII — evita bytes raros que bloquean impresoras POS-58C en modo RAW. */
export function normalizePrintText(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\u00A0/g, " ")
        .replace(/[^\x20-\x7E]/g, "?");
}
export function formatCOP(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value))
        return "$0";
    return `$${Math.round(value).toLocaleString("en-US")}`;
}
export function separator(char = "-") {
    return char.repeat(getLineWidth());
}
/** Izquierda + precio alineado a la derecha en 48 columnas. */
export function lineLeftRight(left, right) {
    const width = getLineWidth();
    const maxLeft = width - right.length - 1;
    const trimmed = left.length > maxLeft ? `${left.slice(0, maxLeft - 1)}.` : left;
    const gap = width - trimmed.length - right.length;
    return trimmed + " ".repeat(Math.max(1, gap)) + right;
}
export function indent(text, spaces = 3) {
    const prefix = " ".repeat(spaces);
    return prefix + text;
}
export function wrapText(text, width = getLineWidth()) {
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

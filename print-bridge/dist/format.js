export function getLineWidth() {
    const explicit = Number(process.env.PRINTER_WIDTH);
    if (Number.isFinite(explicit) && explicit > 0)
        return explicit;
    const name = (process.env.PRINTER_NAME ?? "").toLowerCase();
    // LR2000 / 80 mm ≈ 48 caracteres; 58 mm ≈ 32
    if (/lr2000|lr1100|pos-80|80c|80mm/.test(name))
        return 48;
    if (/pos-58|58c|58mm/.test(name))
        return 32;
    return 42;
}
export function clampLine(text, width = getLineWidth()) {
    if (text.length <= width)
        return text;
    return width > 1 ? `${text.slice(0, width - 1)}.` : text.slice(0, width);
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
/** Izquierda + precio alineado a la derecha. */
export function lineLeftRight(left, right) {
    const width = getLineWidth();
    const price = clampLine(right, width);
    if (price.length >= width)
        return price;
    const maxLeft = width - price.length - 1;
    const trimmed = clampLine(left, Math.max(1, maxLeft));
    const gap = width - trimmed.length - price.length;
    return trimmed + " ".repeat(Math.max(1, gap)) + price;
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

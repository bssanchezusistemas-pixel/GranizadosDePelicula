import { clampLine, getLineWidth } from "./format.js";
function shouldCut() {
    const v = (process.env.PRINTER_CUT ?? "full").trim().toLowerCase();
    return v !== "false" && v !== "0" && v !== "none";
}
/**
 * ESC/POS para impresoras de caja (LR2000, etc.).
 * Ancho controlado por PRINTER_WIDTH; corte al final con PRINTER_CUT.
 */
export class RawEscPos {
    chunks = [];
    constructor() {
        this.init();
    }
    init() {
        this.chunks.push(Buffer.from([0x1b, 0x40]));
        return this;
    }
    alignLeft() {
        this.chunks.push(Buffer.from([0x1b, 0x61, 0x00]));
        return this;
    }
    alignCenter() {
        this.chunks.push(Buffer.from([0x1b, 0x61, 0x01]));
        return this;
    }
    line(text) {
        this.chunks.push(Buffer.from(`${clampLine(text, getLineWidth())}\n`, "ascii"));
        return this;
    }
    blank(lines = 1) {
        for (let i = 0; i < lines; i++)
            this.line("");
        return this;
    }
    feed(lines = 3) {
        this.chunks.push(Buffer.from([0x1b, 0x64, Math.min(255, lines)]));
        return this;
    }
    /** Avance + corte (full | partial). */
    finish() {
        this.feed(4);
        if (!shouldCut())
            return this;
        const mode = (process.env.PRINTER_CUT ?? "full").trim().toLowerCase();
        if (mode === "partial") {
            // Corte parcial — muchas Epson / LR
            this.chunks.push(Buffer.from([0x1d, 0x56, 0x01]));
        }
        else {
            // Corte total
            this.chunks.push(Buffer.from([0x1d, 0x56, 0x00]));
        }
        return this;
    }
    toBuffer() {
        return Buffer.concat(this.chunks);
    }
}

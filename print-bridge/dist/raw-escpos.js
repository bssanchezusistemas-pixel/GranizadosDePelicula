/**
 * Ticket mínimo — solo texto ASCII + avance de papel (como PROBAR-IMPRESORA).
 * Sin negrita, sin doble alto, sin corte (algunas POS-58C se bloquean con eso).
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
        this.chunks.push(Buffer.from(`${text}\n`, "ascii"));
        return this;
    }
    blank(lines = 1) {
        for (let i = 0; i < lines; i++)
            this.line("");
        return this;
    }
    /** Avance de papel (sin corte). */
    feed(lines = 3) {
        this.chunks.push(Buffer.from([0x1b, 0x64, Math.min(255, lines)]));
        return this;
    }
    toBuffer() {
        return Buffer.concat(this.chunks);
    }
}

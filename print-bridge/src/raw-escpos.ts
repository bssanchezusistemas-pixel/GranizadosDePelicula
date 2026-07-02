/**
 * Ticket mínimo — solo texto ASCII + avance de papel (como PROBAR-IMPRESORA).
 * Sin negrita, sin doble alto, sin corte (algunas POS-58C se bloquean con eso).
 */
export class RawEscPos {
  private readonly chunks: Buffer[] = [];

  constructor() {
    this.init();
  }

  init(): this {
    this.chunks.push(Buffer.from([0x1b, 0x40]));
    return this;
  }

  alignLeft(): this {
    this.chunks.push(Buffer.from([0x1b, 0x61, 0x00]));
    return this;
  }

  alignCenter(): this {
    this.chunks.push(Buffer.from([0x1b, 0x61, 0x01]));
    return this;
  }

  line(text: string): this {
    this.chunks.push(Buffer.from(`${text}\n`, "ascii"));
    return this;
  }

  blank(lines = 1): this {
    for (let i = 0; i < lines; i++) this.line("");
    return this;
  }

  /** Avance de papel (sin corte). */
  feed(lines = 3): this {
    this.chunks.push(Buffer.from([0x1b, 0x64, Math.min(255, lines)]));
    return this;
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

/**
 * ESC/POS para impresoras de caja (LR2000, etc.).
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

  line(text: string, width = 48): this {
    const trimmed =
      text.length > width ? `${text.slice(0, Math.max(1, width - 1))}.` : text;
    this.chunks.push(Buffer.from(`${trimmed}\n`, "ascii"));
    return this;
  }

  blank(lines = 1): this {
    for (let i = 0; i < lines; i++) this.line("");
    return this;
  }

  feed(lines = 3): this {
    this.chunks.push(Buffer.from([0x1b, 0x64, Math.min(255, lines)]));
    return this;
  }

  finish(): this {
    this.feed(4);
    const cut = (process.env.PRINTER_CUT ?? "full").trim().toLowerCase();
    if (cut !== "false" && cut !== "0" && cut !== "none") {
      if (cut === "partial") {
        this.chunks.push(Buffer.from([0x1d, 0x56, 0x01]));
      } else {
        this.chunks.push(Buffer.from([0x1d, 0x56, 0x00]));
      }
    }
    return this;
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

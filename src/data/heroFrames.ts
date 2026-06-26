export const TOTAL_SOURCE_FRAMES = 240;
export const TOTAL_MOBILE_FRAMES = 240;

/** Desktop: /animacion/00001_resultado.webp … 00240_resultado.webp */
export function getFrameUrl(frameNumber: number): string {
  return `/animacion/${String(frameNumber).padStart(5, "0")}_resultado.webp`;
}

/** Mobile (9:16): /animacion-mobile/00001_mobil.webp … 00240_mobil.webp */
export function getMobileFrameUrl(frameNumber: number): string {
  return `/animacion-mobile/${String(frameNumber).padStart(5, "0")}_mobil.webp`;
}

/** Subsample frames for scroll performance. */
export function buildFrameSequence(
  step: number,
  total = TOTAL_SOURCE_FRAMES,
  getUrl: (n: number) => string = getFrameUrl,
): number[] {
  const frames: number[] = [];
  for (let i = 1; i <= total; i += step) {
    frames.push(i);
  }
  if (frames.at(-1) !== total) {
    frames.push(total);
  }
  return frames;
}

export function getFrameStep(isMobile: boolean, saveData = false): number {
  if (saveData) return 8;
  return isMobile ? 3 : 2;
}

export const HERO_BG = "/hero-bg.jpeg";

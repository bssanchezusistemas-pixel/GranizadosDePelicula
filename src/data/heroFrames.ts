export const TOTAL_SOURCE_FRAMES = 240;

/** Source files: /animacion/00001_resultado.webp … 00240_resultado.webp */
export function getFrameUrl(frameNumber: number): string {
  return `/animacion/${String(frameNumber).padStart(5, "0")}_resultado.webp`;
}

/** Subsample frames for scroll performance (mobile loads fewer images). */
export function buildFrameSequence(step: number): number[] {
  const frames: number[] = [];
  for (let i = 1; i <= TOTAL_SOURCE_FRAMES; i += step) {
    frames.push(i);
  }
  if (frames.at(-1) !== TOTAL_SOURCE_FRAMES) {
    frames.push(TOTAL_SOURCE_FRAMES);
  }
  return frames;
}

export function getFrameStep(isMobile: boolean, saveData = false): number {
  if (saveData) return 6;
  return isMobile ? 4 : 2;
}

export const HERO_BG = "/hero-bg.jpeg";

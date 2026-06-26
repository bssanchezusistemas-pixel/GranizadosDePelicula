import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/cart-anchor";

let pluginsRegistered = false;

/** Register GSAP plugins once per client session. */
export function registerGsapPlugins() {
  if (pluginsRegistered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
}

export function isMobileViewport(width = window.innerWidth): boolean {
  return width < 768;
}

export function isTouchDevice(): boolean {
  return ScrollTrigger.isTouch === 1;
}

/**
 * Debounced ScrollTrigger.refresh for layout changes (resize, orientation, images).
 */
export function createDebouncedScrollRefresh(delayMs = 200) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      ScrollTrigger.refresh();
    }, delayMs);
  };
}

/**
 * iOS-friendly scroll trigger bounds — reduces jump when the URL bar shows/hides.
 */
/** Scroll distance while pinned, in viewport heights (vh), not % of trigger height. */
export function clampedScrollRange(scrollVh: number) {
  const scrollPx = () =>
    `+=${Math.round(window.innerHeight * (scrollVh / 100))}`;

  return {
    start: "clamp(top top)" as const,
    end: scrollPx,
  };
}

export interface HeroScrollConfig {
  isMobile: boolean;
  reducedMotion: boolean;
  /** Pin scrub distance in viewport heights (e.g. 150 → 150vh of scroll). */
  scrollVh: number;
  scrub: number;
  frameStep: number;
  fitMode: "cover" | "contain";
  /** Vertical focal point for cover crop (0 = top, 1 = bottom). */
  focalY: number;
  /** Pull back from full cover/contain (1 = fill, 0.87 ≈ slight zoom-out on mobile). */
  fitScale: number;
  pinType?: "fixed" | "transform";
}

export function getHeroScrollConfig(
  width = typeof window !== "undefined" ? window.innerWidth : 1024,
  saveData = false,
): HeroScrollConfig {
  const isMobile = isMobileViewport(width);
  const reducedMotion = prefersReducedMotion();

  return {
    isMobile,
    reducedMotion,
    scrollVh: isMobile ? 130 : 180,
    scrub: isMobile ? 1 : 0.6,
    frameStep: saveData ? 8 : isMobile ? 5 : 2,
    fitMode: "cover",
    focalY: 0.5,
    fitScale: 1,
    pinType: isMobile && isTouchDevice() ? "fixed" : undefined,
  };
}

/**
 * Schedule work on the next animation frame (coalesces rapid updates).
 */
export function createRafScheduler<T extends (...args: never[]) => void>(fn: T) {
  let frame = 0;
  return (...args: Parameters<T>) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      fn(...args);
    });
  };
}

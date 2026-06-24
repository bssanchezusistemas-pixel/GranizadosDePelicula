/** Visible cart badge/button used as fly-animation target. */
export function getCartAnchorRect(): DOMRect | null {
  if (typeof document === "undefined") return null;

  const anchors = document.querySelectorAll<HTMLElement>("[data-cart-anchor]");
  let best: DOMRect | null = null;
  let bestScore = -1;

  for (const el of anchors) {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;

    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;

    const score = rect.width * rect.height;
    if (score > bestScore) {
      bestScore = score;
      best = rect;
    }
  }

  return best;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

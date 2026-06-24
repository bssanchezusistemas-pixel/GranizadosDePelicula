/** Solo paths relativos internos; bloquea open redirects. */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback = "/caja",
): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://") || trimmed.includes("\\")) return fallback;
  return trimmed;
}

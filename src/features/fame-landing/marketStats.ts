export type Freshness = "fresh" | "stale" | "unavailable";

export function marketFreshness(
  capturedAt: string,
  now = Date.now(),
): Freshness {
  const age = now - Date.parse(capturedAt);
  if (!Number.isFinite(age) || age < 0) return "unavailable";
  if (age < 5 * 60_000) return "fresh";
  if (age <= 30 * 60_000) return "stale";
  return "unavailable";
}

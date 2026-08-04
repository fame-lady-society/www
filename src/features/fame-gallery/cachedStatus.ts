import { unstable_cache } from "next/cache";
import { readFameGalleryStatuses, type FameGalleryStatusProjection } from "./reads";
import type { FameGalleryStatus } from "./status";

export const FAME_GALLERY_STATUS_FRESH_TTL_MS = 300_000;
export const FAME_GALLERY_STATUS_MAX_AGE_MS = 1_800_000;

export type FameGalleryStatusPresentation = {
  freshness: "fresh" | "stale" | "unavailable";
  observedAt: number | null;
  statuses: Record<string, FameGalleryStatus>;
};

/**
 * Status is a decoration over an already accepted membership snapshot.  It can
 * be retained after a refresh failure, but it can never outlive its public
 * authority window or cross into a different membership snapshot.
 */
export function presentFameGalleryStatuses(
  snapshot: FameGalleryStatusProjection | null,
  membershipFingerprint: string,
  now = Date.now(),
): FameGalleryStatusPresentation {
  if (!snapshot || snapshot.membershipFingerprint !== membershipFingerprint) {
    return { freshness: "unavailable", observedAt: null, statuses: {} };
  }
  const observedAt = snapshot.observedAt;
  if (!Number.isFinite(observedAt) || observedAt > now) {
    return { freshness: "unavailable", observedAt: null, statuses: {} };
  }
  const age = now - observedAt;
  if (age < FAME_GALLERY_STATUS_FRESH_TTL_MS) {
    return { freshness: "fresh", observedAt, statuses: snapshot.statuses };
  }
  if (age <= FAME_GALLERY_STATUS_MAX_AGE_MS) {
    return { freshness: "stale", observedAt, statuses: snapshot.statuses };
  }
  return { freshness: "unavailable", observedAt, statuses: {} };
}

const readCachedStatuses = unstable_cache(
  (visibleTokenIds: number[], membershipFingerprint: string) =>
    readFameGalleryStatuses(visibleTokenIds, membershipFingerprint),
  ["fame-gallery-status", "8453"],
  { revalidate: FAME_GALLERY_STATUS_FRESH_TTL_MS / 1000 },
);

export async function getCachedFameGalleryStatuses(
  visibleTokenIds: number[],
  membershipFingerprint: string,
): Promise<FameGalleryStatusProjection> {
  return readCachedStatuses(visibleTokenIds, membershipFingerprint);
}

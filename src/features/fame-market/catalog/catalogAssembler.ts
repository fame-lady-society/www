import type { GalleryArtworkTarget } from "../types";

function compareTargets(
  left: GalleryArtworkTarget,
  right: GalleryArtworkTarget,
) {
  if (left.tokenId !== right.tokenId) {
    return left.tokenId < right.tokenId ? -1 : 1;
  }
  return left.targetId.localeCompare(right.targetId);
}

function uniqueTargets(targets: readonly GalleryArtworkTarget[]) {
  const seen = new Set<string>();
  return targets.filter((target) => {
    if (seen.has(target.targetId)) return false;
    seen.add(target.targetId);
    return true;
  });
}

export function createGalleryCatalog(
  poolTargets: readonly GalleryArtworkTarget[],
) {
  return uniqueTargets(poolTargets);
}

export function appendGalleryCatalogTargets(
  current: readonly GalleryArtworkTarget[],
  targets: readonly GalleryArtworkTarget[],
) {
  const existing = new Set(current.map(({ targetId }) => targetId));
  const appended = uniqueTargets(targets)
    .filter(({ targetId }) => !existing.has(targetId))
    .sort(compareTargets);
  return [...current, ...appended];
}

export function reconcileGalleryCatalogTargets(
  current: readonly GalleryArtworkTarget[],
  canonical: readonly GalleryArtworkTarget[],
) {
  const canonicalById = new Map(
    uniqueTargets(canonical).map((target) => [target.targetId, target]),
  );
  const retained = current.flatMap((target) => {
    const replacement = canonicalById.get(target.targetId);
    if (!replacement) return [];
    canonicalById.delete(target.targetId);
    return [replacement];
  });
  return appendGalleryCatalogTargets(retained, [...canonicalById.values()]);
}

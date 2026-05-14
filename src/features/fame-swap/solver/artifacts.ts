import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type { FameSwapRouteArtifactId } from "../artifacts/manifest";
import type { FameRouteArtifact, FameRouteGapRow } from "../router/types";
import type { FameSwapToken } from "../tokens";
import { parsedFameSwapArtifactFiles } from "./artifactFiles";

const artifactFiles = parsedFameSwapArtifactFiles();

export const solverRoutesFile = artifactFiles.solverRoutes;
export const gapMatrixFile = artifactFiles.gapMatrix;
export const poolUniverseFile = artifactFiles.pools;
export const poolStateSnapshotFile = artifactFiles.poolStateSnapshot;

const routeById = new Map<string, FameRouteArtifact>(
  solverRoutesFile.routes.map((route) => [route.id, route]),
);

export function routeArtifactById(
  id: FameSwapRouteArtifactId | string,
): FameRouteArtifact | undefined {
  return routeById.get(id);
}

export function routeArtifactIds(): readonly FameSwapRouteArtifactId[] {
  return FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds;
}

export function supportedDirections(): string[] {
  return gapMatrixFile.rows
    .filter((row) => row.supported && row.routeArtifactId)
    .map((row) => row.direction);
}

export function routeArtifactsForPair(
  tokenIn: FameSwapToken,
  tokenOut: FameSwapToken,
): FameRouteArtifact[] {
  const pinnedIds = new Set(FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds);
  const matching = solverRoutesFile.routes.filter(
    (route) =>
      pinnedIds.has(route.id as FameSwapRouteArtifactId) &&
      route.route.tokenIn.toLowerCase() === tokenIn.address.toLowerCase() &&
      route.route.tokenOut.toLowerCase() === tokenOut.address.toLowerCase(),
  );

  const preferredId = gapRowForPair(tokenIn, tokenOut)?.routeArtifactId;
  if (!preferredId) return matching;

  return matching.sort((left, right) => {
    if (left.id === preferredId) return -1;
    if (right.id === preferredId) return 1;
    return left.id.localeCompare(right.id);
  });
}

export function gapRowForPair(
  tokenIn: FameSwapToken,
  tokenOut: FameSwapToken,
): FameRouteGapRow | undefined {
  return gapMatrixFile.rows.find(
    (row) =>
      row.tokenIn.toLowerCase() === tokenIn.address.toLowerCase() &&
      row.tokenOut.toLowerCase() === tokenOut.address.toLowerCase(),
  );
}

export function isPinnedRouteArtifactId(
  id: string,
): id is FameSwapRouteArtifactId {
  return FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds.some(
    (artifactId) => artifactId === id,
  );
}

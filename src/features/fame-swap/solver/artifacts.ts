import solverRoutesJson from "../artifacts/base-v1-solver-routes.json";
import gapMatrixJson from "../artifacts/base-v1-route-gap-matrix.json";
import poolsJson from "../artifacts/base-v1-pools.json";
import poolStateSnapshotJson from "../artifacts/base-v1-pool-state-snapshot.json";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type { FameSwapRouteArtifactId } from "../artifacts/manifest";
import type {
  FameRouteArtifact,
  FameRouteGapMatrixFile,
  FameRouteGapRow,
  FamePoolUniverseFile,
  FameSolverRoutesFile,
} from "../router/types";
import type { FamePoolStateSnapshotFile } from "./quotes/snapshotAdapter";
import type { FameSwapToken } from "../tokens";

export const solverRoutesFile = solverRoutesJson as FameSolverRoutesFile;
export const gapMatrixFile = gapMatrixJson as FameRouteGapMatrixFile;
export const poolUniverseFile = poolsJson as FamePoolUniverseFile;
export const poolStateSnapshotFile =
  poolStateSnapshotJson as FamePoolStateSnapshotFile;

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

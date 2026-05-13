import solverRoutesJson from "../artifacts/base-v1-solver-routes.json";
import gapMatrixJson from "../artifacts/base-v1-route-gap-matrix.json";
import parityVectorsJson from "../artifacts/base-v1-route-parity-vectors.json";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { encodeJsonFameRoute, hashJsonFameRoute } from "../router/encodeRoute";
import type {
  FameRouteGapMatrixFile,
  FameRouteParityVectorsFile,
  FameSolverRoutesFile,
} from "../router/types";

const solverRoutes = solverRoutesJson as FameSolverRoutesFile;
const gapMatrix = gapMatrixJson as FameRouteGapMatrixFile;
const parityVectors = parityVectorsJson as FameRouteParityVectorsFile;

let cachedIssue: string | null | undefined;

function checkFileHeaders(): string | null {
  if (
    solverRoutes.schemaVersion !== FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion ||
    gapMatrix.schemaVersion !== FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion ||
    parityVectors.schemaVersion !== FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion
  ) {
    return "FAME route artifact schema versions do not match the manifest.";
  }

  if (
    solverRoutes.pinnedBaseBlock !== FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock ||
    gapMatrix.pinnedBaseBlock !== FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock ||
    parityVectors.pinnedBaseBlock !== FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock
  ) {
    return "FAME route artifact pinned Base blocks do not match the manifest.";
  }

  return null;
}

function checkRouteArtifacts(): string | null {
  const manifestIds = new Set<string>(
    FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds,
  );

  if (solverRoutes.routes.length !== manifestIds.size) {
    return "FAME route artifact count does not match the manifest.";
  }

  for (const route of solverRoutes.routes) {
    if (!manifestIds.has(route.id)) {
      return `FAME route artifact ${route.id} is not in the manifest.`;
    }

    if (hashJsonFameRoute(route.route) !== route.routeHash) {
      return `FAME route artifact ${route.id} has an invalid route hash.`;
    }

    if (encodeJsonFameRoute(route.route) !== route.abiEncodedRoute) {
      return `FAME route artifact ${route.id} has invalid ABI encoding.`;
    }
  }

  return null;
}

function checkParityVectors(): string | null {
  for (const vector of parityVectors.vectors) {
    if (hashJsonFameRoute(vector.route) !== vector.routeHash) {
      return `FAME parity vector ${vector.id} has an invalid route hash.`;
    }

    if (encodeJsonFameRoute(vector.route) !== vector.abiEncodedRoute) {
      return `FAME parity vector ${vector.id} has invalid ABI encoding.`;
    }
  }

  return null;
}

export function artifactIntegrityIssue(): string | null {
  if (cachedIssue !== undefined) return cachedIssue;

  cachedIssue =
    checkFileHeaders() ?? checkRouteArtifacts() ?? checkParityVectors() ?? null;
  return cachedIssue;
}

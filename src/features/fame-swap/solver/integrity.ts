import { keccak256, toHex, type Hex } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { encodeJsonFameRoute, hashJsonFameRoute } from "../router/encodeRoute";
import type { FameSwapParsedArtifactFiles } from "./artifactFiles";
import {
  parsedFameSwapArtifactFiles,
  rawFameSwapArtifactFiles,
} from "./artifactFiles";
import { artifactSchemaErrorMessage } from "./artifactSchema";
import { snapshotIntegrityIssue } from "./quotes/snapshotTypes";

let cachedIssue: string | null | undefined;

function importedJsonHash(value: unknown): Hex {
  return keccak256(toHex(JSON.stringify(value)));
}

function checkImportedContentHashes(): string | null {
  const artifacts = [
    {
      label: "solver routes",
      value: rawFameSwapArtifactFiles.solverRoutes,
      expected: FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesContentHash,
    },
    {
      label: "route gap matrix",
      value: rawFameSwapArtifactFiles.gapMatrix,
      expected: FAME_SWAP_ARTIFACT_MANIFEST.gapMatrixContentHash,
    },
    {
      label: "route parity vectors",
      value: rawFameSwapArtifactFiles.parityVectors,
      expected: FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsContentHash,
    },
    {
      label: "pool universe",
      value: rawFameSwapArtifactFiles.pools,
      expected: FAME_SWAP_ARTIFACT_MANIFEST.poolsContentHash,
    },
    {
      label: "pool-state snapshot",
      value: rawFameSwapArtifactFiles.poolStateSnapshot,
      expected: FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotContentHash,
    },
  ] as const;

  for (const artifact of artifacts) {
    if (importedJsonHash(artifact.value) !== artifact.expected) {
      return `FAME ${artifact.label} content hash does not match the manifest.`;
    }
  }

  return null;
}

function parsedArtifactsOrIssue(): FameSwapParsedArtifactFiles | string {
  try {
    return parsedFameSwapArtifactFiles();
  } catch (error) {
    return artifactSchemaErrorMessage(error);
  }
}

function checkFileHeaders(files: FameSwapParsedArtifactFiles): string | null {
  if (
    files.solverRoutes.schemaVersion !==
      FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion ||
    files.gapMatrix.schemaVersion !==
      FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion ||
    files.parityVectors.schemaVersion !==
      FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion ||
    files.pools.schemaVersion !== FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion ||
    files.poolStateSnapshot.schemaVersion !==
      FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion
  ) {
    return "FAME route artifact schema versions do not match the manifest.";
  }

  if (
    files.solverRoutes.pinnedBaseBlock !==
      FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock ||
    files.gapMatrix.pinnedBaseBlock !==
      FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock ||
    files.parityVectors.pinnedBaseBlock !==
      FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock ||
    files.pools.pinnedBaseBlock !==
      FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock ||
    files.poolStateSnapshot.pinnedBaseBlock !==
      FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock
  ) {
    return "FAME route artifact pinned Base blocks do not match the manifest.";
  }

  return null;
}

function checkRouteArtifacts(
  files: FameSwapParsedArtifactFiles,
): string | null {
  const manifestIds = new Set<string>(
    FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds,
  );

  if (files.solverRoutes.routes.length !== manifestIds.size) {
    return "FAME route artifact count does not match the manifest.";
  }

  for (const route of files.solverRoutes.routes) {
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

function checkParityVectors(files: FameSwapParsedArtifactFiles): string | null {
  for (const vector of files.parityVectors.vectors) {
    if (hashJsonFameRoute(vector.route) !== vector.routeHash) {
      return `FAME parity vector ${vector.id} has an invalid route hash.`;
    }

    if (encodeJsonFameRoute(vector.route) !== vector.abiEncodedRoute) {
      return `FAME parity vector ${vector.id} has invalid ABI encoding.`;
    }
  }

  return null;
}

function checkPoolArtifacts(files: FameSwapParsedArtifactFiles): string | null {
  const poolIds = new Set(files.pools.pools.map((pool) => pool.id));

  for (const route of files.solverRoutes.routes) {
    for (const poolId of route.poolIds) {
      if (!poolIds.has(poolId)) {
        return `FAME route artifact ${route.id} references missing pool ${poolId}.`;
      }
    }
  }

  return null;
}

export function artifactIntegrityIssue(): string | null {
  if (cachedIssue !== undefined) return cachedIssue;

  const contentIssue = checkImportedContentHashes();
  if (contentIssue) {
    cachedIssue = contentIssue;
    return cachedIssue;
  }

  const artifactFiles = parsedArtifactsOrIssue();
  if (typeof artifactFiles === "string") {
    cachedIssue = artifactFiles;
    return cachedIssue;
  }

  cachedIssue =
    checkFileHeaders(artifactFiles) ??
    checkRouteArtifacts(artifactFiles) ??
    checkParityVectors(artifactFiles) ??
    checkPoolArtifacts(artifactFiles) ??
    snapshotIntegrityIssue(artifactFiles.poolStateSnapshot) ??
    null;
  return cachedIssue;
}

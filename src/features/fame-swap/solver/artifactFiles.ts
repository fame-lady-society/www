import solverRoutesJson from "../artifacts/base-v1-solver-routes.json";
import gapMatrixJson from "../artifacts/base-v1-route-gap-matrix.json";
import parityVectorsJson from "../artifacts/base-v1-route-parity-vectors.json";
import poolsJson from "../artifacts/base-v1-pools.json";
import poolStateSnapshotJson from "../artifacts/base-v1-pool-state-snapshot.json";
import type {
  FamePoolUniverseFile,
  FameRouteGapMatrixFile,
  FameRouteParityVectorsFile,
  FameSolverRoutesFile,
} from "../router/types";
import {
  parseFamePoolStateSnapshotFile,
  parseFamePoolUniverseFile,
  parseFameRouteGapMatrixFile,
  parseFameRouteParityVectorsFile,
  parseFameSolverRoutesFile,
} from "./artifactSchema";
import type { FamePoolStateSnapshotFile } from "./quotes/snapshotTypes";

export const rawFameSwapArtifactFiles = {
  solverRoutes: solverRoutesJson,
  gapMatrix: gapMatrixJson,
  parityVectors: parityVectorsJson,
  pools: poolsJson,
  poolStateSnapshot: poolStateSnapshotJson,
} as const;

export interface FameSwapParsedArtifactFiles {
  solverRoutes: FameSolverRoutesFile;
  gapMatrix: FameRouteGapMatrixFile;
  parityVectors: FameRouteParityVectorsFile;
  pools: FamePoolUniverseFile;
  poolStateSnapshot: FamePoolStateSnapshotFile;
}

let parsedArtifactFiles: FameSwapParsedArtifactFiles | null = null;

export function parsedFameSwapArtifactFiles(): FameSwapParsedArtifactFiles {
  parsedArtifactFiles ??= {
    solverRoutes: parseFameSolverRoutesFile(
      rawFameSwapArtifactFiles.solverRoutes,
    ),
    gapMatrix: parseFameRouteGapMatrixFile(rawFameSwapArtifactFiles.gapMatrix),
    parityVectors: parseFameRouteParityVectorsFile(
      rawFameSwapArtifactFiles.parityVectors,
    ),
    pools: parseFamePoolUniverseFile(rawFameSwapArtifactFiles.pools),
    poolStateSnapshot: parseFamePoolStateSnapshotFile(
      rawFameSwapArtifactFiles.poolStateSnapshot,
    ),
  };

  return parsedArtifactFiles;
}

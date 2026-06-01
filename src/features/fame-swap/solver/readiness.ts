import type { Address } from "viem";
import { displaySafeDiagnosticMessage } from "./diagnostics";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type { FameSwapConfig } from "../config";
import { artifactIntegrityIssue } from "./integrity";
import type {
  FameSwapReadiness,
  FameSwapReadinessBlocked,
  FameSwapReadinessReason,
} from "./types";

const EXPECTED_FEE_PPM = 2_222n;

export interface RouterPolicySnapshot {
  feePpm: bigint;
  venueFamilies: ReadonlyMap<number, boolean>;
  venueTargets: ReadonlyMap<string, boolean>;
  v4HookDataKeys: ReadonlyMap<string, boolean>;
}

export interface RouterPolicyReader {
  read(routerAddress: Address): Promise<RouterPolicySnapshot>;
}

function targetKey(familyOrdinal: number, target: Address): string {
  return `${familyOrdinal}:${target.toLowerCase()}`;
}

function blocked(
  reason: FameSwapReadinessReason,
  message: string,
  routerAddress: Address | null,
): FameSwapReadinessBlocked {
  return {
    status: "not_live_ready",
    reason,
    message,
    routerAddress,
  };
}

function displaySafeReadinessError(error: unknown): string {
  return displaySafeDiagnosticMessage(error);
}

export function staticReadiness(config: FameSwapConfig): FameSwapReadiness {
  const integrityIssue = artifactIntegrityIssue();
  if (integrityIssue) {
    return blocked(
      "artifact_hash_mismatch",
      integrityIssue,
      config.routerAddress,
    );
  }

  if (
    config.expectedSchemaVersion !== FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion
  ) {
    return blocked(
      "schema_mismatch",
      "Router schema config does not match the pinned FAME route artifacts.",
      config.routerAddress,
    );
  }

  if (
    config.expectedPinnedBaseBlock !==
    FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock
  ) {
    return blocked(
      "pinned_block_mismatch",
      "Pinned Base block config does not match the FAME route artifacts.",
      config.routerAddress,
    );
  }

  if (
    config.expectedSolverRoutesHash !==
      FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash ||
    config.expectedGapMatrixHash !==
      FAME_SWAP_ARTIFACT_MANIFEST.gapMatrixJsonHash ||
    config.expectedParityVectorsHash !==
      FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsJsonHash ||
    config.expectedPoolsHash !== FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash ||
    config.expectedPoolStateSnapshotHash !==
      FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash
  ) {
    return blocked(
      "artifact_hash_mismatch",
      "FAME route artifact hashes do not match the approved manifest.",
      config.routerAddress,
    );
  }

  if (!config.routerAddress) {
    return blocked(
      "missing_router",
      "FAME router address is not configured for live execution.",
      null,
    );
  }

  return {
    status: "ready",
    routerAddress: config.routerAddress,
    feePpm: EXPECTED_FEE_PPM,
  };
}

export async function liveReadiness(
  config: FameSwapConfig,
  reader: RouterPolicyReader,
): Promise<FameSwapReadiness> {
  const staticResult = staticReadiness(config);
  if (staticResult.status === "not_live_ready") return staticResult;

  try {
    const snapshot = await reader.read(staticResult.routerAddress);

    if (snapshot.feePpm !== EXPECTED_FEE_PPM) {
      return blocked(
        "fee_mismatch",
        "Live FAME router fee does not match the pinned route policy.",
        staticResult.routerAddress,
      );
    }

    for (const target of FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets) {
      if (!snapshot.venueFamilies.get(target.familyOrdinal)) {
        return blocked(
          "venue_family_disabled",
          `${target.family} venue family is not enabled on the configured FAME router.`,
          staticResult.routerAddress,
        );
      }

      if (
        !snapshot.venueTargets.get(
          targetKey(target.familyOrdinal, target.target),
        )
      ) {
        return blocked(
          "venue_target_disabled",
          `${target.family} venue target is not enabled on the configured FAME router.`,
          staticResult.routerAddress,
        );
      }
    }

    for (const hookDataKey of FAME_SWAP_ARTIFACT_MANIFEST.requiredV4HookDataKeys) {
      if (!snapshot.v4HookDataKeys.get(hookDataKey.toLowerCase())) {
        return blocked(
          "v4_hook_data_disabled",
          "A required FAME router V4 hook-data hash is not enabled.",
          staticResult.routerAddress,
        );
      }
    }

    return {
      status: "ready",
      routerAddress: staticResult.routerAddress,
      feePpm: snapshot.feePpm,
    };
  } catch (error) {
    const detail = ` ${displaySafeReadinessError(error)}`;
    return blocked(
      "read_error",
      `Could not read live FAME router readiness state.${detail}`,
      staticResult.routerAddress,
    );
  }
}

export function routerPolicyTargetKey(
  familyOrdinal: number,
  target: Address,
): string {
  return targetKey(familyOrdinal, target);
}

export { EXPECTED_FEE_PPM };

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAddress } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type { FameSwapConfig } from "../config";
import {
  liveReadiness,
  routerPolicyTargetKey,
  staticReadiness,
  type RouterPolicyReader,
  type RouterPolicySnapshot,
} from "./readiness";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "./slippage";

const routerAddress = "0x0000000000000000000000000000000000000009";

function liveConfig(overrides: Partial<FameSwapConfig> = {}): FameSwapConfig {
  return {
    routerAddress,
    defaultSlippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
    expectedSchemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
    expectedPinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
    expectedSolverRoutesHash: FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
    expectedGapMatrixHash: FAME_SWAP_ARTIFACT_MANIFEST.gapMatrixJsonHash,
    expectedParityVectorsHash:
      FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsJsonHash,
    expectedPoolsHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
    expectedPoolStateSnapshotHash:
      FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash,
    ...overrides,
  };
}

function readySnapshot(
  overrides: Partial<RouterPolicySnapshot> = {},
): RouterPolicySnapshot {
  return {
    feePpm: 2_222n,
    venueFamilies: new Map(
      FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map((target) => [
        target.familyOrdinal,
        true,
      ]),
    ),
    venueTargets: new Map(
      FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map((target) => [
        routerPolicyTargetKey(target.familyOrdinal, target.target),
        true,
      ]),
    ),
    v4HookDataKeys: new Map(
      FAME_SWAP_ARTIFACT_MANIFEST.requiredV4HookDataKeys.map((key) => [
        key.toLowerCase(),
        true,
      ]),
    ),
    ...overrides,
  };
}

function reader(snapshot: RouterPolicySnapshot): RouterPolicyReader {
  return {
    read: async () => snapshot,
  };
}

describe("FAME swap readiness", () => {
  it("keeps manifest venue targets strict-valid for viem live reads", () => {
    for (const target of FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets) {
      assert.equal(
        isAddress(target.target),
        true,
        `${target.family} target must be lowercase or checksum-valid`,
      );
    }
  });

  it("fails closed when public config is missing or mismatched", () => {
    assert.equal(
      staticReadiness(liveConfig({ routerAddress: null })).status,
      "not_live_ready",
    );

    const schemaMismatch = staticReadiness(
      liveConfig({ expectedSchemaVersion: 2 }),
    );
    assert.equal(schemaMismatch.status, "not_live_ready");
    if (schemaMismatch.status === "not_live_ready") {
      assert.equal(schemaMismatch.reason, "schema_mismatch");
    }

    assert.equal(staticReadiness(liveConfig()).status, "ready");
  });

  it("requires live router policy gates before reporting ready", async () => {
    const result = await liveReadiness(liveConfig(), reader(readySnapshot()));
    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.feePpm, 2_222n);
    }
  });

  it("fails closed for disabled venue family, target, fee mismatch, and read errors", async () => {
    const firstTarget = FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets[0];

    const disabledFamily = await liveReadiness(
      liveConfig(),
      reader(
        readySnapshot({
          venueFamilies: new Map([[firstTarget.familyOrdinal, false]]),
        }),
      ),
    );
    assert.equal(disabledFamily.status, "not_live_ready");
    if (disabledFamily.status === "not_live_ready") {
      assert.equal(disabledFamily.reason, "venue_family_disabled");
    }

    const disabledTarget = await liveReadiness(
      liveConfig(),
      reader(
        readySnapshot({
          venueTargets: new Map([
            [
              routerPolicyTargetKey(
                firstTarget.familyOrdinal,
                firstTarget.target,
              ),
              false,
            ],
          ]),
        }),
      ),
    );
    assert.equal(disabledTarget.status, "not_live_ready");
    if (disabledTarget.status === "not_live_ready") {
      assert.equal(disabledTarget.reason, "venue_target_disabled");
    }

    const feeMismatch = await liveReadiness(
      liveConfig(),
      reader(readySnapshot({ feePpm: 1n })),
    );
    assert.equal(feeMismatch.status, "not_live_ready");
    if (feeMismatch.status === "not_live_ready") {
      assert.equal(feeMismatch.reason, "fee_mismatch");
    }

    const readError = await liveReadiness(liveConfig(), {
      read: async () => {
        throw new Error("rpc down");
      },
    });
    assert.equal(readError.status, "not_live_ready");
    if (readError.status === "not_live_ready") {
      assert.equal(readError.reason, "read_error");
    }
  });

  it("redacts provider URLs from public readiness errors", async () => {
    const readError = await liveReadiness(liveConfig(), {
      read: async () => {
        throw new Error(
          "fetch failed https://base-mainnet.g.alchemy.com/v2/super-secret-key",
        );
      },
    });

    assert.equal(readError.status, "not_live_ready");
    if (readError.status === "not_live_ready") {
      assert.equal(readError.reason, "read_error");
      assert.match(readError.message, /\[redacted-url\]/);
      assert.doesNotMatch(readError.message, /super-secret-key/);
    }
  });
});

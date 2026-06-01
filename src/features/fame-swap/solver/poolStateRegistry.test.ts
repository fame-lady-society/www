import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import {
  FAME_POOL_ACTIVATION_LEDGER_HASH,
  FAME_POOL_ACTIVATION_SCHEMA_VERSION,
  FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
  REVIEWED_POOL_ACTIVATIONS,
  poolIdsForActivationStatus,
} from "./poolActivationLedger";
import {
  activationStatusForRegistryPoolId,
  CL_REPLAY_CAPABLE_FAME_POOL_IDS,
  COMPACT_QUOTE_CAPABLE_FAME_POOL_IDS,
  famePoolSupportsCompactQuote,
  famePoolStateRegistry,
  famePoolStateRegistrySourceId,
  QUOTE_MODEL_CAPABLE_FAME_POOL_IDS,
} from "./poolStateRegistry";

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function activationLedgerDigest(): string {
  const material = {
    schemaVersion: FAME_POOL_ACTIVATION_SCHEMA_VERSION,
    selectedCandidatePoolId: FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
    liveRouteDependencyPoolId: FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
    reviewedPoolActivations: REVIEWED_POOL_ACTIVATIONS,
  };
  return `0x${createHash("sha256").update(canonicalJson(material)).digest("hex")}`;
}

describe("FAME pool-state registry", () => {
  it("derives quote-model-capable pools from the reviewed route universe", () => {
    const registry = famePoolStateRegistry();
    const capableIds = registry.pools
      .filter((pool) => pool.capability === "quote-model")
      .map((pool) => pool.id);

    assert.deepEqual(
      QUOTE_MODEL_CAPABLE_FAME_POOL_IDS,
      poolIdsForActivationStatus("reserve-compact-quote-active"),
    );
    assert.deepEqual(capableIds, QUOTE_MODEL_CAPABLE_FAME_POOL_IDS);
    assert.deepEqual(capableIds, [
      "aerodrome-v2-usdc-weth",
      "scale-equalizer-frxusd-fame",
      "scale-equalizer-scale-fame",
      "scale-equalizer-usdc-scale",
      "scale-equalizer-weth-fame",
      "uniswap-v2-fame-direct",
      "uniswap-v2-usdc-weth",
    ]);
    assert.ok(
      registry.pools
        .filter((pool) => pool.capability === "quote-model")
        .every(
          (pool) =>
            pool.stateSurface === "constant-product-reserves" &&
            pool.activationStatus === "reserve-compact-quote-active" &&
            pool.replaySurface === null &&
            pool.quoteModel === "constant-product-reserves" &&
            pool.unsupportedReason === null,
        ),
    );
  });

  it("keeps unsupported pools visible while making reviewed CL market-state eligible", () => {
    const registry = famePoolStateRegistry();
    const trackedOnly = registry.pools.filter(
      (pool) => pool.capability === "tracked-only",
    );
    const candidate = registry.pools.find(
      (pool) => pool.id === FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
    );
    const v4Dependency = registry.pools.find(
      (pool) => pool.id === FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
    );
    const marketState = registry.pools.filter(
      (pool) => pool.capability === "market-state",
    );

    assert.ok(
      trackedOnly.some(
        (pool) =>
          pool.id === "scale-equalizer-usdc-frxusd" &&
          pool.unsupportedReason === "stable-pool",
      ),
    );
    assert.ok(
      trackedOnly.some(
        (pool) =>
          pool.id === "native-wrap-weth" &&
          pool.unsupportedReason === "native-wrap",
      ),
    );
    assert.ok(
      marketState.some(
        (pool) =>
          pool.venue === "aerodrome-slipstream" &&
          pool.stateSurface === "cl-head-snapshot" &&
          pool.tickSpacing !== null,
      ),
    );
    assert.ok(
      marketState.some(
        (pool) =>
          pool.venue === "uniswap-v3" &&
          pool.stateSurface === "cl-head-snapshot" &&
          pool.tickSpacing !== null,
      ),
    );
    assert.ok(
      marketState.some(
        (pool) =>
          pool.venue === "uniswap-v4" &&
          pool.stateSurface === "cl-head-snapshot" &&
          pool.poolKey !== null &&
          pool.stateViewAddress !== null,
      ),
    );
    assert.equal(candidate?.capability, "market-state");
    assert.equal(candidate?.activationStatus, "cl-compact-quote-active");
    assert.equal(
      candidate?.factoryAddress,
      "0x5e7bb104d84c7cb9b682aac2f3d509f5f406809a",
    );
    assert.equal(candidate?.stateSurface, "cl-head-snapshot");
    assert.equal(candidate?.replaySurface, "cl-replay-v1");
    assert.equal(v4Dependency?.capability, "market-state");
    assert.equal(v4Dependency?.activationStatus, "unsupported");
    assert.equal(v4Dependency?.replaySurface, null);
  });

  it("marks activation-approved Slipstream v1 pools as CL replay-capable", () => {
    const registry = famePoolStateRegistry();
    const candidate = registry.pools.find(
      (pool) => pool.id === FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
    );
    const replayIds = registry.pools
      .filter((pool) => pool.replaySurface === "cl-replay-v1")
      .map((pool) => pool.id);
    const replayPool = registry.pools.find(
      (pool) => pool.id === "slipstream-usdc-weth-100",
    );

    assert.deepEqual(
      CL_REPLAY_CAPABLE_FAME_POOL_IDS,
      poolIdsForActivationStatus("cl-compact-quote-active"),
    );
    assert.deepEqual(replayIds, CL_REPLAY_CAPABLE_FAME_POOL_IDS);
    assert.equal(replayPool?.capability, "market-state");
    assert.equal(replayPool?.stateSurface, "cl-head-snapshot");
    assert.equal(replayPool?.replaySurface, "cl-replay-v1");
    assert.equal(replayPool?.activationStatus, "cl-compact-quote-active");
    assert.equal(replayPool?.venue, "aerodrome-slipstream");
    assert.equal(replayPool?.tickSpacing, 100);
    assert.equal(candidate?.replaySurface, "cl-replay-v1");
    assert.equal(candidate?.activationStatus, "cl-compact-quote-active");
    assert.ok(CL_REPLAY_CAPABLE_FAME_POOL_IDS.includes(candidate?.id ?? ""));
  });

  it("fails closed when registry rows are not reviewed as producer-present", () => {
    assert.equal(
      activationStatusForRegistryPoolId("native-wrap-weth"),
      "tracked-only",
    );
    assert.throws(
      () => activationStatusForRegistryPoolId("slipstream-spx-weth"),
      /reviewed producer presence is producer-unrepresented/,
    );
    assert.throws(
      () => activationStatusForRegistryPoolId("not-reviewed"),
      /missing reviewed activation/,
    );
  });

  it("derives compact quote-capable pools from reserve quote models plus CL replay", () => {
    assert.deepEqual(COMPACT_QUOTE_CAPABLE_FAME_POOL_IDS, [
      ...QUOTE_MODEL_CAPABLE_FAME_POOL_IDS,
      ...CL_REPLAY_CAPABLE_FAME_POOL_IDS,
    ]);
    assert.equal(famePoolSupportsCompactQuote("uniswap-v2-usdc-weth"), true);
    assert.equal(
      famePoolSupportsCompactQuote("slipstream-usdc-weth-100"),
      true,
    );
    assert.equal(famePoolSupportsCompactQuote("native-wrap-weth"), false);
    assert.equal(
      famePoolSupportsCompactQuote(FAME_SELECTED_CL_ACTIVATION_CANDIDATE),
      true,
    );
    assert.equal(
      famePoolSupportsCompactQuote(FAME_SELECTED_LIVE_ROUTE_DEPENDENCY),
      false,
    );
  });

  it("omits direct SPX/FAME and cbBTC/FAME until authoritative metadata exists", () => {
    const registry = famePoolStateRegistry();

    assert.equal(
      registry.pools.some((pool) => /spx-fame|fame-spx/i.test(pool.id)),
      false,
    );
    assert.equal(
      registry.pools.some((pool) => /cbbtc-fame|fame-cbbtc/i.test(pool.id)),
      false,
    );
  });

  it("records artifact provenance for society-bots drift diagnostics", () => {
    const registry = famePoolStateRegistry();

    assert.equal(
      registry.source.schemaVersion,
      FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
    );
    assert.equal(
      registry.source.pinnedBaseBlock,
      FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
    );
    assert.equal(
      registry.source.poolsJsonHash,
      FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
    );
    assert.equal(
      registry.source.solverRoutesJsonHash,
      FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
    );
    assert.equal(
      registry.source.activationLedgerHash,
      FAME_POOL_ACTIVATION_LEDGER_HASH,
    );
  });

  it("pins the activation ledger hash to reviewed activation content", () => {
    assert.equal(FAME_POOL_ACTIVATION_LEDGER_HASH, activationLedgerDigest());
  });

  it("derives the cross-repo source registry id from authoritative artifact hashes", () => {
    assert.equal(
      famePoolStateRegistrySourceId(),
      `pool-state-registry-v4:${FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash}:${FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash}:${FAME_POOL_ACTIVATION_LEDGER_HASH}`,
    );
  });
});

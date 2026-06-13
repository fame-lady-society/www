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
  FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE,
  FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
  UNISWAP_V4_DYNAMIC_FEE_FLAG,
  V4_ZORA_ETH_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
  V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
  classifyFameV4ZoraPoolConfig,
  classifyFameV4ZoraQuoteLane,
  famePoolSupportsCompactQuote,
  famePoolSupportsV4ZoraQuoteLane,
  famePoolStateRegistry,
  famePoolStateRegistrySourceId,
  QUOTE_MODEL_CAPABLE_FAME_POOL_IDS,
} from "./poolStateRegistry";
import { famePoolById } from "./poolUniverse";
import type { FameUniswapV4PoolConfig } from "../router/types";

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
      "scale-equalizer-frxusd-fame",
      "scale-equalizer-scale-fame",
      "scale-equalizer-weth-fame",
      "uniswap-v2-fame-direct",
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

  it("keeps non-direct FAME pools visible without indexing them", () => {
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
          pool.unsupportedReason === "non-direct-fame-pool",
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
      marketState.every((pool) => pool.id === FAME_SELECTED_CL_ACTIVATION_CANDIDATE),
    );
    assert.equal(candidate?.capability, "market-state");
    assert.equal(candidate?.activationStatus, "cl-compact-quote-active");
    assert.equal(
      candidate?.factoryAddress,
      "0x5e7bb104d84c7cb9b682aac2f3d509f5f406809a",
    );
    assert.equal(candidate?.stateSurface, "cl-head-snapshot");
    assert.equal(candidate?.replaySurface, "cl-replay-v1");
    assert.equal(v4Dependency?.capability, "tracked-only");
    assert.equal(v4Dependency?.activationStatus, "tracked-only");
    assert.equal(v4Dependency?.stateSurface, null);
    assert.equal(v4Dependency?.replaySurface, null);
    assert.equal(v4Dependency?.unsupportedReason, "non-direct-fame-pool");
  });

  it("emits schema-v4 row fields required by the pool-state producer parser", () => {
    const registry = famePoolStateRegistry();
    const pool = (poolId: string) => {
      const entry = registry.pools.find((candidate) => candidate.id === poolId);
      assert.ok(entry, `missing ${poolId}`);
      return entry;
    };

    assert.ok(
      registry.pools.every(
        (entry) =>
          "factoryAddress" in entry && "activationStatus" in entry,
      ),
    );
    assert.equal(
      pool("aerodrome-v2-usdc-weth").factoryAddress,
      "0x420dd381b31aef6683db6b902084cb0ffece40da",
    );
    assert.equal(
      pool("slipstream-usdc-weth-100").factoryAddress,
      "0x5e7bb104d84c7cb9b682aac2f3d509f5f406809a",
    );
    assert.equal(
      pool(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID).factoryAddress,
      null,
    );
    assert.equal(
      pool("uniswap-v2-usdc-weth").activationStatus,
      "tracked-only",
    );
    assert.equal(
      pool("slipstream-usdc-weth-100").activationStatus,
      "tracked-only",
    );
    assert.equal(
      pool(FAME_SELECTED_CL_ACTIVATION_CANDIDATE).activationStatus,
      "cl-compact-quote-active",
    );
    assert.equal(
      pool("uniswap-v3-zora-usdc").activationStatus,
      "tracked-only",
    );
    assert.equal(
      pool(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID).activationStatus,
      "tracked-only",
    );
    assert.equal(pool("native-wrap-weth").activationStatus, "tracked-only");
  });

  it("marks activation-approved Slipstream v1 pools as CL replay-capable", () => {
    const registry = famePoolStateRegistry();
    const candidate = registry.pools.find(
      (pool) => pool.id === FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
    );
    const replayIds = registry.pools
      .filter((pool) => pool.replaySurface === "cl-replay-v1")
      .map((pool) => pool.id);

    assert.deepEqual(
      CL_REPLAY_CAPABLE_FAME_POOL_IDS,
      poolIdsForActivationStatus("cl-compact-quote-active"),
    );
    assert.deepEqual(replayIds, CL_REPLAY_CAPABLE_FAME_POOL_IDS);
    assert.deepEqual(replayIds, [FAME_SELECTED_CL_ACTIVATION_CANDIDATE]);
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

  it("derives compact quote-capable pools from reserve, CL replay, and reviewed V4 Zora gates", () => {
    const activeV4QuoteLane = {
      status: "active",
      sourceRegistryId: famePoolStateRegistrySourceId(),
      parityStatus: "passed",
      routeSimulationStatus: "passed",
      evidenceId: "unit-v4-zora-activation",
    } as const;

    assert.deepEqual(COMPACT_QUOTE_CAPABLE_FAME_POOL_IDS, [
      ...QUOTE_MODEL_CAPABLE_FAME_POOL_IDS,
      ...CL_REPLAY_CAPABLE_FAME_POOL_IDS,
    ]);
    assert.equal(famePoolSupportsCompactQuote("uniswap-v2-usdc-weth"), false);
    assert.equal(
      famePoolSupportsCompactQuote("slipstream-usdc-weth-100"),
      false,
    );
    assert.equal(
      famePoolSupportsCompactQuote(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID),
      false,
    );
    assert.equal(
      famePoolSupportsCompactQuote(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID, {
        v4ZoraQuoteLaneActivation: activeV4QuoteLane,
      }),
      false,
    );
    assert.equal(
      famePoolSupportsCompactQuote(
        V4_ZORA_ETH_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
      ),
      false,
    );
    assert.equal(
      famePoolSupportsCompactQuote(
        V4_ZORA_ETH_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
        { v4ZoraQuoteLaneActivation: activeV4QuoteLane },
      ),
      false,
    );
    assert.equal(famePoolSupportsCompactQuote("uniswap-v4-usdc-eth"), false);
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

  it("surfaces reviewed V4 Zora quote lane candidates with lane-specific provenance", () => {
    assert.deepEqual(
      classifyFameV4ZoraQuoteLane(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID),
      {
        status: "target-blocked",
        poolId: V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
        reason: "missing-provenance",
        hookPermissions: {
          beforeInitialize: false,
          afterInitialize: true,
          beforeAddLiquidity: false,
          afterAddLiquidity: false,
          beforeRemoveLiquidity: false,
          afterRemoveLiquidity: false,
          beforeSwap: false,
          afterSwap: true,
          beforeDonate: false,
          afterDonate: false,
          beforeSwapReturnDelta: false,
          afterSwapReturnDelta: false,
          afterAddLiquidityReturnDelta: false,
          afterRemoveLiquidityReturnDelta: false,
        },
      },
    );
    assert.equal(
      famePoolSupportsV4ZoraQuoteLane(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID),
      false,
    );
    assert.equal(
      famePoolSupportsV4ZoraQuoteLane(
        V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
        { provenanceVerified: true },
      ),
      true,
    );
    const zoraEth = classifyFameV4ZoraQuoteLane(
      V4_ZORA_ETH_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
    );
    assert.equal(zoraEth.status, "target-eligible");
    if (zoraEth.status !== "target-eligible") {
      throw new Error("Expected reviewed ZORA/ETH to be target eligible.");
    }
    assert.equal(
      famePoolSupportsV4ZoraQuoteLane(
        V4_ZORA_ETH_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
      ),
      true,
    );
    assert.equal(zoraEth.manifest.provenanceRequired, false);
    assert.deepEqual(
      zoraEth.reviewedPoolShape,
      FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE,
    );
    assert.deepEqual(zoraEth.hookPermissions, {
      beforeInitialize: false,
      afterInitialize: false,
      beforeAddLiquidity: false,
      afterAddLiquidity: false,
      beforeRemoveLiquidity: false,
      afterRemoveLiquidity: false,
      beforeSwap: false,
      afterSwap: false,
      beforeDonate: false,
      afterDonate: false,
      beforeSwapReturnDelta: false,
      afterSwapReturnDelta: false,
      afterAddLiquidityReturnDelta: false,
      afterRemoveLiquidityReturnDelta: false,
    });
    assert.deepEqual(
      classifyFameV4ZoraQuoteLane("uniswap-v4-usdc-eth", {
        provenanceVerified: true,
      }),
      {
        status: "non-target-v4-unsupported",
        poolId: "uniswap-v4-usdc-eth",
        reason: "non-target-v4-pool",
      },
    );
  });

  it("rejects V4 Zora candidate shape drift before route eligibility", () => {
    const pool = famePoolById(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID);
    const zoraEthPool = famePoolById(
      V4_ZORA_ETH_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
    );
    assert.equal(pool?.venue, "uniswap-v4");
    assert.equal(zoraEthPool?.venue, "uniswap-v4");
    const target = pool as FameUniswapV4PoolConfig;
    const zoraEthTarget = zoraEthPool as FameUniswapV4PoolConfig;

    assert.deepEqual(
      classifyFameV4ZoraPoolConfig(
        {
          ...target,
          fee: UNISWAP_V4_DYNAMIC_FEE_FLAG,
        },
        { provenanceVerified: true },
      ),
      {
        status: "target-blocked",
        poolId: V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
        reason: "dynamic-fee",
      },
    );
    assert.deepEqual(
      classifyFameV4ZoraPoolConfig(
        {
          ...target,
          hookData: "0x1234",
        },
        { provenanceVerified: true },
      ),
      {
        status: "target-blocked",
        poolId: V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
        reason: "hook-data-mismatch",
      },
    );
    assert.deepEqual(
      classifyFameV4ZoraPoolConfig(
        {
          ...target,
          hooks: "0x00000000000000000000000000000000000010c0",
        },
        { provenanceVerified: true },
      ),
      {
        status: "target-blocked",
        poolId: V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
        reason: "unsafe-hook-permissions",
        hookPermissions: {
          beforeInitialize: false,
          afterInitialize: true,
          beforeAddLiquidity: false,
          afterAddLiquidity: false,
          beforeRemoveLiquidity: false,
          afterRemoveLiquidity: false,
          beforeSwap: true,
          afterSwap: true,
          beforeDonate: false,
          afterDonate: false,
          beforeSwapReturnDelta: false,
          afterSwapReturnDelta: false,
          afterAddLiquidityReturnDelta: false,
          afterRemoveLiquidityReturnDelta: false,
        },
        unsafeHookPermissions: ["beforeSwap"],
      },
    );
    assert.equal(FAME_V4_ZORA_REVIEWED_POOL_SHAPE.hookData, "0x");
    assert.equal(
      classifyFameV4ZoraPoolConfig({
        ...zoraEthTarget,
        hooks: "0x00000000000000000000000000000000000010c0",
      }).status,
      "target-blocked",
    );
    assert.deepEqual(
      classifyFameV4ZoraPoolConfig({
        ...zoraEthTarget,
        hookData: "0x1234",
      }),
      {
        status: "target-blocked",
        poolId: V4_ZORA_ETH_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
        reason: "hook-data-mismatch",
      },
    );
    assert.equal(FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.hookData, "0x");
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

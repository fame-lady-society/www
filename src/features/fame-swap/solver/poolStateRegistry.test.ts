import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import {
  CL_REPLAY_CAPABLE_FAME_POOL_IDS,
  COMPACT_QUOTE_CAPABLE_FAME_POOL_IDS,
  FAME_POOL_STATE_ACTIVATION_LEDGER_HASH,
  FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
  UNISWAP_V4_DYNAMIC_FEE_FLAG,
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

describe("FAME pool-state registry", () => {
  it("derives quote-model-capable pools from the reviewed route universe", () => {
    const registry = famePoolStateRegistry();
    const capableIds = registry.pools
      .filter((pool) => pool.capability === "quote-model")
      .map((pool) => pool.id);

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
      "reserve-compact-quote-active",
    );
    assert.equal(
      pool("slipstream-usdc-weth-100").activationStatus,
      "cl-compact-quote-active",
    );
    assert.equal(
      pool("uniswap-v3-zora-usdc").activationStatus,
      "cl-head-only",
    );
    assert.equal(
      pool(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID).activationStatus,
      "unsupported",
    );
    assert.equal(
      pool("native-wrap-weth").activationStatus,
      "tracked-only",
    );
  });

  it("marks only slipstream-usdc-weth-100 as CL replay-capable", () => {
    const registry = famePoolStateRegistry();
    const replayIds = registry.pools
      .filter((pool) => pool.replaySurface === "cl-replay-v1")
      .map((pool) => pool.id);
    const replayPool = registry.pools.find(
      (pool) => pool.id === "slipstream-usdc-weth-100",
    );

    assert.deepEqual(replayIds, CL_REPLAY_CAPABLE_FAME_POOL_IDS);
    assert.equal(replayPool?.capability, "market-state");
    assert.equal(replayPool?.stateSurface, "cl-head-snapshot");
    assert.equal(replayPool?.replaySurface, "cl-replay-v1");
    assert.equal(replayPool?.venue, "aerodrome-slipstream");
    assert.equal(replayPool?.tickSpacing, 100);
  });

  it("derives compact quote-capable pools from reserve, CL replay, and reviewed V4 Zora gates", () => {
    assert.deepEqual(COMPACT_QUOTE_CAPABLE_FAME_POOL_IDS, [
      ...QUOTE_MODEL_CAPABLE_FAME_POOL_IDS,
      ...CL_REPLAY_CAPABLE_FAME_POOL_IDS,
    ]);
    assert.equal(famePoolSupportsCompactQuote("uniswap-v2-usdc-weth"), true);
    assert.equal(
      famePoolSupportsCompactQuote("slipstream-usdc-weth-100"),
      true,
    );
    assert.equal(
      famePoolSupportsCompactQuote(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID),
      false,
    );
    assert.equal(
      famePoolSupportsCompactQuote(V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID, {
        v4ZoraQuoteLaneActivation: {
          status: "active",
          sourceRegistryId: famePoolStateRegistrySourceId(),
          parityStatus: "passed",
          routeSimulationStatus: "passed",
          evidenceId: "unit-v4-zora-activation",
        },
      }),
      true,
    );
    assert.equal(famePoolSupportsCompactQuote("uniswap-v4-usdc-eth"), false);
    assert.equal(famePoolSupportsCompactQuote("native-wrap-weth"), false);
  });

  it("surfaces BASEDFLICK/ZORA as the only provenance-gated V4 Zora quote lane candidate", () => {
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
    assert.equal(pool?.venue, "uniswap-v4");
    const target = pool as FameUniswapV4PoolConfig;

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
      FAME_POOL_STATE_ACTIVATION_LEDGER_HASH,
    );
  });

  it("derives the cross-repo source registry id from authoritative artifact hashes", () => {
    assert.equal(
      famePoolStateRegistrySourceId(),
      `pool-state-registry-v4:${FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash}:${FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash}:${FAME_POOL_STATE_ACTIVATION_LEDGER_HASH}`,
    );
  });
});

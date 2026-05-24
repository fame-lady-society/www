import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import {
  CL_REPLAY_CAPABLE_FAME_POOL_IDS,
  COMPACT_QUOTE_CAPABLE_FAME_POOL_IDS,
  famePoolSupportsCompactQuote,
  famePoolStateRegistry,
  famePoolStateRegistrySourceId,
  QUOTE_MODEL_CAPABLE_FAME_POOL_IDS,
} from "./poolStateRegistry";

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
  });

  it("derives the cross-repo source registry id from authoritative artifact hashes", () => {
    assert.equal(
      famePoolStateRegistrySourceId(),
      `pool-state-registry-v3:${FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash}:${FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash}`,
    );
  });
});

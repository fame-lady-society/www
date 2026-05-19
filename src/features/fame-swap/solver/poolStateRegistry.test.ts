import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import {
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
  });

  it("keeps tracked-only pools visible instead of dropping unsupported math", () => {
    const registry = famePoolStateRegistry();
    const trackedOnly = registry.pools.filter(
      (pool) => pool.capability === "tracked-only",
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
      trackedOnly.some((pool) => pool.venue === "aerodrome-slipstream"),
    );
    assert.ok(trackedOnly.some((pool) => pool.venue === "uniswap-v3"));
    assert.ok(trackedOnly.some((pool) => pool.venue === "uniswap-v4"));
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
      `${FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash}:${FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash}`,
    );
  });
});

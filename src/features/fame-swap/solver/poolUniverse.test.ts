import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { keccak256, toHex } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { NATIVE_ETH, FAME, USDC, WETH } from "../tokens";
import { solverRoutesFile } from "./artifacts";
import { artifactIntegrityIssue } from "./integrity";
import {
  feeDescriptorForPool,
  famePoolById,
  famePoolEdgesForPair,
  famePoolUniverse,
  isNativeEthAddress,
} from "./poolUniverse";

describe("FAME pool universe", () => {
  it("matches the pinned pool artifact manifest", () => {
    const bytes = readFileSync(
      "src/features/fame-swap/artifacts/base-v1-pools.json",
    );

    assert.equal(
      keccak256(toHex(bytes)),
      FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
    );
    assert.equal(artifactIntegrityIssue(), null);
  });

  it("contains every pool referenced by copied route artifacts", () => {
    for (const route of solverRoutesFile.routes) {
      for (const poolId of route.poolIds) {
        assert.ok(famePoolById(poolId), `${route.id} references ${poolId}`);
      }
    }
  });

  it("has reviewed fee metadata for every pinned route pool", () => {
    for (const route of solverRoutesFile.routes) {
      for (const poolId of route.poolIds) {
        const pool = famePoolById(poolId);
        assert.ok(pool, `${route.id} references ${poolId}`);

        const fee = feeDescriptorForPool(pool);
        assert.equal(
          fee.status,
          "available",
          `${route.id} uses ${poolId} without reviewed fee metadata`,
        );
      }
    }
  });

  it("builds directed edges for known launch route families", () => {
    assert.ok(famePoolEdgesForPair(WETH, FAME).length >= 2);
    assert.ok(famePoolEdgesForPair(USDC, FAME).length === 0);
    assert.ok(famePoolEdgesForPair(USDC, WETH).length === 0);

    const wethToFame = famePoolEdgesForPair(WETH, FAME).map(
      (edge) => edge.poolId,
    );
    assert.ok(wethToFame.includes("scale-equalizer-weth-fame"));
    assert.ok(wethToFame.includes("uniswap-v2-fame-direct"));
  });

  it("keeps native ETH distinct from WETH in v4 edges", () => {
    const ethToZora = famePoolEdgesForPair(NATIVE_ETH, USDC);
    assert.equal(ethToZora.length, 0);

    const universe = famePoolUniverse();
    const nativeEdges = universe.edges.filter((edge) =>
      isNativeEthAddress(edge.tokenIn),
    );

    assert.ok(
      nativeEdges.some((edge) => edge.poolId === "uniswap-v4-zora-eth"),
    );
    assert.ok(
      !nativeEdges.some(
        (edge) => edge.tokenIn.toLowerCase() === WETH.toLowerCase(),
      ),
    );
  });

  it("exposes fee descriptors for every known pool edge", () => {
    for (const edge of famePoolUniverse().edges) {
      assert.equal(edge.fee.status, "available", edge.poolId);
      if (edge.fee.status === "available") {
        assert.ok(edge.fee.feeBps > 0, edge.poolId);
        assert.match(edge.fee.label, /%$/);
      }
    }
  });
});

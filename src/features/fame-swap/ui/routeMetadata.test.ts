import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH } from "../tokens";
import { routeCandidatesForPair } from "../solver/graph/candidates";
import { solverRoutesFile } from "../solver/artifacts";
import { poolDisplayMetadata } from "./poolDisplay";
import { routeTokenMetadataForAddress } from "./routeMetadata";

function routeTokens(): readonly Address[] {
  const tokens = new Set<Address>();

  for (const route of solverRoutesFile.routes) {
    tokens.add(route.route.tokenIn);
    tokens.add(route.route.tokenOut);

    for (const leg of route.route.legs) {
      tokens.add(leg.tokenIn);
      tokens.add(leg.tokenOut);
    }
  }

  return [...tokens].sort();
}

function launchCandidatePairs(): readonly (readonly [Address, Address])[] {
  return [
    [FAME, USDC],
    [USDC, FAME],
    [FAME, WETH],
    [WETH, FAME],
    [FAME, NATIVE_ETH],
    [NATIVE_ETH, FAME],
  ];
}

function launchCandidateTokens(): readonly Address[] {
  const tokens = new Set<Address>();

  for (const [tokenIn, tokenOut] of launchCandidatePairs()) {
    for (const candidate of routeCandidatesForPair(tokenIn, tokenOut)
      .candidates) {
      for (const leg of candidate.legs) {
        tokens.add(leg.edge.tokenIn);
        tokens.add(leg.edge.tokenOut);
      }
    }
  }

  return [...tokens].sort();
}

describe("FAME swap route metadata", () => {
  it("has reviewed token display metadata for every pinned route token", () => {
    for (const address of routeTokens()) {
      const metadata = routeTokenMetadataForAddress(address);

      assert.equal(
        metadata.known,
        true,
        `${address} is missing route token metadata`,
      );
      assert.ok(metadata.symbol, `${address} is missing a token symbol`);
      assert.ok(metadata.iconLabel, `${address} is missing a token badge`);
      assert.match(
        metadata.iconBackground,
        /^#[0-9a-f]{6}$/i,
        `${metadata.symbol} is missing a stable token badge color`,
      );
      assert.equal(
        metadata.imageStatus === "local" || metadata.imageStatus === "fallback",
        true,
        `${metadata.symbol} must resolve to a local image or badge fallback`,
      );
      assert.ok(
        metadata.imageSrc || metadata.iconLabel,
        `${metadata.symbol} is missing an image or first-class badge fallback`,
      );
      assert.doesNotMatch(metadata.symbol, /^0x/i);
    }
  });

  it("has reviewed token display metadata for every launch candidate token", () => {
    for (const address of launchCandidateTokens()) {
      const metadata = routeTokenMetadataForAddress(address);

      assert.equal(
        metadata.known,
        true,
        `${address} is missing route token metadata`,
      );
      assert.ok(metadata.symbol, `${address} is missing a token symbol`);
      assert.equal(
        metadata.imageStatus === "local" || metadata.imageStatus === "fallback",
        true,
        `${metadata.symbol} must resolve to a local image or badge fallback`,
      );
      assert.doesNotMatch(metadata.symbol, /^0x/i);
    }
  });

  it("has reviewed pool display metadata for every pinned route pool", () => {
    for (const route of solverRoutesFile.routes) {
      route.route.legs.forEach((leg, index) => {
        const poolId = route.poolIds[index];
        const metadata = poolDisplayMetadata(poolId, leg.venue);

        assert.equal(
          metadata.reviewed,
          true,
          `${route.id} uses ${poolId ?? "missing pool"} without display metadata`,
        );
        assert.ok(metadata.poolTypeLabel, `${poolId} is missing pool type`);
        assert.match(metadata.pairLabel, /\//, `${poolId} is missing pair`);
        assert.doesNotMatch(metadata.displayName, /0x/i);
        assert.doesNotMatch(metadata.pairLabel, /0x/i);
      });
    }
  });

  it("has reviewed pool display metadata for every launch candidate pool", () => {
    const checked = new Set<string>();

    for (const [tokenIn, tokenOut] of launchCandidatePairs()) {
      for (const candidate of routeCandidatesForPair(tokenIn, tokenOut)
        .candidates) {
        for (const leg of candidate.legs) {
          const key = `${leg.edge.poolId}:${leg.edge.venue}`;
          if (checked.has(key)) continue;
          checked.add(key);

          const metadata = poolDisplayMetadata(leg.edge.poolId, leg.edge.venue);
          assert.equal(
            metadata.reviewed,
            true,
            `${candidate.id} uses ${leg.edge.poolId} without display metadata`,
          );
          assert.ok(
            metadata.poolTypeLabel,
            `${leg.edge.poolId} is missing pool type`,
          );
          assert.match(
            metadata.pairLabel,
            /\//,
            `${leg.edge.poolId} is missing pair`,
          );
          assert.doesNotMatch(metadata.displayName, /0x/i);
          assert.doesNotMatch(metadata.pairLabel, /0x/i);
        }
      }
    }
  });
});

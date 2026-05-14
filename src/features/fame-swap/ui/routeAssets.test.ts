import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH } from "../tokens";
import { routeCandidatesForPair } from "../solver/graph/candidates";
import { solverRoutesFile } from "../solver/artifacts";
import {
  fameSwapRouteAssetManifest,
  routeAssetForAddress,
  routeTokenVisualAssetForAddress,
} from "./routeAssets";
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

describe("FAME swap route assets", () => {
  it("documents every pinned route token with a local image or badge fallback", () => {
    for (const address of routeTokens()) {
      const metadata = routeTokenMetadataForAddress(address);
      const asset = routeTokenVisualAssetForAddress(address);

      assert.ok(metadata.symbol, `${address} is missing a token symbol`);
      assert.equal(
        asset.imageStatus === "local" || asset.imageStatus === "fallback",
        true,
        `${metadata.symbol} must resolve to a local image or fallback`,
      );
      assert.ok(
        asset.imageSrc || metadata.iconLabel,
        `${metadata.symbol} needs an image or badge fallback`,
      );
    }
  });

  it("documents every launch candidate token with a manifest entry", () => {
    for (const address of launchCandidateTokens()) {
      const asset = routeAssetForAddress(address);
      const metadata = routeTokenMetadataForAddress(address);

      assert.ok(asset, `${metadata.symbol} is missing route asset provenance`);
      assert.ok(asset.provenanceNote);
    }
  });

  it("keeps runtime image paths local to the FAME swap asset directory", () => {
    for (const asset of fameSwapRouteAssetManifest().tokens) {
      if (!asset.localImagePath) continue;

      assert.match(asset.localImagePath, /^\/images\/fame-swap\/tokens\//);
      assert.doesNotMatch(asset.localImagePath, /^https?:\/\//);
      assert.notEqual(asset.fileType, "svg");
    }
  });

  it("records that the first pass did not perform online discovery", () => {
    const manifest = fameSwapRouteAssetManifest();

    assert.equal(manifest.onlineDiscoveryPerformed, false);
    assert.equal(manifest.runtimePolicy, "local-assets-or-badge-fallback");
    assert.ok(manifest.tokens.every((token) => token.status === "fallback"));
  });
});

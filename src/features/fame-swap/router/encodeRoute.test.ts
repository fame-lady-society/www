import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { parsedFameSwapArtifactFiles } from "../solver/artifactFiles";
import { FAME, NATIVE_ETH, USDC, WETH } from "../tokens";
import { encodeJsonFameRoute, hashJsonFameRoute } from "./encodeRoute";

const { solverRoutes, gapMatrix, parityVectors } =
  parsedFameSwapArtifactFiles();

describe("FAME router route encoding", () => {
  it("matches every checked-in parity vector", () => {
    for (const vector of parityVectors.vectors) {
      assert.equal(encodeJsonFameRoute(vector.route), vector.abiEncodedRoute);
      assert.equal(hashJsonFameRoute(vector.route), vector.routeHash);
    }
  });

  it("keeps copied artifact ids aligned with the manifest", () => {
    const manifestIds = new Set<string>(
      FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds,
    );

    assert.equal(solverRoutes.routes.length, manifestIds.size);

    for (const route of solverRoutes.routes) {
      assert.equal(
        manifestIds.has(route.id),
        true,
        `${route.id} is missing from the pinned manifest`,
      );
    }
  });

  it("has executable fork-tested rows for every launch direction", () => {
    const requiredPairs = [
      [FAME, USDC],
      [USDC, FAME],
      [FAME, WETH],
      [WETH, FAME],
      [FAME, NATIVE_ETH],
      [NATIVE_ETH, FAME],
    ] as const;

    for (const [tokenIn, tokenOut] of requiredPairs) {
      const row = gapMatrix.rows.find(
        (candidate) =>
          candidate.tokenIn.toLowerCase() === tokenIn.toLowerCase() &&
          candidate.tokenOut.toLowerCase() === tokenOut.toLowerCase(),
      );

      assert.ok(row, `missing gap matrix row for ${tokenIn}->${tokenOut}`);
      assert.equal(row.supported, true);
      assert.equal(row.executable, "executable");
      assert.equal(row.tsGenerated, true);
      assert.equal(row.forkTested, true);
      assert.equal(typeof row.routeArtifactId, "string");
    }
  });
});

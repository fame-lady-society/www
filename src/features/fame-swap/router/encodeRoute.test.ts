import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeAbiParameters } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { famePoolEdges } from "../solver/poolUniverse";
import { parsedFameSwapArtifactFiles } from "../solver/artifactFiles";
import { FAME, NATIVE_ETH, USDC, WETH } from "../tokens";
import { buildFameRouteLeg } from "./buildLegPayload";
import { encodeJsonFameRoute, hashJsonFameRoute } from "./encodeRoute";
import { aerodromeV2PayloadAbi } from "./payloads";

const { solverRoutes, gapMatrix, parityVectors } =
  parsedFameSwapArtifactFiles();
const routerAddress = "0x0000000000000000000000000000000000000009";
const deadline = 1_800_000_000n;

function assertSameAddress(actual: string | undefined, expected: string) {
  assert.equal(actual?.toLowerCase(), expected.toLowerCase());
}

const solidlyPayloadAbi = [
  {
    type: "tuple",
    components: [
      {
        name: "routes",
        type: "tuple[]",
        components: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "stable", type: "bool" },
        ],
      },
      { name: "deadline", type: "uint256" },
    ],
  },
] as const;

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

  it("encodes Aerodrome V2 with ordinal 7 and explicit factory routes", () => {
    const edge = famePoolEdges().find(
      (candidate) =>
        candidate.poolId === "aerodrome-v2-usdc-weth" &&
        candidate.tokenIn.toLowerCase() === USDC.toLowerCase(),
    );
    assert.ok(edge);
    assert.equal(edge.venue, "AerodromeV2");
    assert.equal(edge.venueOrdinal, 7);
    assert.equal(edge.target, "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43");
    if (edge.pool.venue !== "aerodrome-v2") {
      throw new Error("Expected Aerodrome V2 edge.");
    }

    const leg = buildFameRouteLeg({
      edge,
      amountMode: "Exact",
      amount: 123n,
      minAmountOut: 45n,
      routerAddress,
      deadline,
    });
    const [payload] = decodeAbiParameters(aerodromeV2PayloadAbi, leg.data);
    const [route] = payload.routes;

    assert.equal(leg.venue, "AerodromeV2");
    assert.equal(leg.venueOrdinal, 7);
    assertSameAddress(route?.from, USDC);
    assertSameAddress(route?.to, WETH);
    assert.equal(route?.stable, false);
    assertSameAddress(
      route?.factory,
      "0x420dd381b31aef6683db6b902084cb0ffece40da",
    );
    assert.equal(payload.deadline, deadline);
  });

  it("keeps Solidly payloads on the three-field route ABI", () => {
    const edge = famePoolEdges().find(
      (candidate) =>
        candidate.poolId === "scale-equalizer-weth-fame" &&
        candidate.tokenIn.toLowerCase() === WETH.toLowerCase(),
    );
    assert.ok(edge);
    assert.equal(edge.venue, "Solidly");
    assert.equal(edge.venueOrdinal, 0);

    const leg = buildFameRouteLeg({
      edge,
      amountMode: "Exact",
      amount: 123n,
      minAmountOut: 45n,
      routerAddress,
      deadline,
    });
    const [payload] = decodeAbiParameters(solidlyPayloadAbi, leg.data);
    const [route] = payload.routes;

    assert.equal(leg.venue, "Solidly");
    assert.equal(leg.venueOrdinal, 0);
    assertSameAddress(route?.from, WETH);
    assertSameAddress(route?.to, FAME);
    assert.equal(route?.stable, false);
    assert.equal("factory" in (route ?? {}), false);
    assert.equal(payload.deadline, deadline);
  });
});

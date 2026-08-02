import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeAbiParameters } from "viem";
import { routeArtifactById } from "./artifacts";
import { famePoolEdges } from "./poolUniverse";
import {
  materializeAllInFameRoute,
  materializeFameRoute,
} from "./materializeRoute";
import { FAME, NATIVE_ETH, USDC, WETH } from "../tokens";
import { buildFameRouteLeg } from "../router/buildLegPayload";
import {
  aerodromeV2PayloadAbi,
  universalRouterV3PayloadAbi,
  universalRouterV4PayloadAbi,
} from "../router/payloads";
import type { JsonFameRoute } from "../router/types";
import { famePoolEdgesForPair } from "./poolUniverse";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";
const deadline = 1_800_000_000n;
const uniswapV2PayloadAbi = [
  {
    type: "tuple",
    components: [
      { name: "path", type: "address[]" },
      { name: "deadline", type: "uint256" },
    ],
  },
] as const;

function assertSameAddress(actual: string | undefined, expected: string) {
  assert.equal(actual?.toLowerCase(), expected.toLowerCase());
}

describe("FAME route materialization", () => {
  it("patches top-level and embedded Universal Router recipients", () => {
    const artifact = routeArtifactById("solver-eth-zora-basedflick-fame");
    assert.ok(artifact);

    const materialized = materializeFameRoute(
      artifact.route,
      routerAddress,
      recipient,
      deadline,
    );

    assert.equal(materialized.route.recipient, recipient);
    assert.equal(materialized.route.deadline, deadline);
    assert.notEqual(materialized.routeHash, artifact.routeHash);

    const [firstPayload] = decodeAbiParameters(
      universalRouterV4PayloadAbi,
      materialized.route.legs[0].data,
    );
    assert.equal(firstPayload.recipient, routerAddress);
    assert.equal(firstPayload.deadline, deadline);
  });

  it("patches embedded V3 payload recipients for router execution", () => {
    const artifact = routeArtifactById("solver-fame-basedflick-zora-usdc");
    assert.ok(artifact);

    const materialized = materializeFameRoute(
      artifact.route,
      routerAddress,
      recipient,
      deadline,
    );
    const v3Leg = materialized.route.legs.find(
      (leg) => leg.venue === "UniswapV3",
    );

    assert.ok(v3Leg);
    const [payload] = decodeAbiParameters(
      universalRouterV3PayloadAbi,
      v3Leg.data,
    );
    assert.equal(payload.recipient, routerAddress);
    assert.equal(payload.deadline, deadline);
  });

  it("patches Aerodrome V2 payload deadlines without removing the explicit factory", () => {
    const edge = famePoolEdges().find(
      (candidate) =>
        candidate.poolId === "aerodrome-v2-usdc-weth" &&
        candidate.tokenIn.toLowerCase() === USDC.toLowerCase(),
    );
    assert.ok(edge);
    const leg = buildFameRouteLeg({
      edge,
      amountMode: "Exact",
      amount: 1_000_000n,
      minAmountOut: 500_000_000_000_000n,
      routerAddress,
      deadline: 1n,
    });
    const route = {
      version: 1,
      tokenIn: USDC,
      tokenOut: WETH,
      amountIn: "1000000",
      minAmountOutAfterFee: "500000000000000",
      recipient,
      deadline: "1",
      legs: [
        {
          ...leg,
          amount: leg.amount.toString(),
          minAmountOut: leg.minAmountOut.toString(),
        },
      ],
    } satisfies JsonFameRoute;

    const materialized = materializeFameRoute(
      route,
      routerAddress,
      recipient,
      deadline,
    );
    const materializedLeg = materialized.route.legs[0];
    assert.ok(materializedLeg);
    const [payload] = decodeAbiParameters(
      aerodromeV2PayloadAbi,
      materializedLeg.data,
    );

    assert.equal(payload.deadline, deadline);
    assertSameAddress(
      payload.routes[0]?.factory,
      "0x420dd381b31aef6683db6b902084cb0ffece40da",
    );
  });

  it("removes arbitrary fixture scaling entirely", () => {
    const artifact = routeArtifactById("solver-fame-basedflick-zora-usdc");
    assert.ok(artifact);
    const fixtureAmountIn = BigInt(artifact.route.amountIn);
    const requestedAmountIn = fixtureAmountIn + 12_345n;

    assert.throws(
      () =>
        materializeFameRoute(
          artifact.route,
          routerAddress,
          recipient,
          deadline,
          {
            amountIn: requestedAmountIn,
            minAmountOutAfterFee: 1n,
            slippageBps: 100,
          },
        ),
      /fixture scaling has been removed/i,
    );
  });

  it("materializes redemption with exactly the last FAME consumer as All and preserves downstream unwrap", () => {
    const fameEdges = famePoolEdgesForPair(FAME, WETH);
    const unwrapEdge = famePoolEdgesForPair(WETH, NATIVE_ETH)[0];
    assert.equal(fameEdges.length, 2);
    assert.ok(unwrapEdge);
    const first = buildFameRouteLeg({
      edge: fameEdges[0]!,
      amountMode: "Exact",
      amount: 4_000n,
      minAmountOut: 40n,
      routerAddress,
      deadline: 1n,
    });
    const finalFame = buildFameRouteLeg({
      edge: fameEdges[1]!,
      amountMode: "Exact",
      amount: 6_000n,
      minAmountOut: 60n,
      routerAddress,
      deadline: 1n,
    });
    const unwrap = buildFameRouteLeg({
      edge: unwrapEdge,
      amountMode: "All",
      amount: 0n,
      minAmountOut: 0n,
      routerAddress,
      deadline: 1n,
    });

    const materialized = materializeAllInFameRoute(
      {
        version: 1,
        tokenIn: FAME,
        tokenOut: NATIVE_ETH,
        amountIn: 10_000n,
        minAmountOutAfterFee: 90n,
        recipient,
        deadline: 1n,
        legs: [first, finalFame, unwrap],
      },
      routerAddress,
      recipient,
      deadline,
    );

    assert.deepEqual(
      materialized.route.legs.map((leg) => [
        leg.tokenIn,
        leg.amountMode,
        leg.amount,
      ]),
      [
        [FAME, "Exact", 4_000n],
        [FAME, "All", 0n],
        [WETH, "All", 0n],
      ],
    );
    assert.equal(
      materialized.route.legs.filter(
        (leg) => leg.tokenIn === FAME && leg.amountMode === "All",
      ).length,
      1,
    );
    assert.equal(materialized.route.legs[2]?.tokenOut, NATIVE_ETH);
    assert.notEqual(materialized.routeHash, `0x${"0".repeat(64)}`);
  });

  it("rejects routes without a FAME input or with a non-FAME header", () => {
    const artifact = routeArtifactById("solver-eth-zora-basedflick-fame");
    assert.ok(artifact);
    const route = materializeFameRoute(
      artifact.route,
      routerAddress,
      recipient,
      deadline,
    ).route;

    assert.throws(
      () =>
        materializeAllInFameRoute(route, routerAddress, recipient, deadline),
      /FAME input/u,
    );

    assert.throws(
      () =>
        materializeAllInFameRoute(
          { ...route, tokenIn: FAME },
          routerAddress,
          recipient,
          deadline,
        ),
      /no FAME input leg/u,
    );
  });

  it("rejects an earlier all-in FAME leg that would destroy a quoted split", () => {
    const fameEdges = famePoolEdgesForPair(FAME, WETH);
    assert.equal(fameEdges.length, 2);
    const earlierAll = buildFameRouteLeg({
      edge: fameEdges[0]!,
      amountMode: "All",
      amount: 0n,
      minAmountOut: 40n,
      routerAddress,
      deadline: 1n,
    });
    const finalExact = buildFameRouteLeg({
      edge: fameEdges[1]!,
      amountMode: "Exact",
      amount: 6_000n,
      minAmountOut: 60n,
      routerAddress,
      deadline: 1n,
    });

    assert.throws(
      () =>
        materializeAllInFameRoute(
          {
            version: 1,
            tokenIn: FAME,
            tokenOut: WETH,
            amountIn: 10_000n,
            minAmountOutAfterFee: 90n,
            recipient,
            deadline: 1n,
            legs: [earlierAll, finalExact],
          },
          routerAddress,
          recipient,
          deadline,
        ),
      /earlier FAME-input All leg/u,
    );
  });

  it("regenerates the all-in FAME venue payload with the bound recipient and deadline", () => {
    const edge = famePoolEdgesForPair(FAME, WETH).find(
      (candidate) => candidate.venue === "UniswapV2",
    );
    assert.ok(edge);
    const quotedLeg = buildFameRouteLeg({
      edge,
      amountMode: "Exact",
      amount: 10_000n,
      minAmountOut: 60n,
      routerAddress: recipient,
      deadline: 1n,
    });
    const materialized = materializeAllInFameRoute(
      {
        version: 1,
        tokenIn: FAME,
        tokenOut: WETH,
        amountIn: 10_000n,
        minAmountOutAfterFee: 50n,
        recipient,
        deadline: 1n,
        legs: [quotedLeg],
      },
      routerAddress,
      recipient,
      deadline,
    );
    const [payload] = decodeAbiParameters(
      uniswapV2PayloadAbi,
      materialized.route.legs[0]!.data,
    );

    assert.deepEqual(
      payload.path.map((address) => address.toLowerCase()),
      [FAME.toLowerCase(), WETH.toLowerCase()],
    );
    assert.equal(payload.deadline, deadline);
    assertSameAddress(materialized.route.recipient, recipient);
  });
});

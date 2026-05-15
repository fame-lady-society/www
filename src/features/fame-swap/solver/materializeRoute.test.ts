import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeAbiParameters } from "viem";
import { routeArtifactById } from "./artifacts";
import { famePoolEdges } from "./poolUniverse";
import { materializeFameRoute } from "./materializeRoute";
import { USDC, WETH } from "../tokens";
import { buildFameRouteLeg } from "../router/buildLegPayload";
import {
  aerodromeV2PayloadAbi,
  universalRouterV3PayloadAbi,
  universalRouterV4PayloadAbi,
} from "../router/payloads";
import type { JsonFameRoute } from "../router/types";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";
const deadline = 1_800_000_000n;

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
    const [payload] = decodeAbiParameters(universalRouterV3PayloadAbi, v3Leg.data);
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
        materializeFameRoute(artifact.route, routerAddress, recipient, deadline, {
          amountIn: requestedAmountIn,
          minAmountOutAfterFee: 1n,
          slippageBps: 100,
        }),
      /fixture scaling has been removed/i,
    );
  });
});

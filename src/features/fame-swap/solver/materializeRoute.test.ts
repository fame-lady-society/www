import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeAbiParameters } from "viem";
import { routeArtifactById } from "./artifacts";
import { materializeFameRoute } from "./materializeRoute";
import {
  universalRouterV3PayloadAbi,
  universalRouterV4PayloadAbi,
} from "../router/payloads";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";
const deadline = 1_800_000_000n;

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

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeAbiParameters } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "../tokens";
import {
  solveFameSwapAmount,
  solveFameSwapAmountAsync,
} from "./amountSolver";
import type { FameQuoteAdapter } from "./quotes/adapters";
import { createDeterministicQuoteAdapter } from "./quotes/deterministicAdapter";
import { toAsyncQuoteAdapter } from "./optimizer/quoteRunAdapter";
import {
  FAME_OPTIMIZER_EXPECTED_NON_STATIC_SPLIT_BPS,
  FAME_OPTIMIZER_NON_STATIC_WETH_SPLIT_AMOUNT_IN,
} from "./optimizer/fixtures";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "./slippage";
import {
  aerodromeV2PayloadAbi,
  universalRouterV4PayloadAbi,
} from "../router/payloads";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";
const deadline = 1_800_000_000n;

function assertSameAddress(actual: string | undefined, expected: string) {
  assert.equal(actual?.toLowerCase(), expected.toLowerCase());
}

function token(address: typeof FAME | typeof USDC | typeof WETH | typeof NATIVE_ETH) {
  const result = tokenForAddress(address);
  assert.ok(result);
  return result;
}

describe("FAME amount-aware solver", () => {
  it("materializes a generated USDC split-merge route with protected output and fees", () => {
    const result = solveFameSwapAmount({
      tokenIn: token(USDC),
      tokenOut: token(FAME),
      amountIn: 800_000n,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.route.tokenIn, USDC);
      assert.equal(result.route.tokenOut, FAME);
      assert.equal(result.route.amountIn, 800_000n);
      assert.equal(result.route.recipient, recipient);
      assert.equal(result.route.minAmountOutAfterFee, result.plan.protectedAmountOut);
      assert.ok(result.poolIds.includes("scale-equalizer-usdc-frxusd"));
      assert.ok(result.poolIds.includes("slipstream-usdc-frxusd"));
      assert.ok(result.poolIds.includes("scale-equalizer-frxusd-fame"));
      assert.ok(result.plan.routerFeeAmount > 0n);
      assert.equal(result.plan.feeBreakdown.venueFeesIncluded, true);
    }
  });

  it("materializes V4 payloads with router recipient and zero amount for All mode", () => {
    const result = solveFameSwapAmount({
      tokenIn: token(NATIVE_ETH),
      tokenOut: token(FAME),
      amountIn: 500_000_000_000_000n,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      const v4Leg = result.route.legs.find((leg) => leg.venue === "UniswapV4");
      assert.ok(v4Leg);
      const [payload] = decodeAbiParameters(universalRouterV4PayloadAbi, v4Leg.data);
      assert.equal(payload.recipient, routerAddress);
      if (v4Leg.amountMode === "All") {
        assert.equal(payload.amountIn, 0n);
      }
    }
  });

  it("materializes native WETH wrap legs with empty payload and zero leg minimum", () => {
    const adapter: FameQuoteAdapter = {
      quoteEdge(request) {
        const favorsWethFame =
          request.edge.tokenIn.toLowerCase() === WETH.toLowerCase() &&
          request.edge.tokenOut.toLowerCase() === FAME.toLowerCase();

        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: favorsWethFame ? request.amountIn * 1_000_000n : request.amountIn,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test native wrap route quote evidence",
        };
      },
    };
    const result = solveFameSwapAmount({
      tokenIn: token(NATIVE_ETH),
      tokenOut: token(FAME),
      amountIn: 500_000_000_000_000n,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter,
    });

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      const wrapLeg = result.route.legs[0];
      assert.equal(wrapLeg?.venue, "NativeWrap");
      assert.equal(wrapLeg?.venueOrdinal, 6);
      assert.equal(wrapLeg?.target, WETH);
      assert.equal(wrapLeg?.data, "0x");
      assert.equal(wrapLeg?.amount, result.route.amountIn);
      assert.equal(wrapLeg?.minAmountOut, 0n);
      assert.equal(result.capabilities.nativeWrap, true);
      assert.equal(result.poolIds[0], "native-wrap-weth");
    }
  });

  it("materializes a quote-backed connector route absent from original artifacts", () => {
    const preferredPools = new Set([
      "uniswap-v3-zora-usdc",
      "uniswap-v3-zora-weth",
      "scale-equalizer-weth-fame",
    ]);
    const adapter: FameQuoteAdapter = {
      quoteEdge(request) {
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: preferredPools.has(request.edge.poolId)
            ? request.amountIn * 100n
            : request.amountIn,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test connector route quote evidence",
        };
      },
    };

    const result = solveFameSwapAmount({
      tokenIn: token(USDC),
      tokenOut: token(FAME),
      amountIn: 1_000_000n,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter,
    });

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(
        new Set<string>(FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds).has(
          result.routeArtifactId,
        ),
        false,
      );
      assert.deepEqual(result.poolIds, [...preferredPools]);
      assert.equal(result.route.legs.length, 3);
      assert.match(result.routeHash, /^0x[a-fA-F0-9]{64}$/);
      assert.ok(result.abiEncodedRoute.length > 2);
    }
  });

  it("materializes Aerodrome V2 USDC/WETH connector routes with explicit factory payloads", () => {
    const adapter: FameQuoteAdapter = {
      quoteEdge(request) {
        if (request.edge.poolId === "aerodrome-v2-usdc-weth") {
          return {
            status: "quoted",
            amountIn: request.amountIn,
            amountOut: request.amountIn * 1_000_000_000_000n,
            capacityIn: null,
            fee: request.edge.fee,
            evidence: "unit test Aerodrome V2 USDC/WETH quote evidence",
          };
        }

        if (request.edge.poolId === "scale-equalizer-weth-fame") {
          return {
            status: "quoted",
            amountIn: request.amountIn,
            amountOut: request.amountIn * 50n,
            capacityIn: null,
            fee: request.edge.fee,
            evidence: "unit test WETH/FAME quote evidence",
          };
        }

        return {
          status: "failed",
          reason: "no_quote_evidence",
          message: `No unit test quote for ${request.edge.poolId}.`,
        };
      },
    };

    const result = solveFameSwapAmount({
      tokenIn: token(USDC),
      tokenOut: token(FAME),
      amountIn: 1_000_000n,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter,
    });

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.deepEqual(result.poolIds, [
        "aerodrome-v2-usdc-weth",
        "scale-equalizer-weth-fame",
      ]);
      const aerodromeLeg = result.route.legs[0];
      assert.ok(aerodromeLeg);
      assert.equal(aerodromeLeg?.venue, "AerodromeV2");
      assert.equal(aerodromeLeg?.venueOrdinal, 7);
      const [payload] = decodeAbiParameters(
        aerodromeV2PayloadAbi,
        aerodromeLeg.data,
      );
      const [route] = payload.routes;
      assertSameAddress(route?.from, USDC);
      assertSameAddress(route?.to, WETH);
      assert.equal(route?.stable, false);
      assertSameAddress(
        route?.factory,
        "0x420dd381b31aef6683db6b902084cb0ffece40da",
      );
      assert.equal(payload.deadline, deadline);
    }
  });

  it("fails closed when no candidate can safely carry the amount", () => {
    const result = solveFameSwapAmount({
      tokenIn: token(WETH),
      tokenOut: token(FAME),
      amountIn: 2_000_000_000_000_000n,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(result.status, "no_safe_route");
    if (result.status === "no_safe_route") {
      assert.ok(
        result.rejectedCandidates.some(
          (candidate) => candidate.reason === "amount_exceeds_capacity",
        ),
      );
    }
  });

  it("requires an explicit quote adapter instead of falling back to deterministic caps", () => {
    const result = solveFameSwapAmount({
      tokenIn: token(WETH),
      tokenOut: token(FAME),
      amountIn: 100_000_000_000_000n,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
    });

    assert.equal(result.status, "quote_adapter_failure");
    if (result.status === "quote_adapter_failure") {
      assert.equal(result.rejectedCandidates[0]?.reason, "no_quote_evidence");
    }
  });

  it("async select mode materializes an optimized non-static split", async () => {
    const result = await solveFameSwapAmountAsync({
      tokenIn: token(WETH),
      tokenOut: token(FAME),
      amountIn: FAME_OPTIMIZER_NON_STATIC_WETH_SPLIT_AMOUNT_IN,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter: toAsyncQuoteAdapter(createDeterministicQuoteAdapter()),
      optimizerMode: "select",
    });

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.plan.candidate.kind, "split");
      assert.equal(
        result.optimizerEvidence?.selectedAllocationBps,
        FAME_OPTIMIZER_EXPECTED_NON_STATIC_SPLIT_BPS,
      );
      assert.equal(
        result.routeDisplay[0]?.allocationBps,
        FAME_OPTIMIZER_EXPECTED_NON_STATIC_SPLIT_BPS,
      );
      assert.equal(result.route.legs[0]?.amount, 500_000_000_000_000n);
      assert.equal(result.route.legs[1]?.amount, 0n);
    }
  });

  it("async select mode fails bounded when the optimizer times out before a safe quote", async () => {
    const result = await solveFameSwapAmountAsync({
      tokenIn: token(WETH),
      tokenOut: token(FAME),
      amountIn: FAME_OPTIMIZER_NON_STATIC_WETH_SPLIT_AMOUNT_IN,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter: toAsyncQuoteAdapter(createDeterministicQuoteAdapter()),
      optimizerMode: "select",
      optimizerBudgets: {
        timeoutMs: 0,
      },
    });

    assert.equal(result.status, "quote_adapter_failure");
    if (result.status === "quote_adapter_failure") {
      assert.match(result.message, /timed out/);
    }
  });

  it("async shadow mode records optimizer evidence but returns legacy route selection", async () => {
    const result = await solveFameSwapAmountAsync({
      tokenIn: token(WETH),
      tokenOut: token(FAME),
      amountIn: FAME_OPTIMIZER_NON_STATIC_WETH_SPLIT_AMOUNT_IN,
      routerAddress,
      recipient,
      deadline,
      feePpm: 2_222n,
      slippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      adapter: toAsyncQuoteAdapter(createDeterministicQuoteAdapter()),
      optimizerMode: "shadow",
    });

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.plan.candidate.kind, "split");
      assert.equal(result.routeDisplay[0]?.allocationBps, 5_000);
      assert.equal(
        result.optimizerEvidence?.selectedAllocationBps,
        FAME_OPTIMIZER_EXPECTED_NON_STATIC_SPLIT_BPS,
      );
    }
  });
});

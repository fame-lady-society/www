import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeAbiParameters } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "../tokens";
import { solveFameSwapAmount } from "./amountSolver";
import { createDeterministicQuoteAdapter } from "./quotes/deterministicAdapter";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "./slippage";
import { universalRouterV4PayloadAbi } from "../router/payloads";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";
const deadline = 1_800_000_000n;

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
});

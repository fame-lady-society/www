import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, WETH } from "../../tokens";
import { routeCandidatesForPair } from "../graph/candidates";
import { createDeterministicQuoteAdapter } from "./deterministicAdapter";
import { rankRouteCandidatesAsync } from "./asyncRankRoutes";
import { rankRouteCandidates } from "./rankRoutes";
import type { FameAsyncQuoteAdapter, FameQuoteAdapter } from "./adapters";

const feePpm = 2_222n;
const slippageBps = 100;

function wethToFameCandidates() {
  return routeCandidatesForPair(WETH, FAME).candidates;
}

describe("FAME route ranking", () => {
  it("selects a split route when direct pools cannot carry a larger WETH amount", () => {
    const result = rankRouteCandidates({
      candidates: wethToFameCandidates(),
      amountIn: 800_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(result.status, "selected");
    if (result.status === "selected") {
      assert.equal(result.plan.candidate.kind, "split");
      assert.ok(
        result.plan.legQuotes.some(
          (quote) => quote.poolId === "scale-equalizer-weth-fame",
        ),
      );
      assert.ok(
        result.rejectedCandidates.some(
          (candidate) => candidate.reason === "amount_exceeds_capacity",
        ),
      );
    }
  });

  it("selects the best direct route for a small WETH amount", () => {
    const result = rankRouteCandidates({
      candidates: wethToFameCandidates(),
      amountIn: 100_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(result.status, "selected");
    if (result.status === "selected") {
      assert.equal(result.plan.candidate.kind, "single_path");
      assert.equal(result.plan.legQuotes[0]?.poolId, "scale-equalizer-weth-fame");
    }
  });

  it("fails closed when all candidates exceed capacity", () => {
    const result = rankRouteCandidates({
      candidates: wethToFameCandidates(),
      amountIn: 2_000_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(result.status, "no_safe_route");
    assert.ok(
      result.rejectedCandidates.some(
        (candidate) => candidate.reason === "amount_exceeds_capacity",
      ),
    );
  });

  it("uses a safe candidate when another venue adapter fails", () => {
    const fallback = createDeterministicQuoteAdapter();
    const adapter: FameQuoteAdapter = {
      quoteEdge(request) {
        if (request.edge.poolId === "scale-equalizer-weth-fame") {
          return {
            status: "failed",
            reason: "adapter_failure",
            message: "Solidly quote failed.",
          };
        }
        return fallback.quoteEdge(request);
      },
    };
    const result = rankRouteCandidates({
      candidates: wethToFameCandidates(),
      amountIn: 100_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter,
    });

    assert.equal(result.status, "selected");
    if (result.status === "selected") {
      assert.equal(result.plan.legQuotes[0]?.poolId, "uniswap-v2-fame-direct");
      assert.match(result.plan.warnings[0] ?? "", /Solidly quote failed/);
    }
  });

  it("reports quote adapter failure when every candidate lacks quotes", () => {
    const adapter: FameQuoteAdapter = {
      quoteEdge() {
        return {
          status: "failed",
          reason: "adapter_failure",
          message: "RPC unavailable.",
        };
      },
    };
    const result = rankRouteCandidates({
      candidates: wethToFameCandidates(),
      amountIn: 100_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter,
    });

    assert.equal(result.status, "quote_adapter_failure");
  });

  it("emits router fee separately from venue fee diagnostics", () => {
    const result = rankRouteCandidates({
      candidates: wethToFameCandidates(),
      amountIn: 100_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(result.status, "selected");
    if (result.status === "selected") {
      assert.equal(result.plan.feeBreakdown.routerFeePpm, feePpm);
      assert.equal(result.plan.feeBreakdown.venueFeesIncluded, true);
      assert.ok(result.plan.routerFeeAmount > 0n);
      assert.equal(result.plan.feeBreakdown.legs[0]?.feeIncludedInQuote, true);
      assert.equal(result.plan.feeBreakdown.legs[0]?.feeAmount, null);
    }
  });

  it("async ranking preserves route-local All balances and quote context", async () => {
    const context = {
      source: "snapshot" as const,
      snapshotId: "unit-test-liquidity",
      pinnedBaseBlock: 45_884_844,
    };
    const adapter: FameAsyncQuoteAdapter = {
      quoteContext: context,
      async quoteEdge(request) {
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn * 2n,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test proportional liquidity",
          context,
        };
      },
    };

    const result = await rankRouteCandidatesAsync({
      candidates: wethToFameCandidates(),
      amountIn: 100_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter,
    });

    assert.equal(result.status, "selected");
    if (result.status === "selected") {
      assert.equal(result.plan.quoteContext, context);
      assert.equal(result.plan.legQuotes[0]?.quoteContext, context);
      const allLeg = result.plan.legQuotes.find(
        (quote, index) =>
          result.plan.candidate.legs[index]?.amountMode === "All",
      );
      if (allLeg) {
        assert.ok(allLeg.amountIn > 0n);
      }
    }
  });
});

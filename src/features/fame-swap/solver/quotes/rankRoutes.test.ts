import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../../artifacts/manifest";
import { FAME, USDC, WETH } from "../../tokens";
import {
  DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS,
  routeCandidatesForPair,
} from "../graph/candidates";
import { createDeterministicQuoteAdapter } from "./deterministicAdapter";
import {
  DEFAULT_MAX_ASYNC_ROUTE_QUOTE_CALLS,
  rankRouteCandidatesAsync,
} from "./asyncRankRoutes";
import { rankRouteCandidates } from "./rankRoutes";
import type { FameAsyncQuoteAdapter, FameQuoteAdapter } from "./adapters";

const feePpm = 2_222n;
const slippageBps = 100;

function wethToFameCandidates() {
  return routeCandidatesForPair(WETH, FAME).candidates;
}

function usdcToFameCandidates() {
  return routeCandidatesForPair(USDC, FAME).candidates;
}

describe("FAME route ranking", () => {
  it("derives async quote-call defaults from candidate budgets", () => {
    assert.equal(
      DEFAULT_MAX_ASYNC_ROUTE_QUOTE_CALLS,
      DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS.maxCandidates *
        DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS.maxSimplePathLegs,
    );
  });

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
      assert.equal(
        result.plan.legQuotes[0]?.poolId,
        "scale-equalizer-weth-fame",
      );
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
      assert.ok(
        result.rejectedCandidates.some((candidate) =>
          /Solidly quote failed/.test(candidate.message),
        ),
      );
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

  it("can select a quote-backed connector route absent from original artifacts", () => {
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
          evidence: "unit test connector quote evidence",
        };
      },
    };

    const result = rankRouteCandidates({
      candidates: usdcToFameCandidates(),
      amountIn: 1_000_000n,
      feePpm,
      slippageBps,
      adapter,
    });

    assert.equal(result.status, "selected");
    if (result.status === "selected") {
      assert.equal(
        new Set<string>(FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds).has(
          result.plan.candidate.id,
        ),
        false,
      );
      assert.deepEqual(
        result.plan.candidate.legs.map((leg) => leg.edge.poolId),
        [...preferredPools],
      );
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

  it("async ranking evaluates independent candidates concurrently", async () => {
    let active = 0;
    let maxActive = 0;
    const adapter: FameAsyncQuoteAdapter = {
      async quoteEdge(request) {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn * 2n,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test concurrent liquidity",
        };
      },
    };

    const result = await rankRouteCandidatesAsync({
      candidates: wethToFameCandidates(),
      amountIn: 100_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter,
      maxConcurrentCandidates: 3,
    });

    assert.equal(result.status, "selected");
    assert.ok(maxActive > 1);
    assert.ok(maxActive <= 3);
  });

  it("async ranking enforces a quote-call budget", async () => {
    let quoteCalls = 0;
    const adapter: FameAsyncQuoteAdapter = {
      async quoteEdge(request) {
        quoteCalls += 1;
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn * 2n,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test quote-call budget",
        };
      },
    };

    const result = await rankRouteCandidatesAsync({
      candidates: usdcToFameCandidates(),
      amountIn: 1_000_000n,
      feePpm,
      slippageBps,
      adapter,
      maxConcurrentCandidates: 1,
      maxQuoteCalls: 1,
    });

    assert.equal(result.status, "quote_adapter_failure");
    assert.ok(quoteCalls <= 1);
    assert.ok(
      result.rejectedCandidates.some((candidate) =>
        candidate.message.includes("quote-call budget"),
      ),
    );
  });

  it("async ranking fails closed when budget exhaustion follows a quoted candidate", async () => {
    let quoteCalls = 0;
    const adapter: FameAsyncQuoteAdapter = {
      async quoteEdge(request) {
        quoteCalls += 1;
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn * 2n,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test partial budget exhaustion",
        };
      },
    };

    const result = await rankRouteCandidatesAsync({
      candidates: wethToFameCandidates(),
      amountIn: 100_000_000_000_000n,
      feePpm,
      slippageBps,
      adapter,
      maxConcurrentCandidates: 1,
      maxQuoteCalls: 1,
    });

    assert.equal(result.status, "quote_adapter_failure");
    assert.ok(quoteCalls <= 1);
    assert.ok(
      result.rejectedCandidates.some((candidate) =>
        candidate.message.includes("quote-call budget"),
      ),
    );
  });
});

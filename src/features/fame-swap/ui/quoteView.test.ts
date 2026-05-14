import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, USDC, WETH, tokenForAddress } from "../tokens";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import { fameSwapQuoteView, type FameSwapQuoteViewTransaction } from "./quoteView";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";

function token(address: typeof FAME | typeof USDC | typeof WETH) {
  const result = tokenForAddress(address);
  assert.ok(result);
  return result;
}

function artifactAmount(id: string): bigint {
  const artifact = routeArtifactById(id);
  assert.ok(artifact);
  return BigInt(artifact.route.amountIn);
}

function transaction(
  overrides: Partial<FameSwapQuoteViewTransaction> = {},
): FameSwapQuoteViewTransaction {
  return {
    simulatedOutput: null,
    protectedMinimum: null,
    quoteExpired: false,
    canApprove: false,
    canSwap: false,
    approvalConfirmed: false,
    submitting: false,
    protectedSimulationPending: false,
    error: null,
    ...overrides,
  };
}

function quoteAdapter() {
  return createDeterministicQuoteAdapter();
}

describe("FAME swap quote view", () => {
  it("shows direct USDC input as the USDC estimate for buy FAME", () => {
    const quote = quoteWithReadyReadiness({
      tokenIn: token(USDC),
      tokenOut: token(FAME),
      amountIn: 1_000_000n,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });
    const view = fameSwapQuoteView(quote, token(FAME), transaction());

    assert.equal(view.usdcEstimate.status, "available");
    assert.equal(view.usdcEstimate.label, "1 USDC");
    assert.equal(view.feeLabel, "0.2222%");
    assert.match(view.feeTooltip ?? "", /router contract/i);
  });

  it("shows direct USDC output only after simulation", () => {
    const amountIn = artifactAmount("solver-fame-basedflick-zora-usdc");
    const quote = quoteWithReadyReadiness({
      tokenIn: token(FAME),
      tokenOut: token(USDC),
      amountIn,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });
    const view = fameSwapQuoteView(
      quote,
      token(USDC),
      transaction({
        simulatedOutput: 2_500_000n,
        protectedMinimum: 2_475_000n,
      }),
    );

    assert.equal(view.receiveLabel, "2.5 USDC");
    assert.equal(view.protectedMinimumLabel, "2.475 USDC");
    assert.equal(view.usdcEstimate.label, "2.5 USDC");
  });

  it("does not invent USDC estimates for non-USDC routes", () => {
    const amountIn = artifactAmount("solver-weth-split-fame");
    const quote = quoteWithReadyReadiness({
      tokenIn: token(WETH),
      tokenOut: token(FAME),
      amountIn,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });
    const view = fameSwapQuoteView(quote, token(FAME), transaction());

    assert.equal(view.usdcEstimate.status, "unavailable");
  });

  it("uses explicit estimate states before pre-approval simulation completes", () => {
    const amountIn = artifactAmount("solver-weth-split-fame");
    const quote = quoteWithReadyReadiness({
      tokenIn: token(WETH),
      tokenOut: token(FAME),
      amountIn,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });
    const pendingView = fameSwapQuoteView(
      quote,
      token(FAME),
      transaction({ protectedSimulationPending: true }),
    );
    const failedView = fameSwapQuoteView(quote, token(FAME), transaction());

    assert.equal(pendingView.receiveLabel, "Estimating");
    assert.equal(pendingView.protectedMinimumLabel, "Estimating");
    assert.equal(failedView.receiveLabel, "Estimate unavailable");
    assert.equal(failedView.protectedMinimumLabel, "Estimate unavailable");
  });

  it("labels split routes without fake percentages", () => {
    const amountIn = artifactAmount("solver-weth-split-fame");
    const quote = quoteWithReadyReadiness({
      tokenIn: token(WETH),
      tokenOut: token(FAME),
      amountIn,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });
    const view = fameSwapQuoteView(quote, token(FAME), transaction());

    assert.equal(view.routeMap?.split, true);
    assert.equal(view.routeMap?.splitShareLabel, "Split share unavailable");
    assert.ok(view.routeMap?.edges.some((edge) => edge.amountLabel === "remaining"));
    assert.ok(
      view.routeMap?.edges.some((edge) =>
        edge.poolName.includes("Scale Equalizer"),
      ),
    );
  });

  it("summarizes routes with token symbols instead of raw addresses", () => {
    const amountIn = artifactAmount("solver-usdc-zora-basedflick-fame");
    const quote = quoteWithReadyReadiness({
      tokenIn: token(USDC),
      tokenOut: token(FAME),
      amountIn,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });
    const view = fameSwapQuoteView(quote, token(FAME), transaction());

    assert.equal(view.routeMap?.summary, "USDC -> frxUSD -> FAME");
    assert.doesNotMatch(view.routeMap?.summary ?? "", /0x/i);
  });

  it("marks expired quotes as blocked", () => {
    const quote = quoteWithReadyReadiness({
      tokenIn: token(USDC),
      tokenOut: token(FAME),
      amountIn: 1_000_000n,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });
    const view = fameSwapQuoteView(
      quote,
      token(FAME),
      transaction({ quoteExpired: true }),
    );

    assert.equal(view.blocked, true);
    assert.match(view.freshnessLabel, /expired/i);
  });

  it("uses solver failure messages as blocked reasons", () => {
    const quote = quoteWithReadyReadiness({
      tokenIn: token(FAME),
      tokenOut: token(USDC),
      amountIn: artifactAmount("solver-fame-basedflick-zora-usdc") * 1_000n,
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: quoteAdapter(),
    });
    const view = fameSwapQuoteView(quote, token(USDC), transaction());

    assert.equal(quote.status, "no_safe_route");
    assert.equal(view.blocked, true);
    assert.match(view.blockedReason ?? "", /No safe FAME route/i);
  });
});

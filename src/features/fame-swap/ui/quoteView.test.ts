import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, USDC, WETH, tokenForAddress } from "../tokens";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import {
  fameSwapQuoteView,
  type FameSwapQuoteViewTransaction,
} from "./quoteView";

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
    preApprovalSimulationError: null,
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
    assert.equal(view.venueFeeLabel, "Included in quote");
    assert.match(view.venueFeeTooltip ?? "", /pinned pool metadata/i);
    assert.match(view.venueFeeTooltip ?? "", /not live fee reads/i);
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
    assert.equal(view.estimateSourceLabel, "Wallet-simulated output");
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

  it("uses server quote output when pre-approval wallet simulation is unavailable", () => {
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
    const fallbackView = fameSwapQuoteView(
      quote,
      token(FAME),
      transaction({
        canApprove: true,
        preApprovalSimulationError: {
          reason: "unsupported_rpc",
          message: "Wallet RPC does not support bundled quote simulation.",
        },
      }),
    );

    assert.equal(pendingView.receiveLabel, "Estimating");
    assert.equal(pendingView.protectedMinimumLabel, "Estimating");
    assert.notEqual(fallbackView.receiveLabel, "Estimate unavailable");
    assert.notEqual(fallbackView.protectedMinimumLabel, "Estimate unavailable");
    assert.match(
      fallbackView.estimateSourceLabel ?? "",
      /Quote estimate until/,
    );
    assert.match(fallbackView.estimateSourceTooltip ?? "", /server quote/i);
    assert.match(fallbackView.estimateSourceTooltip ?? "", /final gate/i);
    assert.equal(fallbackView.blocked, false);
  });

  it("keeps total estimates unavailable when no ready quote exists", () => {
    const view = fameSwapQuoteView(null, token(FAME), transaction());

    assert.equal(view.receiveLabel, "Enter amount");
    assert.equal(view.protectedMinimumLabel, "Enter amount");
    assert.equal(view.estimateSourceLabel, null);
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
    assert.ok(
      view.routeMap?.edges.some((edge) => edge.amountLabel === "remaining"),
    );
    assert.ok(
      view.routeMap?.edges.every(
        (edge) => edge.fromToken.iconLabel && edge.toToken.iconLabel,
      ),
    );
    assert.ok(
      view.routeMap?.edges.every(
        (edge) => edge.poolTypeLabel && edge.pairLabel && edge.venueLabel,
      ),
    );
    assert.ok(
      view.routeMap?.edges.every((edge) => /\d+\.\d{2}%/.test(edge.feeLabel)),
    );
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
    for (const edge of view.routeMap?.edges ?? []) {
      const primaryLabels = [
        edge.from,
        edge.to,
        edge.poolName,
        edge.poolTypeLabel,
        edge.pairLabel,
        edge.venueLabel,
      ].join(" ");

      assert.doesNotMatch(primaryLabels, /0x/i);
      if (edge.poolId) {
        assert.equal(primaryLabels.includes(edge.poolId), false);
      }
    }
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

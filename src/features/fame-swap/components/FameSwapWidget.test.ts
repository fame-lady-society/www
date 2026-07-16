import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it } from "node:test";
import { FAME, WETH, tokenForAddress } from "../tokens";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import { fameSwapQuoteView } from "../ui/quoteView";
import {
  FameSwapHeading,
  fameSwapErrorDetails,
  fameSwapErrorSummary,
  quoteSummary,
} from "./FameSwapWidget";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";

describe("FameSwapWidget focus target", () => {
  it("exposes the existing heading as a stable programmatic focus target", () => {
    const html = renderToStaticMarkup(
      createElement(FameSwapHeading, { compact: false }),
    );

    assert.match(html, /id="fame-swap-heading"/);
    assert.match(html, /tabindex="-1"/);
    assert.match(html, />FAME swap<\/h4>/);
  });
});

describe("FameSwapWidget quote summary", () => {
  it("does not show the fixture placeholder minimum before wallet simulation", () => {
    const tokenIn = tokenForAddress(WETH);
    const tokenOut = tokenForAddress(FAME);
    const artifact = routeArtifactById("solver-weth-split-fame");
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    assert.ok(artifact);

    const quote = quoteWithReadyReadiness({
      tokenIn,
      tokenOut,
      amountIn: BigInt(artifact.route.amountIn),
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: createDeterministicQuoteAdapter(),
    });

    assert.equal(quote.status, "ready");
    if (quote.status === "ready") {
      assert.ok(quote.minAmountOutAfterFee > 1n);
      assert.equal(
        quoteSummary(quote),
        "Minimum after fee: waiting for wallet checks.",
      );
    }
  });

  it("exposes a route graph for the widget without changing quote summary behavior", () => {
    const tokenIn = tokenForAddress(WETH);
    const tokenOut = tokenForAddress(FAME);
    const artifact = routeArtifactById("solver-weth-split-fame");
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    assert.ok(artifact);

    const quote = quoteWithReadyReadiness({
      tokenIn,
      tokenOut,
      amountIn: BigInt(artifact.route.amountIn),
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: createDeterministicQuoteAdapter(),
    });
    const view = fameSwapQuoteView(quote, tokenOut, {
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
    });

    assert.equal(
      quoteSummary(quote),
      "Minimum after fee: waiting for wallet checks.",
    );
    assert.equal(view.routeMap?.graph.topology, "split");
    assert.equal(view.routeMap?.graph.branchGroups.length, 1);
    assert.ok(
      view.routeMap?.graph.edges.every(
        (edge) => edge.share.source === "quoted_amount",
      ),
    );
  });
});

describe("FameSwapWidget error copy", () => {
  it("keeps viem request details out of the visible alert summary", () => {
    const error = new Error(
      [
        "User rejected the request.",
        "Request Arguments:",
        "chain: undefined (id: 8453)",
        "from: 0x499e194d7a106AC1305ed4f96c6CEaAff650462D",
        "to: 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        "data: 0x095ea7b3",
        "Contract Call:",
        "function: approve(address spender, uint256 amount)",
        "Docs: https://viem.sh/docs/contract/writeContract",
        "Details: User rejected the request.",
        "Version: viem@2.43.2",
      ].join(" "),
    );

    assert.equal(fameSwapErrorSummary(error), "User rejected the request.");
    assert.doesNotMatch(fameSwapErrorSummary(error), /Request Arguments|0x/i);
    assert.equal(fameSwapErrorDetails(error), error.message);
  });

  it("does not offer copy details for already concise errors", () => {
    const error = new Error("Balance unavailable.");

    assert.equal(fameSwapErrorSummary(error), "Balance unavailable.");
    assert.equal(fameSwapErrorDetails(error), null);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FAME, USDC, tokenForAddress } from "../tokens";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import {
  fameSwapQuoteView,
  type FameSwapQuoteViewTransaction,
} from "../ui/quoteView";
import { FameSwapRouteMap } from "./RouteMap";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";

function token(address: typeof FAME | typeof USDC) {
  const result = tokenForAddress(address);
  assert.ok(result);
  return result;
}

function artifactAmount(id: string): bigint {
  const artifact = routeArtifactById(id);
  assert.ok(artifact);
  return BigInt(artifact.route.amountIn);
}

function transaction(): FameSwapQuoteViewTransaction {
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
  };
}

function routeMap() {
  const quote = quoteWithReadyReadiness({
    tokenIn: token(USDC),
    tokenOut: token(FAME),
    amountIn: artifactAmount("solver-usdc-split-frxusd-merge-fame"),
    recipient,
    routerAddress,
    now: new Date("2026-05-14T00:00:00Z"),
    adapter: createDeterministicQuoteAdapter(),
  });
  const view = fameSwapQuoteView(quote, token(FAME), transaction());
  assert.ok(view.routeMap);
  return view.routeMap;
}

describe("FAME swap route map component", () => {
  it("renders the graph, primary pool labels, and collapsed technical details", () => {
    const html = renderToStaticMarkup(
      <FameSwapRouteMap routeMap={routeMap()} />,
    );

    assert.match(html, /USDC -&gt; frxUSD -&gt; FAME/);
    assert.match(html, /role="img"/);
    assert.match(html, /US/);
    assert.match(html, /FX/);
    assert.match(html, /Solidly stable pool/);
    assert.match(html, /USDC\/frxUSD/);
    assert.match(html, /Scale Equalizer/);
    assert.match(html, /0\.040%/);
    assert.match(html, /Route technical details/);
    assert.match(html, /Copy Scale Equalizer USDC\/frxUSD pool ID/);
  });
});

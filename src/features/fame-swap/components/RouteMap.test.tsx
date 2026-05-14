import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FameSwapRouteMap as FameSwapRouteMapView } from "../ui/quoteView";
import { FameSwapRouteMap } from "./RouteMap";

const routeMap = {
  summary: "USDC -> frxUSD -> FAME",
  split: true,
  splitShareLabel: "Split share unavailable",
  edges: [
    {
      id: "0-Solidly-Exact",
      from: "USDC",
      to: "frxUSD",
      fromToken: {
        symbol: "USDC",
        label: "USD Coin",
        iconLabel: "US",
        iconBackground: "#2775ca",
        iconForeground: "#ffffff",
      },
      toToken: {
        symbol: "frxUSD",
        label: "Frax USD",
        iconLabel: "FX",
        iconBackground: "#f4b400",
        iconForeground: "#111111",
      },
      venue: "Solidly",
      venueLabel: "Scale Equalizer",
      poolId: "scale-equalizer-usdc-frxusd",
      poolName: "Scale Equalizer USDC/frxUSD",
      poolTypeLabel: "Solidly stable pool",
      pairLabel: "USDC/frxUSD",
      feeLabel: "0.04%",
      feeTooltip: "Reviewed fee metadata.",
      amountMode: "Exact",
      amountLabel: null,
    },
  ],
} satisfies FameSwapRouteMapView;

describe("FAME swap route map component", () => {
  it("renders token badges, primary pool labels, and collapsed technical details", () => {
    const html = renderToStaticMarkup(<FameSwapRouteMap routeMap={routeMap} />);

    assert.match(html, /USDC -&gt; frxUSD -&gt; FAME/);
    assert.match(html, /US/);
    assert.match(html, /FX/);
    assert.match(html, /Solidly stable pool/);
    assert.match(html, /USDC\/frxUSD/);
    assert.match(html, /Scale Equalizer/);
    assert.match(html, /0\.04%/);
    assert.match(html, /Pool ID/);
    assert.match(html, /Copy Scale Equalizer USDC\/frxUSD pool ID/);
  });
});

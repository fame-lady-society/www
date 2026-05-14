import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FAME, USDC, WETH, tokenForAddress } from "../tokens";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import { buildFameSwapRouteGraph } from "../ui/routeGraph";
import { FameSwapRouteGraph } from "./RouteGraph";

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

function readyGraph(options: {
  tokenIn: typeof FAME | typeof USDC | typeof WETH;
  tokenOut: typeof FAME | typeof USDC | typeof WETH;
  amountIn: bigint;
}) {
  const quote = quoteWithReadyReadiness({
    tokenIn: token(options.tokenIn),
    tokenOut: token(options.tokenOut),
    amountIn: options.amountIn,
    recipient,
    routerAddress,
    now: new Date("2026-05-14T00:00:00Z"),
    adapter: createDeterministicQuoteAdapter(),
  });
  if (quote.status !== "ready") {
    throw new Error("Expected ready quote.");
  }
  return buildFameSwapRouteGraph(quote);
}

describe("FAME swap route graph component", () => {
  it("renders serial route tokens, pool labels, and arrow direction", () => {
    const graph = readyGraph({
      tokenIn: FAME,
      tokenOut: USDC,
      amountIn: artifactAmount("solver-fame-basedflick-zora-usdc"),
    });

    const html = renderToStaticMarkup(<FameSwapRouteGraph graph={graph} />);

    assert.match(html, /role="img"/);
    assert.match(html, /FAME/);
    assert.match(html, /basedflick/);
    assert.match(html, /ZORA/);
    assert.match(html, /USDC/);
    assert.match(html, /Concentrated liquidity pool/);
    assert.match(html, /Hook pool/);
    assert.match(html, /ZORA\/USDC/);
    assert.match(html, /fee [0-9]/);
    assert.match(html, /aria-label="Aerodrome Slipstream basedflick\/FAME:/);
    assert.match(html, /marker-end/);
  });

  it("renders split branches with honest share labels and non-color pool cues", () => {
    const graph = readyGraph({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: artifactAmount("solver-weth-split-fame"),
    });

    const html = renderToStaticMarkup(<FameSwapRouteGraph graph={graph} />);

    assert.match(html, /Split route/);
    assert.match(html, /quoted input/);
    assert.match(html, /Solidly volatile pool/);
    assert.match(html, /Constant product pool/);
    assert.match(html, /data-pool-type-cue="dashed"/);
    assert.match(html, /data-pool-type-cue="solid"/);
  });

  it("renders split-merge semantics and collapsed technical details", () => {
    const graph = readyGraph({
      tokenIn: USDC,
      tokenOut: FAME,
      amountIn: artifactAmount("solver-usdc-split-frxusd-merge-fame"),
    });

    const html = renderToStaticMarkup(<FameSwapRouteGraph graph={graph} />);

    assert.match(html, /Split route with merge/);
    assert.match(html, /remaining/);
    assert.match(html, /Route technical details/);
    assert.match(html, /scale-equalizer-frxusd-fame/);
    assert.match(html, /Copy Scale Equalizer frxUSD\/FAME pool ID/);
  });
});

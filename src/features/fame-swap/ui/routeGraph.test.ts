import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, USDC, WETH, tokenForAddress } from "../tokens";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import {
  buildFameSwapRouteGraph,
  type FameSwapRouteGraphEdge,
} from "./routeGraph";

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

function readyQuote(options: {
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

  return quote;
}

function edgeByPool(
  edges: readonly FameSwapRouteGraphEdge[],
  poolId: string,
): FameSwapRouteGraphEdge {
  const edge = edges.find((candidate) => candidate.poolId === poolId);
  assert.ok(edge, `Expected graph edge for ${poolId}`);
  return edge;
}

describe("FAME swap route graph view model", () => {
  it("builds an ordered serial graph without raw addresses in primary labels", () => {
    const quote = readyQuote({
      tokenIn: FAME,
      tokenOut: USDC,
      amountIn: artifactAmount("solver-fame-basedflick-zora-usdc"),
    });

    const graph = buildFameSwapRouteGraph(quote);

    assert.equal(graph.summary, "FAME -> basedflick -> ZORA -> USDC");
    assert.equal(graph.topology, "serial");
    assert.deepEqual(
      graph.nodes.map((node) => node.token.symbol),
      ["FAME", "basedflick", "ZORA", "USDC"],
    );
    assert.deepEqual(
      graph.edges.map((edge) => edge.pairLabel),
      ["basedflick/FAME", "basedflick/ZORA", "ZORA/USDC"],
    );
    assert.match(
      edgeByPool(graph.edges, "slipstream-basedflick-fame").feeAmountLabel ??
        "",
      /FAME$/,
    );
    assert.ok(
      graph.edges.every((edge) => /pool fee/.test(edge.feeDetailLabel)),
    );
    assert.ok(
      graph.semanticLines.some((line) =>
        line.includes("FAME to basedflick through Aerodrome Slipstream"),
      ),
    );

    const primaryText = [
      graph.summary,
      ...graph.nodes.map((node) => node.token.symbol),
      ...graph.edges.flatMap((edge) => [
        edge.poolName,
        edge.poolTypeLabel,
        edge.pairLabel,
        edge.venueLabel,
      ]),
    ].join(" ");

    assert.doesNotMatch(primaryText, /0x/i);
  });

  it("builds a split graph with share labels sourced from selected leg amounts", () => {
    const quote = readyQuote({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: artifactAmount("solver-weth-split-fame"),
    });

    const graph = buildFameSwapRouteGraph(quote);
    const scaleEdge = edgeByPool(graph.edges, "scale-equalizer-weth-fame");
    const uniEdge = edgeByPool(graph.edges, "uniswap-v2-fame-direct");

    assert.equal(graph.topology, "split");
    assert.equal(graph.branchGroups.length, 1);
    assert.equal(scaleEdge.share.source, "quoted_amount");
    assert.equal(uniEdge.share.source, "quoted_amount");
    assert.match(scaleEdge.share.label, /%$/);
    assert.match(uniEdge.share.label, /%$/);
    assert.notEqual(scaleEdge.lane, uniEdge.lane);
    assert.ok(scaleEdge.branchGroupId);
    assert.equal(scaleEdge.branchGroupId, uniEdge.branchGroupId);
  });

  it("builds a split-then-merge graph with branch lanes converging before the merge edge", () => {
    const quote = readyQuote({
      tokenIn: USDC,
      tokenOut: FAME,
      amountIn: artifactAmount("solver-usdc-split-frxusd-merge-fame"),
    });

    const graph = buildFameSwapRouteGraph(quote);
    const mergeEdge = edgeByPool(graph.edges, "scale-equalizer-frxusd-fame");

    assert.equal(graph.topology, "split_merge");
    assert.equal(graph.branchGroups.length, 1);
    assert.equal(graph.mergeGroups.length, 1);
    assert.equal(mergeEdge.fromToken.symbol, "frxUSD");
    assert.equal(mergeEdge.toToken.symbol, "FAME");
    assert.ok(mergeEdge.mergeGroupId);
    assert.equal(mergeEdge.share.source, "unavailable");
    assert.equal(mergeEdge.share.label, "remaining");
  });

  it("uses allocation bps as fallback when selected leg amounts are unavailable", () => {
    const quote = readyQuote({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: artifactAmount("solver-weth-split-fame"),
    });
    const graph = buildFameSwapRouteGraph({
      ...quote,
      feeBreakdown: {
        ...quote.feeBreakdown,
        legs: [],
      },
    });

    assert.equal(graph.topology, "split");
    assert.ok(
      graph.edges.every((edge) => edge.share.source === "allocation_bps"),
    );
    assert.ok(graph.edges.every((edge) => /%$/.test(edge.share.label)));
  });

  it("keeps unknown tokens displayable through fallback metadata", () => {
    const unknownAddress = "0x0000000000000000000000000000000000000def";
    const quote = readyQuote({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: artifactAmount("solver-weth-split-fame"),
    });
    const graph = buildFameSwapRouteGraph({
      ...quote,
      route: {
        ...quote.route,
        tokenIn: unknownAddress,
        legs: quote.route.legs.map((leg) => ({
          ...leg,
          tokenIn:
            leg.tokenIn.toLowerCase() === WETH.toLowerCase()
              ? unknownAddress
              : leg.tokenIn,
        })),
      },
      feeBreakdown: {
        ...quote.feeBreakdown,
        legs: quote.feeBreakdown.legs.map((leg) => ({
          ...leg,
          tokenIn:
            leg.tokenIn.toLowerCase() === WETH.toLowerCase()
              ? unknownAddress
              : leg.tokenIn,
        })),
      },
    });

    const unknownNode = graph.nodes.find((node) => !node.token.known);

    assert.ok(unknownNode);
    assert.equal(unknownNode.token.iconLabel, "??");
    assert.match(graph.semanticLines.join(" "), /0x0000...0def/);
  });
});

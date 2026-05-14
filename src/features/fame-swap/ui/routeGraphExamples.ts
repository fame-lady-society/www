import type { Address } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "../tokens";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import { buildFameSwapRouteGraph, type FameSwapRouteGraph } from "./routeGraph";

export type FameSwapRouteGraphExampleKind =
  | "single-hop"
  | "multi-hop-serial"
  | "direct-split"
  | "split-then-merge"
  | "native-eth"
  | "missing-token-image"
  | "unknown-token";

export interface FameSwapRouteGraphExample {
  id: string;
  label: string;
  kind: FameSwapRouteGraphExampleKind;
  graph: FameSwapRouteGraph;
  displaySafe: true;
  routeArtifactId: string | null;
  corpusId: string | null;
  note: string;
}

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";

function token(address: Address) {
  const result = tokenForAddress(address);
  if (!result) throw new Error(`Missing FAME swap token ${address}.`);
  return result;
}

function artifactAmount(id: string): bigint {
  const artifact = routeArtifactById(id);
  if (!artifact) throw new Error(`Missing route artifact ${id}.`);
  return BigInt(artifact.route.amountIn);
}

function readyGraph(options: {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
}): FameSwapRouteGraph {
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
    throw new Error(`Expected ready example quote, received ${quote.status}.`);
  }
  return buildFameSwapRouteGraph(quote);
}

function unknownTokenGraph(): FameSwapRouteGraph {
  const unknownAddress =
    "0x0000000000000000000000000000000000000def" as const satisfies Address;
  const quote = quoteWithReadyReadiness({
    tokenIn: token(WETH),
    tokenOut: token(FAME),
    amountIn: artifactAmount("solver-weth-split-fame"),
    recipient,
    routerAddress,
    now: new Date("2026-05-14T00:00:00Z"),
    adapter: createDeterministicQuoteAdapter(),
  });
  if (quote.status !== "ready") {
    throw new Error(`Expected ready example quote, received ${quote.status}.`);
  }

  return buildFameSwapRouteGraph({
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
}

export const FAME_SWAP_ROUTE_GRAPH_EXAMPLES: readonly FameSwapRouteGraphExample[] =
  [
    {
      id: "single-hop-weth-fame",
      label: "Single-hop WETH to FAME",
      kind: "single-hop",
      graph: readyGraph({
        tokenIn: WETH,
        tokenOut: FAME,
        amountIn: 100_000_000_000_000n,
      }),
      displaySafe: true,
      routeArtifactId: null,
      corpusId: "weth-fame-small-direct",
      note: "A compact direct route through one selected pool.",
    },
    {
      id: "multi-hop-fame-usdc",
      label: "Multi-hop FAME to USDC",
      kind: "multi-hop-serial",
      graph: readyGraph({
        tokenIn: FAME,
        tokenOut: USDC,
        amountIn: artifactAmount("solver-fame-basedflick-zora-usdc"),
      }),
      displaySafe: true,
      routeArtifactId: "solver-fame-basedflick-zora-usdc",
      corpusId: "fame-usdc-fixture",
      note: "A serial route with multiple token hops and reviewed pool labels.",
    },
    {
      id: "direct-split-weth-fame",
      label: "Direct split WETH to FAME",
      kind: "direct-split",
      graph: readyGraph({
        tokenIn: WETH,
        tokenOut: FAME,
        amountIn: artifactAmount("solver-weth-split-fame"),
      }),
      displaySafe: true,
      routeArtifactId: "solver-weth-split-fame",
      corpusId: "weth-fame-split",
      note: "Two selected WETH/FAME pools split the same input token.",
    },
    {
      id: "split-merge-usdc-fame",
      label: "Split then merge USDC to FAME",
      kind: "split-then-merge",
      graph: readyGraph({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: artifactAmount("solver-usdc-split-frxusd-merge-fame"),
      }),
      displaySafe: true,
      routeArtifactId: "solver-usdc-split-frxusd-merge-fame",
      corpusId: "usdc-fame-fixture",
      note: "Two USDC/frxUSD branches converge before the frxUSD/FAME leg.",
    },
    {
      id: "native-eth-fame",
      label: "Native ETH to FAME",
      kind: "native-eth",
      graph: readyGraph({
        tokenIn: NATIVE_ETH,
        tokenOut: FAME,
        amountIn: 500_000_000_000_000n,
      }),
      displaySafe: true,
      routeArtifactId: null,
      corpusId: "eth-fame-fixture",
      note: "Native ETH stays visually distinct from WETH.",
    },
    {
      id: "missing-token-image-fallback",
      label: "Missing token image fallback",
      kind: "missing-token-image",
      graph: readyGraph({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: artifactAmount("solver-usdc-split-frxusd-merge-fame"),
      }),
      displaySafe: true,
      routeArtifactId: "solver-usdc-split-frxusd-merge-fame",
      corpusId: "usdc-fame-fixture",
      note: "Current known route tokens use documented badge fallbacks when no reviewed local image is cached.",
    },
    {
      id: "unknown-token-fallback",
      label: "Unknown token fallback",
      kind: "unknown-token",
      graph: unknownTokenGraph(),
      displaySafe: true,
      routeArtifactId: null,
      corpusId: null,
      note: "Unknown token metadata falls back to a shortened address and badge.",
    },
  ];

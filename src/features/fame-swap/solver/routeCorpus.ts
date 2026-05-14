import type { Address } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "../tokens";
import { routeArtifactById } from "./artifacts";
import type { FameSwapQuoteStatus } from "./types";

export interface FameRouteCorpusCase {
  id: string;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  expectedStatus: FameSwapQuoteStatus;
  expectedDeterministicStatus?: FameSwapQuoteStatus;
  expectedSnapshotStatus?: FameSwapQuoteStatus;
  expectedLiveStatus?: FameSwapQuoteStatus;
  note: string;
}

function artifactAmount(id: string): bigint {
  const artifact = routeArtifactById(id);
  if (!artifact) throw new Error(`Missing route artifact ${id}.`);
  return BigInt(artifact.route.amountIn);
}

export const FAME_ROUTE_CORPUS: readonly FameRouteCorpusCase[] = [
  {
    id: "usdc-fame-fixture",
    tokenIn: USDC,
    tokenOut: FAME,
    amountIn: 1_000_000n,
    expectedStatus: "ready",
    note: "USDC buy amount covered by current deterministic split-merge evidence.",
  },
  {
    id: "usdc-fame-five-dollars",
    tokenIn: USDC,
    tokenOut: FAME,
    amountIn: 5_000_000n,
    expectedStatus: "ready",
    expectedDeterministicStatus: "no_safe_route",
    note: "$5 USDC buy must be replayed from recorded/live liquidity instead of rejected by synthetic deterministic caps.",
  },
  {
    id: "usdc-fame-large-closed",
    tokenIn: USDC,
    tokenOut: FAME,
    amountIn: 2_000_000n,
    expectedStatus: "ready",
    expectedDeterministicStatus: "no_safe_route",
    note: "Larger USDC buy is a deterministic-cap failure but should quote with recorded/live liquidity.",
  },
  {
    id: "fame-usdc-fixture",
    tokenIn: FAME,
    tokenOut: USDC,
    amountIn: artifactAmount("solver-fame-basedflick-zora-usdc"),
    expectedStatus: "ready",
    note: "FAME sell amount covered by existing composed route family.",
  },
  {
    id: "fame-usdc-large-closed",
    tokenIn: FAME,
    tokenOut: USDC,
    amountIn: artifactAmount("solver-fame-basedflick-zora-usdc") * 1_000n,
    expectedStatus: "ready",
    expectedDeterministicStatus: "no_safe_route",
    note: "Large FAME sell is a deterministic-cap failure but should quote with recorded/live liquidity.",
  },
  {
    id: "weth-fame-small-direct",
    tokenIn: WETH,
    tokenOut: FAME,
    amountIn: 100_000_000_000_000n,
    expectedStatus: "ready",
    note: "Small WETH buy can use a direct known pool.",
  },
  {
    id: "weth-fame-split",
    tokenIn: WETH,
    tokenOut: FAME,
    amountIn: 800_000_000_000_000n,
    expectedStatus: "ready",
    note: "Larger WETH buy requires split route capacity.",
  },
  {
    id: "weth-fame-large-closed",
    tokenIn: WETH,
    tokenOut: FAME,
    amountIn: 2_000_000_000_000_000n,
    expectedStatus: "ready",
    expectedDeterministicStatus: "no_safe_route",
    note: "WETH amount beyond deterministic split capacity should quote from recorded/live liquidity.",
  },
  {
    id: "fame-weth-fixture",
    tokenIn: FAME,
    tokenOut: WETH,
    amountIn: artifactAmount("solver-fame-basedflick-zora-weth"),
    expectedStatus: "ready",
    note: "FAME to WETH uses the known basedflick/ZORA route family.",
  },
  {
    id: "eth-fame-fixture",
    tokenIn: NATIVE_ETH,
    tokenOut: FAME,
    amountIn: 500_000_000_000_000n,
    expectedStatus: "ready",
    note: "Native ETH buy uses native ETH route family, not WETH.",
  },
  {
    id: "eth-fame-large-closed",
    tokenIn: NATIVE_ETH,
    tokenOut: FAME,
    amountIn: 2_000_000_000_000_000n,
    expectedStatus: "ready",
    expectedDeterministicStatus: "no_safe_route",
    note: "Native ETH amount beyond deterministic capacity should quote from recorded/live liquidity.",
  },
  {
    id: "fame-eth-fixture",
    tokenIn: FAME,
    tokenOut: NATIVE_ETH,
    amountIn: artifactAmount("solver-fame-basedflick-zora-eth"),
    expectedStatus: "ready",
    note: "FAME to native ETH keeps native output distinct from WETH.",
  },
] as const;

export function corpusTokenLabel(address: Address): string {
  return tokenForAddress(address)?.symbol ?? address;
}

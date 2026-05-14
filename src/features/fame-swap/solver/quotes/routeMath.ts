import type { Address } from "viem";
import type { FameRouteCandidate } from "../graph/routePlan";
import { applySlippageToAmount } from "../slippage";
import type {
  FameCandidateRejection,
  FameLegQuote,
  FamePriceImpactEstimate,
} from "./adapters";

export const FEE_DENOMINATOR = 1_000_000n;
export const PRICE_SCALE = 1_000_000_000_000_000_000n;
const Q192 = 1n << 192n;

export function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

export function balanceOf(
  balances: ReadonlyMap<string, bigint>,
  address: Address,
): bigint {
  return balances.get(normalizedAddress(address)) ?? 0n;
}

export function addBalance(
  balances: Map<string, bigint>,
  address: Address,
  amount: bigint,
): void {
  balances.set(normalizedAddress(address), balanceOf(balances, address) + amount);
}

export function subtractBalance(
  balances: Map<string, bigint>,
  address: Address,
  amount: bigint,
): boolean {
  const current = balanceOf(balances, address);
  if (amount > current) return false;
  balances.set(normalizedAddress(address), current - amount);
  return true;
}

export function spendAmount(
  candidate: FameRouteCandidate,
  legIndex: number,
  amountIn: bigint,
  balances: ReadonlyMap<string, bigint>,
): bigint {
  const leg = candidate.legs[legIndex];
  if (leg.amountMode === "All") return balanceOf(balances, leg.edge.tokenIn);
  if (leg.allocationBps !== null) {
    return (amountIn * BigInt(leg.allocationBps)) / 10_000n;
  }
  return legIndex === 0 ? amountIn : balanceOf(balances, leg.edge.tokenIn);
}

export function routerFee(amountOut: bigint, feePpm: bigint): bigint {
  return (amountOut * feePpm) / FEE_DENOMINATOR;
}

export function quoteFailureOnly(
  rejections: readonly FameCandidateRejection[],
): boolean {
  return rejections.every(
    (rejection) =>
      rejection.reason === "adapter_failure" ||
      rejection.reason === "no_quote_evidence",
  );
}

export function priceX18(amountOut: bigint, amountIn: bigint): bigint | null {
  if (amountIn <= 0n || amountOut < 0n) return null;
  return (amountOut * PRICE_SCALE) / amountIn;
}

export function marketImpactBps(
  preSwapPriceX18: bigint,
  executionPriceX18: bigint,
): number | null {
  if (preSwapPriceX18 <= 0n || executionPriceX18 <= 0n) return null;
  if (executionPriceX18 >= preSwapPriceX18) return 0;

  const impact = ((preSwapPriceX18 - executionPriceX18) * 10_000n) /
    preSwapPriceX18;
  return Number(impact);
}

function sameAddress(left: Address, right: Address): boolean {
  return normalizedAddress(left) === normalizedAddress(right);
}

export function concentratedLiquidityDirectionalPriceX18(options: {
  sqrtPriceX96: bigint;
  tokenIn: Address;
  tokenOut: Address;
  token0: Address;
  token1: Address;
}): bigint | null {
  if (options.sqrtPriceX96 <= 0n) return null;
  const square = options.sqrtPriceX96 * options.sqrtPriceX96;

  if (
    sameAddress(options.tokenIn, options.token0) &&
    sameAddress(options.tokenOut, options.token1)
  ) {
    return (square * PRICE_SCALE) / Q192;
  }

  if (
    sameAddress(options.tokenIn, options.token1) &&
    sameAddress(options.tokenOut, options.token0)
  ) {
    return (Q192 * PRICE_SCALE) / square;
  }

  return null;
}

export function concentratedLiquidityPriceImpact(options: {
  amountIn: bigint;
  amountOut: bigint;
  tokenIn: Address;
  tokenOut: Address;
  token0: Address;
  token1: Address;
  preSwapSqrtPriceX96: bigint;
  postSwapSqrtPriceX96?: bigint | null;
}): FamePriceImpactEstimate | undefined {
  const preSwapPrice = concentratedLiquidityDirectionalPriceX18({
    sqrtPriceX96: options.preSwapSqrtPriceX96,
    tokenIn: options.tokenIn,
    tokenOut: options.tokenOut,
    token0: options.token0,
    token1: options.token1,
  });
  const executionPrice = priceX18(options.amountOut, options.amountIn);
  if (preSwapPrice === null || executionPrice === null) return undefined;

  const postSwapPrice =
    options.postSwapSqrtPriceX96 && options.postSwapSqrtPriceX96 > 0n
      ? concentratedLiquidityDirectionalPriceX18({
          sqrtPriceX96: options.postSwapSqrtPriceX96,
          tokenIn: options.tokenIn,
          tokenOut: options.tokenOut,
          token0: options.token0,
          token1: options.token1,
        })
      : null;

  return {
    preSwapPriceX18: preSwapPrice,
    postSwapPriceX18: postSwapPrice,
    executionPriceX18: executionPrice,
    marketImpactBps: marketImpactBps(preSwapPrice, executionPrice),
    method:
      options.postSwapSqrtPriceX96 && options.postSwapSqrtPriceX96 > 0n
        ? "quoter-price-after"
        : "concentrated-liquidity-slot0",
  };
}

export function constantProductPriceImpact(options: {
  amountIn: bigint;
  amountOut: bigint;
  reserveIn: bigint;
  reserveOut: bigint;
}): FamePriceImpactEstimate | undefined {
  const preSwapPrice = priceX18(options.reserveOut, options.reserveIn);
  const executionPrice = priceX18(options.amountOut, options.amountIn);
  if (preSwapPrice === null || executionPrice === null) return undefined;

  const nextReserveIn = options.reserveIn + options.amountIn;
  const nextReserveOut = options.reserveOut - options.amountOut;
  const postSwapPrice =
    nextReserveOut > 0n ? priceX18(nextReserveOut, nextReserveIn) : null;

  return {
    preSwapPriceX18: preSwapPrice,
    postSwapPriceX18: postSwapPrice,
    executionPriceX18: executionPrice,
    marketImpactBps: marketImpactBps(preSwapPrice, executionPrice),
    method: "constant-product-reserves",
  };
}

export function legMinAmountOut(amountOut: bigint, slippageBps: number): bigint {
  return applySlippageToAmount(amountOut, slippageBps);
}

export function routeExecutionPriceX18(
  grossAmountOut: bigint,
  amountIn: bigint,
): bigint | null {
  return priceX18(grossAmountOut, amountIn);
}

export function maxLegMarketImpactBps(
  legQuotes: readonly FameLegQuote[],
): number | null {
  const impacts = legQuotes
    .map((quote) => quote.priceImpact?.marketImpactBps)
    .filter((value): value is number => typeof value === "number");
  if (impacts.length === 0) return null;
  return Math.max(...impacts);
}

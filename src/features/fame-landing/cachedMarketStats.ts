import { unstable_cache } from "next/cache";
import { client as baseClient } from "@/viem/base-client";
import {
  galleryReadAddresses,
  readMarketplaceLandingAuthority,
  type GalleryMulticallClient,
} from "@/features/fame-market/reads";
import { BASE_GALLERY_ADDRESSES, parseBaseGalleryForkContracts } from "@/features/fame-market/contracts";
import { createProductionFameQuoteDependencies, quoteFameExactInput, quoteFameExactTarget } from "@/features/fame-swap/server/quoteService";
import { getFameSwapConfig } from "@/features/fame-swap/config";
import { FAME_SWAP_TOKENS, NATIVE_ETH, USDC } from "@/features/fame-swap/tokens";
import { executableDepth, mapBounded, BUY_DEPTH_LADDER_USDC, SELL_DEPTH_LADDER_FAME } from "./liquidityDepth";
import { marketFreshness, type Freshness } from "./marketStats";
import type { FameQuoteContext } from "@/features/fame-swap/solver/quotes/quoteContext";

export const MARKET_STATS_REVALIDATE_SECONDS = 300;
export const MARKET_STATS_COMPOSITION_TIMEOUT_MS = 2_500;
export const LIQUIDITY_LADDER_CONCURRENCY = 2;

export type MarketProjection<T> = Readonly<{
  capturedAt: string;
  blockNumber?: string;
  basis?: Readonly<{ unit: string; premium: string }>;
  data: T;
}>;
export type MarketProjectionState<T> =
  | Readonly<{ status: "available"; freshness: Freshness; value: MarketProjection<T> }>
  | Readonly<{ status: "unavailable"; reason: string }>;

export function cachedProjection<T>(key: string, producer: () => Promise<MarketProjection<T>>) {
  return unstable_cache(producer, ["fame-landing", key], { revalidate: MARKET_STATS_REVALIDATE_SECONDS });
}

export type MarketplaceAuthorityDto = Readonly<{
  paused: boolean; premium: string; unit: string; totalSupply: string; decimals: number;
  totalProviderUnits: string; activeProviderCount: string; inventory: string;
}>;
export type QuoteDto = Readonly<{
  currency: "USDC" | "ETH"; side: "buy" | "sell"; amount: string; protectedAmount: string;
  basis: Readonly<{ unit: string; premium: string }>; capturedAt: string; blockNumber?: string;
}>;
export type DepthDto = Readonly<{ side: "buy" | "sell"; amount: string; atLeast: boolean; capturedAt: string; blockNumber?: string }>;

function productionAddresses() {
  const contracts = parseBaseGalleryForkContracts({
    marketplace: process.env.NEXT_PUBLIC_BASE_UNIVERSAL_MARKETPLACE_ADDRESS,
    checkout: process.env.NEXT_PUBLIC_BASE_FAME_CHECKOUT_ADDRESS,
    forkMode: process.env.NEXT_PUBLIC_FAME_FORK_MODE === "1",
  });
  if (!contracts) throw new Error("The Base marketplace address is not configured.");
  return galleryReadAddresses({ ...BASE_GALLERY_ADDRESSES, gallery: contracts.marketplace });
}

function token(address: typeof USDC | typeof NATIVE_ETH | (typeof FAME_SWAP_TOKENS)[number]["address"]) {
  const result = FAME_SWAP_TOKENS.find((candidate) => candidate.address.toLowerCase() === address.toLowerCase());
  if (!result) throw new Error("Unsupported FAME quote token.");
  return result;
}

function quoteContextBlockNumber(context: FameQuoteContext | undefined) {
  if (!context) return undefined;
  switch (context.source) {
    case "live":
    case "fork":
      return context.blockNumber.toString();
    case "snapshot":
      return context.pinnedBaseBlock.toString();
    case "indexed":
      return context.currentBlock.toString();
    case "deterministic_test":
      return undefined;
  }
}

async function marketplaceProducer(): Promise<MarketProjection<MarketplaceAuthorityDto>> {
  const client = baseClient as unknown as GalleryMulticallClient;
  const blockNumber = await client.getBlockNumber();
  const state = await readMarketplaceLandingAuthority(client, blockNumber, productionAddresses());
  if (state.status !== "success") throw new Error(state.message);
  const { data } = state;
  return { capturedAt: new Date().toISOString(), blockNumber: blockNumber.toString(), data: {
    paused: data.paused, premium: data.premium.toString(), unit: data.unit.toString(),
    totalSupply: data.totalSupply.toString(), decimals: data.decimals,
    totalProviderUnits: data.totalProviderUnits.toString(), activeProviderCount: data.activeProviderCount.toString(), inventory: data.inventory.toString(),
  } };
}

const getMarketplace = cachedProjection("marketplace", marketplaceProducer);

async function currentMarketplace() {
  const projection = await getMarketplace();
  const data = projection.data;
  return { projection, unit: BigInt(data.unit), premium: BigInt(data.premium), inventory: BigInt(data.inventory), paused: data.paused };
}

async function quoteProducer(currency: "USDC" | "ETH", side: "buy" | "sell"): Promise<MarketProjection<QuoteDto>> {
  const market = await currentMarketplace();
  const config = getFameSwapConfig();
  const tokenIn = token(side === "buy" ? (currency === "USDC" ? USDC : NATIVE_ETH) : FAME_SWAP_TOKENS[0].address);
  const tokenOut = token(side === "buy" ? FAME_SWAP_TOKENS[0].address : (currency === "USDC" ? USDC : NATIVE_ETH));
  const dependencies = createProductionFameQuoteDependencies({ requestTimeoutMs: 2_250, responseCushionMs: 0 });
  const basis = { unit: market.unit.toString(), premium: market.premium.toString() };
  if (side === "buy") {
    const result = await quoteFameExactTarget({ tokenIn, tokenOut, targetOutput: market.unit + market.premium, recipient: null,
      range: { minimumInput: 1n, maximumInput: currency === "USDC" ? 1_000_000_000_000n : 1_000n * 10n ** 18n, precision: 1n },
      signal: AbortSignal.timeout(2_250), timeoutMs: 2_250, maxEvaluations: 16, maxRpcReads: 64 }, {
      readinessForQuote: dependencies.readinessForQuote,
      createAdapter: async ({ signal, timeoutMs }) => {
        const readiness = await dependencies.readinessForQuote(config.routerAddress);
        if (!dependencies.createAdapter) throw new Error("Quote adapter is unavailable.");
        return await dependencies.createAdapter({ tokenIn, tokenOut, amountIn: 1n, recipient: null, config, readiness, optimizerBudgets: undefined });
      }, config,
    });
    if (result.status !== "ready") throw new Error(result.message);
    return { capturedAt: new Date().toISOString(), blockNumber: quoteContextBlockNumber(result.quote.plan.quoteContext), basis, data: { currency, side, amount: result.amountIn.toString(), protectedAmount: result.protectedOutput.toString(), basis, capturedAt: new Date().toISOString() } };
  }
  const quote = await quoteFameExactInput({ tokenIn, tokenOut, amountIn: market.unit, recipient: null, optimizerBudgets: landingOptimizerBudgets() }, dependencies);
  if (quote.status !== "ready") throw new Error("The current Society sell quote is unavailable.");
  return { capturedAt: new Date().toISOString(), blockNumber: quoteContextBlockNumber(quote.quoteContext), basis, data: { currency, side, amount: market.unit.toString(), protectedAmount: quote.minAmountOutAfterFee.toString(), basis, capturedAt: new Date().toISOString() } };
}

const getUsdcBuy = cachedProjection("usdc-buy", () => quoteProducer("USDC", "buy"));
const getUsdcSell = cachedProjection("usdc-sell", () => quoteProducer("USDC", "sell"));
const getEthBuy = cachedProjection("eth-buy", () => quoteProducer("ETH", "buy"));
const getEthSell = cachedProjection("eth-sell", () => quoteProducer("ETH", "sell"));

async function depthProducer(side: "buy" | "sell"): Promise<MarketProjection<DepthDto>> {
  const market = await currentMarketplace();
  const ladder = side === "buy" ? BUY_DEPTH_LADDER_USDC : SELL_DEPTH_LADDER_FAME;
  const input = side === "buy" ? token(USDC) : token(FAME_SWAP_TOKENS[0].address);
  const output = side === "buy" ? token(FAME_SWAP_TOKENS[0].address) : token(USDC);
  const dependencies = createProductionFameQuoteDependencies({ requestTimeoutMs: 2_250, responseCushionMs: 0 });
  const config = getFameSwapConfig();
  const readiness = await dependencies.readinessForQuote(config.routerAddress);
  if (!dependencies.createAdapter) throw new Error("Depth quote adapter is unavailable.");
  // A ladder is one observation: every reference/candidate shares this adapter
  // and therefore one pinned quote context and registry cut.
  const adapter = await dependencies.createAdapter({ tokenIn: input, tokenOut: output, amountIn: 1n, recipient: null, config, readiness, optimizerBudgets: undefined });
  const pinnedDependencies = {
    readinessForQuote: async () => readiness,
    createAdapter: async () => adapter,
  };
  const quote = async (amountIn: bigint) => {
    const result = await quoteFameExactInput({ tokenIn: input, tokenOut: output, amountIn, recipient: null, optimizerBudgets: landingOptimizerBudgets() }, pinnedDependencies);
    if (result.status !== "ready") throw new Error("Depth quote is unavailable.");
    return { input: amountIn, output: result.minAmountOutAfterFee };
  };
  const reference = await quote(side === "buy" ? 1_000_000n : market.unit);
  const candidates = await mapBounded(ladder, LIQUIDITY_LADDER_CONCURRENCY, quote);
  const depth = executableDepth(reference, candidates, input.decimals, output.decimals);
  if (!depth) throw new Error("No executable depth is available.");
  return { capturedAt: new Date().toISOString(), data: { side, amount: depth.amount.toString(), atLeast: depth.atLeast, capturedAt: new Date().toISOString() } };
}

const getBuyDepth = cachedProjection("usdc-buy-depth", () => depthProducer("buy"));
const getSellDepth = cachedProjection("usdc-sell-depth", () => depthProducer("sell"));

function landingOptimizerBudgets() {
  return {
    maxTemplates: 4, maxTrialsPerTemplate: 4, maxLogicalQuoteRequests: 24,
    maxUniqueExactQuoteReads: 24, maxUniqueStateReads: 12,
    maxUnderlyingRpcReads: 64, timeoutMs: 2_250,
  };
}

/** Starts all seven independent producers and preserves per-source availability. */
export async function getCachedMarketStats(now = Date.now()) {
  return composeMarketProjections({ marketplace: getMarketplace, usdcBuy: getUsdcBuy, usdcSell: getUsdcSell, ethBuy: getEthBuy, ethSell: getEthSell, buyDepth: getBuyDepth, sellDepth: getSellDepth }, now);
}

export async function composeMarketProjections<T extends Record<string, () => Promise<MarketProjection<unknown>>>>(
  producers: T,
  now = Date.now(),
  timeoutMs = MARKET_STATS_COMPOSITION_TIMEOUT_MS,
): Promise<{ [K in keyof T]: MarketProjectionState<unknown> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const keys = Object.keys(producers) as Array<keyof T>;
    const settled = await Promise.race([
      Promise.allSettled(keys.map((key) => producers[key]!())),
      new Promise<never>((_, reject) => controller.signal.addEventListener("abort", () => reject(new Error("Market projection deadline exceeded")), { once: true })),
    ]).catch(() => null);
    if (!settled) return Object.fromEntries(keys.map((key) => [key, { status: "unavailable", reason: "Market data refresh timed out." }])) as { [K in keyof T]: MarketProjectionState<unknown> };
    return Object.fromEntries(keys.map((key, index) => {
      const result = settled[index]!;
      if (result.status !== "fulfilled") return [key, { status: "unavailable", reason: "Market data is unavailable." }];
      const freshness = marketFreshness(result.value.capturedAt, now);
      return freshness === "unavailable"
        ? [key, { status: "unavailable", reason: "Market data is older than 30 minutes." }]
        : [key, { status: "available", freshness, value: result.value }];
    })) as { [K in keyof T]: MarketProjectionState<unknown> };
  } finally { clearTimeout(timer); }
}

import { unstable_cache } from "next/cache";
import { client as baseClient } from "@/viem/base-client";
import {
  galleryReadAddresses,
  readMarketplaceLandingAuthority,
  type GalleryMulticallClient,
} from "@/features/fame-market/reads";
import {
  BASE_GALLERY_ADDRESSES,
  parseBaseGalleryForkContracts,
} from "@/features/fame-market/contracts";
import {
  createProductionFameQuoteDependencies,
  quoteFameExactInput,
  quoteFameExactTarget,
} from "@/features/fame-swap/server/quoteService";
import { getFameSwapConfig } from "@/features/fame-swap/config";
import {
  FAME_SWAP_TOKENS,
  NATIVE_ETH,
  USDC,
  tokenForAddress,
  type FameSwapToken,
} from "@/features/fame-swap/tokens";
import {
  BUY_DEPTH_LADDER_USDC,
  SELL_DEPTH_LADDER_FAME,
  executableDepth,
  mapBounded,
} from "./liquidityDepth";
import { marketFreshness, type Freshness } from "./marketStats";

export const MARKET_STATS_REVALIDATE_SECONDS = 300;
export const MARKET_STATS_COMPOSITION_TIMEOUT_MS = 7_000;
export const LANDING_QUOTE_TIMEOUT_MS = 5_000;
export const LIQUIDITY_LADDER_CONCURRENCY = 2;
export const DEFI_FAME_AMOUNT = 1_000_000n * 10n ** 18n;

export type MarketProjection<T> = Readonly<{
  capturedAt: string;
  data: T;
}>;

export type MarketProjectionState<T> =
  | Readonly<{
      status: "available";
      freshness: Freshness;
      value: MarketProjection<T>;
    }>
  | Readonly<{ status: "unavailable"; reason: string }>;

export type MarketplacePriceDto = Readonly<{
  premium: string;
  unit: string;
  totalSupply: string;
  totalProviderUnits: string;
  decimals: number;
}>;

export type DepthDto = Readonly<{
  amount: string;
  atLeast: boolean;
}>;

export type LandingQuoteKind = "defiBuy" | "defiSell" | "nftBuy";
export type LandingQuoteCurrency = "USDC" | "ETH";

export type LandingQuoteDto = Readonly<{
  amount: string;
}>;

export type LandingQuoteDefinition = Readonly<{
  kind: LandingQuoteKind;
  currency: LandingQuoteCurrency;
  mode: "exactInput" | "exactTarget";
  fameAmount: bigint;
  slippageBps: 0;
}>;

export type LandingMarketStats = Readonly<{
  marketplace: MarketProjectionState<MarketplacePriceDto>;
  defiBuyUsdc: MarketProjectionState<LandingQuoteDto>;
  defiBuyEth: MarketProjectionState<LandingQuoteDto>;
  defiSellUsdc: MarketProjectionState<LandingQuoteDto>;
  defiSellEth: MarketProjectionState<LandingQuoteDto>;
  nftBuyUsdc: MarketProjectionState<LandingQuoteDto>;
  nftBuyEth: MarketProjectionState<LandingQuoteDto>;
  buyDepth: MarketProjectionState<DepthDto>;
  sellDepth: MarketProjectionState<DepthDto>;
}>;

type ProjectionData<T> = T extends () => Promise<MarketProjection<infer Data>>
  ? Data
  : never;

type ProjectionStates<
  T extends Record<string, () => Promise<MarketProjection<unknown>>>,
> = { [K in keyof T]: MarketProjectionState<ProjectionData<T[K]>> };

export function landingQuoteDefinition(
  kind: LandingQuoteKind,
  currency: LandingQuoteCurrency,
  unit?: bigint,
  premium?: bigint,
): LandingQuoteDefinition {
  if (kind === "nftBuy" && (unit === undefined || premium === undefined)) {
    throw new Error("NFT buy needs the marketplace price.");
  }

  return {
    kind,
    currency,
    mode: kind === "defiSell" ? "exactInput" : "exactTarget",
    fameAmount:
      kind === "nftBuy"
        ? (unit as bigint) + (premium as bigint)
        : DEFI_FAME_AMOUNT,
    slippageBps: 0,
  };
}

export function landingExactTargetSearch(currency: LandingQuoteCurrency) {
  return {
    minimumInput: 1n,
    maximumInput:
      currency === "USDC" ? 100_000n * 10n ** 6n : 100n * 10n ** 18n,
    precision: currency === "USDC" ? 100n : 10n ** 10n,
    maxEvaluations: 48,
    maxRpcReads: 192,
  } as const;
}

export function cachedProjection<T>(
  key: string,
  producer: () => Promise<MarketProjection<T>>,
) {
  return unstable_cache(producer, ["fame-landing-prices-v5", key], {
    revalidate: MARKET_STATS_REVALIDATE_SECONDS,
  });
}

function productionAddresses() {
  const contracts = parseBaseGalleryForkContracts({
    marketplace: process.env.NEXT_PUBLIC_BASE_UNIVERSAL_MARKETPLACE_ADDRESS,
    checkout: process.env.NEXT_PUBLIC_BASE_FAME_CHECKOUT_ADDRESS,
    forkMode: process.env.NEXT_PUBLIC_FAME_FORK_MODE === "1",
  });
  if (!contracts)
    throw new Error("The Base marketplace address is not configured.");
  return galleryReadAddresses({
    ...BASE_GALLERY_ADDRESSES,
    gallery: contracts.marketplace,
  });
}

function token(
  address: typeof USDC | typeof NATIVE_ETH | FameSwapToken["address"],
) {
  const result = tokenForAddress(address);
  if (!result) throw new Error("Unsupported FAME quote token.");
  return result;
}

async function marketplaceProducer(): Promise<
  MarketProjection<MarketplacePriceDto>
> {
  const client = baseClient as unknown as GalleryMulticallClient;
  const blockNumber = await client.getBlockNumber();
  const state = await readMarketplaceLandingAuthority(
    client,
    blockNumber,
    productionAddresses(),
  );
  if (state.status !== "success") throw new Error(state.message);

  return {
    capturedAt: new Date().toISOString(),
    data: {
      premium: state.data.premium.toString(),
      unit: state.data.unit.toString(),
      totalSupply: state.data.totalSupply.toString(),
      totalProviderUnits: state.data.totalProviderUnits.toString(),
      decimals: state.data.decimals,
    },
  };
}

const getMarketplace = cachedProjection("marketplace", marketplaceProducer);

async function marketplacePrice() {
  const projection = await getMarketplace();
  return {
    unit: BigInt(projection.data.unit),
    premium: BigInt(projection.data.premium),
  };
}

function landingOptimizerBudgets() {
  return {
    maxTemplates: 4,
    maxTrialsPerTemplate: 4,
    maxLogicalQuoteRequests: 24,
    maxUniqueExactQuoteReads: 24,
    maxUniqueStateReads: 12,
    maxUnderlyingRpcReads: 64,
    timeoutMs: LANDING_QUOTE_TIMEOUT_MS,
  };
}

async function quoteProducer(
  kind: LandingQuoteKind,
  currency: LandingQuoteCurrency,
): Promise<MarketProjection<LandingQuoteDto>> {
  const market = kind === "nftBuy" ? await marketplacePrice() : undefined;
  const definition = landingQuoteDefinition(
    kind,
    currency,
    market?.unit,
    market?.premium,
  );
  const fame = token(FAME_SWAP_TOKENS[0].address);
  const asset = token(currency === "USDC" ? USDC : NATIVE_ETH);
  const tokenIn = definition.mode === "exactTarget" ? asset : fame;
  const tokenOut = definition.mode === "exactTarget" ? fame : asset;
  const dependencies = createProductionFameQuoteDependencies({
    requestTimeoutMs: LANDING_QUOTE_TIMEOUT_MS,
    responseCushionMs: 0,
  });
  const config = { ...getFameSwapConfig(), defaultSlippageBps: 0 };

  let amount: bigint;
  if (definition.mode === "exactTarget") {
    const search = landingExactTargetSearch(currency);
    const result = await quoteFameExactTarget(
      {
        tokenIn,
        tokenOut,
        targetOutput: definition.fameAmount,
        recipient: null,
        range: search,
        signal: AbortSignal.timeout(LANDING_QUOTE_TIMEOUT_MS),
        timeoutMs: LANDING_QUOTE_TIMEOUT_MS,
        maxEvaluations: search.maxEvaluations,
        maxRpcReads: search.maxRpcReads,
        slippageBps: definition.slippageBps,
      },
      {
        readinessForQuote: dependencies.readinessForQuote,
        createAdapter: async () => {
          const readiness = await dependencies.readinessForQuote(
            config.routerAddress,
          );
          if (!dependencies.createAdapter) {
            throw new Error("Quote adapter is unavailable.");
          }
          return await dependencies.createAdapter({
            tokenIn,
            tokenOut,
            amountIn: 1n,
            recipient: null,
            config,
            readiness,
            optimizerBudgets: undefined,
          });
        },
        config,
      },
    );
    if (result.status !== "ready") throw new Error(result.message);
    amount = result.amountIn;
  } else {
    const result = await quoteFameExactInput(
      {
        tokenIn,
        tokenOut,
        amountIn: definition.fameAmount,
        recipient: null,
        config,
        optimizerBudgets: landingOptimizerBudgets(),
      },
      dependencies,
    );
    if (result.status !== "ready") throw new Error(result.message);
    amount = result.minAmountOutAfterFee;
  }

  return {
    capturedAt: new Date().toISOString(),
    data: {
      amount: amount.toString(),
    },
  };
}

const getDefiBuyUsdc = cachedProjection("defi-buy-usdc", () =>
  quoteProducer("defiBuy", "USDC"),
);
const getDefiBuyEth = cachedProjection("defi-buy-eth", () =>
  quoteProducer("defiBuy", "ETH"),
);
const getDefiSellUsdc = cachedProjection("defi-sell-usdc", () =>
  quoteProducer("defiSell", "USDC"),
);
const getDefiSellEth = cachedProjection("defi-sell-eth", () =>
  quoteProducer("defiSell", "ETH"),
);
const getNftBuyUsdc = cachedProjection("nft-buy-usdc", () =>
  quoteProducer("nftBuy", "USDC"),
);
const getNftBuyEth = cachedProjection("nft-buy-eth", () =>
  quoteProducer("nftBuy", "ETH"),
);

async function depthProducer(
  side: "buy" | "sell",
): Promise<MarketProjection<DepthDto>> {
  const market = await marketplacePrice();
  const ladder =
    side === "buy" ? BUY_DEPTH_LADDER_USDC : SELL_DEPTH_LADDER_FAME;
  const input = token(side === "buy" ? USDC : FAME_SWAP_TOKENS[0].address);
  const output = token(side === "buy" ? FAME_SWAP_TOKENS[0].address : USDC);
  const config = { ...getFameSwapConfig(), defaultSlippageBps: 0 };
  const dependencies = createProductionFameQuoteDependencies({
    requestTimeoutMs: LANDING_QUOTE_TIMEOUT_MS,
    responseCushionMs: 0,
  });
  const readiness = await dependencies.readinessForQuote(config.routerAddress);
  if (!dependencies.createAdapter) {
    throw new Error("Depth quote adapter is unavailable.");
  }
  const adapter = await dependencies.createAdapter({
    tokenIn: input,
    tokenOut: output,
    amountIn: 1n,
    recipient: null,
    config,
    readiness,
    optimizerBudgets: undefined,
  });
  const pinnedDependencies = {
    readinessForQuote: async () => readiness,
    createAdapter: async () => adapter,
  };
  const quote = async (amountIn: bigint) => {
    const result = await quoteFameExactInput(
      {
        tokenIn: input,
        tokenOut: output,
        amountIn,
        recipient: null,
        config,
        optimizerBudgets: landingOptimizerBudgets(),
      },
      pinnedDependencies,
    );
    if (result.status !== "ready") {
      throw new Error("Depth quote is unavailable.");
    }
    return { input: amountIn, output: result.minAmountOutAfterFee };
  };

  const reference = await quote(side === "buy" ? 10n ** 6n : market.unit);
  const candidates = await mapBounded(
    ladder,
    LIQUIDITY_LADDER_CONCURRENCY,
    quote,
  );
  const depth = executableDepth(
    reference,
    candidates,
    input.decimals,
    output.decimals,
  );
  if (!depth) throw new Error("Depth is unavailable.");
  return {
    capturedAt: new Date().toISOString(),
    data: {
      amount: (side === "buy" ? depth.input : depth.output).toString(),
      atLeast: depth.atLeast,
    },
  };
}

const getBuyDepth = cachedProjection("buy-depth", () => depthProducer("buy"));
const getSellDepth = cachedProjection("sell-depth", () =>
  depthProducer("sell"),
);

export async function getCachedMarketStats(
  now = Date.now(),
): Promise<LandingMarketStats> {
  return await composeMarketProjections(
    {
      marketplace: getMarketplace,
      defiBuyUsdc: getDefiBuyUsdc,
      defiBuyEth: getDefiBuyEth,
      defiSellUsdc: getDefiSellUsdc,
      defiSellEth: getDefiSellEth,
      nftBuyUsdc: getNftBuyUsdc,
      nftBuyEth: getNftBuyEth,
      buyDepth: getBuyDepth,
      sellDepth: getSellDepth,
    },
    now,
  );
}

export async function composeMarketProjections<
  T extends Record<string, () => Promise<MarketProjection<unknown>>>,
>(
  producers: T,
  now = Date.now(),
  timeoutMs = MARKET_STATS_COMPOSITION_TIMEOUT_MS,
): Promise<ProjectionStates<T>> {
  const deadlineReached = Symbol("market-price-deadline");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<typeof deadlineReached>((resolve) => {
    timer = setTimeout(() => resolve(deadlineReached), timeoutMs);
  });
  try {
    const keys = Object.keys(producers) as Array<keyof T>;
    const settled = await Promise.all(
      keys.map((key) =>
        Promise.race([
          Promise.resolve()
            .then(() => producers[key]!())
            .then(
              (value) => ({ status: "fulfilled", value }) as const,
              () => ({ status: "rejected" }) as const,
            ),
          deadline,
        ]),
      ),
    );

    return Object.fromEntries(
      keys.map((key, index) => {
        const result = settled[index]!;
        if (result === deadlineReached || result.status !== "fulfilled") {
          return [
            key,
            { status: "unavailable", reason: "Market prices are loading." },
          ];
        }
        const freshness = marketFreshness(result.value.capturedAt, now);
        return freshness === "unavailable"
          ? [
              key,
              { status: "unavailable", reason: "Market prices are loading." },
            ]
          : [key, { status: "available", freshness, value: result.value }];
      }),
    ) as ProjectionStates<T>;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

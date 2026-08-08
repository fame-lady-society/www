import type {
  LandingMarketStats,
  LandingQuoteDto,
  MarketProjectionState,
  MarketplacePriceDto,
} from "./cachedMarketStats";
import { DEFI_FAME_AMOUNT, type DepthDto } from "./cachedMarketStats";

export type PriceValue = Readonly<{ value: string | null }>;
export type LandingPriceRow = Readonly<{
  fame: string | null;
  USDC: PriceValue;
  ETH: PriceValue;
}>;
export type LandingPrices = Readonly<{
  defiBuy: LandingPriceRow;
  defiSell: LandingPriceRow;
  nftBuy: LandingPriceRow;
}>;
export type LandingMetrics = Readonly<{
  marketCap: PriceValue;
  liquidity: PriceValue;
  buyDepth: PriceValue;
  sellDepth: PriceValue;
}>;
export type LandingMarketPresentation = Readonly<{
  prices: LandingPrices;
  metrics: LandingMetrics;
}>;

function grouped(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function compactAmount(amount: bigint, base: bigint): string | null {
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  if (absolute < 1_000n * base) return null;

  let divisor = 1_000n * base;
  let suffix = "K";
  if (absolute >= 1_000_000n * base) {
    divisor = 1_000_000n * base;
    suffix = "M";
  }

  let tenths = (absolute * 10n + divisor / 2n) / divisor;
  if (suffix === "K" && tenths >= 10_000n) {
    divisor = 1_000_000n * base;
    suffix = "M";
    tenths = (absolute * 10n + divisor / 2n) / divisor;
  }

  const whole = tenths / 10n;
  const fraction = tenths % 10n;
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}${suffix}`;
}

export function formatPrice(
  amount: bigint,
  decimals: number,
  symbol: "FAME" | "USDC" | "ETH",
): string {
  const base = 10n ** BigInt(decimals);
  const compact = compactAmount(amount, base);
  if (compact) return `${compact} ${symbol}`;

  const whole = amount / base;
  const fullFraction = (amount % base).toString().padStart(decimals, "0");
  const firstNonzero = fullFraction.search(/[1-9]/u);
  const normalDigits = symbol === "ETH" ? 6 : symbol === "USDC" ? 6 : 2;
  const visibleDigits =
    firstNonzero >= normalDigits
      ? Math.min(decimals, firstNonzero + 4)
      : Math.min(decimals, normalDigits);
  const fraction = fullFraction.slice(0, visibleDigits).replace(/0+$/u, "");
  return `${grouped(whole)}${fraction ? `.${fraction}` : ""} ${symbol}`;
}

const DEFI_FAME_LABEL = formatPrice(DEFI_FAME_AMOUNT, 18, "FAME");

function quoteValue(
  state: MarketProjectionState<LandingQuoteDto>,
  currency: "USDC" | "ETH",
): PriceValue {
  if (state.status !== "available") return { value: null };
  const quote = state.value.data;
  return {
    value: formatPrice(
      BigInt(quote.amount),
      currency === "USDC" ? 6 : 18,
      currency,
    ),
  };
}

function marketplaceFame(
  state: MarketProjectionState<MarketplacePriceDto>,
): string | null {
  if (state.status !== "available") return null;
  const market = state.value.data;
  return formatPrice(
    BigInt(market.unit) + BigInt(market.premium),
    market.decimals,
    "FAME",
  );
}

export function presentLandingPrices(stats: LandingMarketStats): LandingPrices {
  return {
    defiBuy: {
      fame: DEFI_FAME_LABEL,
      USDC: quoteValue(stats.defiBuyUsdc, "USDC"),
      ETH: quoteValue(stats.defiBuyEth, "ETH"),
    },
    defiSell: {
      fame: DEFI_FAME_LABEL,
      USDC: quoteValue(stats.defiSellUsdc, "USDC"),
      ETH: quoteValue(stats.defiSellEth, "ETH"),
    },
    nftBuy: {
      fame: marketplaceFame(stats.marketplace),
      USDC: quoteValue(stats.nftBuyUsdc, "USDC"),
      ETH: quoteValue(stats.nftBuyEth, "ETH"),
    },
  };
}

function metric(value: string | null): PriceValue {
  return { value };
}

function depthValue(
  state: MarketProjectionState<DepthDto>,
  decimals: number,
  symbol: "FAME" | "USDC",
): PriceValue {
  if (state.status !== "available") return metric(null);
  const value = formatPrice(BigInt(state.value.data.amount), decimals, symbol);
  return metric(state.value.data.atLeast ? `${value}+` : value);
}

export function presentLandingMetrics(
  stats: LandingMarketStats,
): LandingMetrics {
  const market =
    stats.marketplace.status === "available"
      ? stats.marketplace.value.data
      : null;
  const buyUsdc =
    stats.defiBuyUsdc.status === "available"
      ? BigInt(stats.defiBuyUsdc.value.data.amount)
      : null;
  const sellUsdc =
    stats.defiSellUsdc.status === "available"
      ? BigInt(stats.defiSellUsdc.value.data.amount)
      : null;
  const marketCap =
    market && buyUsdc !== null && sellUsdc !== null
      ? ((buyUsdc + sellUsdc) * BigInt(market.totalSupply)) /
        (2n * DEFI_FAME_AMOUNT)
      : null;
  const liquidity = market
    ? BigInt(market.totalProviderUnits) * BigInt(market.unit)
    : null;

  return {
    marketCap: metric(
      marketCap === null ? null : formatPrice(marketCap, 6, "USDC"),
    ),
    liquidity: metric(
      market && liquidity !== null
        ? formatPrice(liquidity, market.decimals, "FAME")
        : null,
    ),
    buyDepth: depthValue(stats.buyDepth, 6, "USDC"),
    sellDepth: depthValue(stats.sellDepth, 6, "USDC"),
  };
}

export function presentLandingMarket(
  stats: LandingMarketStats,
): LandingMarketPresentation {
  return {
    prices: presentLandingPrices(stats),
    metrics: presentLandingMetrics(stats),
  };
}

export function emptyLandingPrices(): LandingPrices {
  const empty = { value: null };
  return {
    defiBuy: { fame: DEFI_FAME_LABEL, USDC: empty, ETH: empty },
    defiSell: { fame: DEFI_FAME_LABEL, USDC: empty, ETH: empty },
    nftBuy: { fame: null, USDC: empty, ETH: empty },
  };
}

export function emptyLandingMarket(): LandingMarketPresentation {
  const empty = { value: null };
  return {
    prices: emptyLandingPrices(),
    metrics: {
      marketCap: empty,
      liquidity: empty,
      buyDepth: empty,
      sellDepth: empty,
    },
  };
}

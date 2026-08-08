import type {
  LandingMarketStats,
  LandingQuoteDto,
  MarketProjectionState,
  MarketplacePriceDto,
} from "./cachedMarketStats";
import { DEFI_FAME_AMOUNT } from "./cachedMarketStats";

export type PriceValue = Readonly<{ value: string | null }>;
export type LandingCurrencyValues = Readonly<{
  USDC: PriceValue;
  ETH: PriceValue;
}>;
export type LandingPriceRow = Readonly<
  LandingCurrencyValues & {
    fame: string | null;
  }
>;
export type LandingPrices = Readonly<{
  defiBuy: LandingPriceRow;
  defiSell: LandingPriceRow;
  nftBuy: LandingPriceRow;
}>;
export type LandingMarketPresentation = Readonly<{
  prices: LandingPrices;
  marketCap: LandingCurrencyValues;
  marketplaceSupply: string | null;
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
  maximumFractionDigits = symbol === "USDC" ? 2 : symbol === "ETH" ? 3 : 2,
): string {
  const base = 10n ** BigInt(decimals);
  const compact = compactAmount(amount, base);
  if (compact) return `${compact} ${symbol}`;

  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const visibleDigits = Math.min(decimals, maximumFractionDigits);
  const discardedBase = 10n ** BigInt(decimals - visibleDigits);
  const rounded = (absolute + discardedBase / 2n) / discardedBase;
  if (absolute > 0n && rounded === 0n) {
    return `<0.${"0".repeat(Math.max(0, visibleDigits - 1))}1 ${symbol}`;
  }

  const visibleBase = 10n ** BigInt(visibleDigits);
  const whole = rounded / visibleBase;
  const fraction = (rounded % visibleBase)
    .toString()
    .padStart(visibleDigits, "0")
    .replace(/0+$/u, "");
  return `${negative ? "-" : ""}${grouped(whole)}${fraction ? `.${fraction}` : ""} ${symbol}`;
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
  const amount = BigInt(market.unit) + BigInt(market.premium);
  const million = 10n ** BigInt(market.decimals + 6);
  const whole = amount / million;
  const fraction = (amount % million)
    .toString()
    .padStart(market.decimals + 6, "0")
    .replace(/0+$/u, "");

  return `${whole}${fraction ? `.${fraction}` : ""}M FAME`;
}

function marketplaceSupply(
  state: MarketProjectionState<MarketplacePriceDto>,
): string | null {
  if (state.status !== "available") return null;
  const market = state.value.data;
  return formatPrice(BigInt(market.totalSupply), market.decimals, "FAME");
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

function marketCapValue(
  totalSupply: bigint | null,
  buy: MarketProjectionState<LandingQuoteDto>,
  sell: MarketProjectionState<LandingQuoteDto>,
  currency: "USDC" | "ETH",
): PriceValue {
  if (
    totalSupply === null ||
    buy.status !== "available" ||
    sell.status !== "available"
  ) {
    return { value: null };
  }

  const amount =
    ((BigInt(buy.value.data.amount) + BigInt(sell.value.data.amount)) *
      totalSupply) /
    (2n * DEFI_FAME_AMOUNT);
  return {
    value: formatPrice(amount, currency === "USDC" ? 6 : 18, currency, 1),
  };
}

export function presentLandingMarketCap(
  stats: LandingMarketStats,
): LandingCurrencyValues {
  const totalSupply =
    stats.marketplace.status === "available"
      ? BigInt(stats.marketplace.value.data.totalSupply)
      : null;

  return {
    USDC: marketCapValue(
      totalSupply,
      stats.defiBuyUsdc,
      stats.defiSellUsdc,
      "USDC",
    ),
    ETH: marketCapValue(
      totalSupply,
      stats.defiBuyEth,
      stats.defiSellEth,
      "ETH",
    ),
  };
}

export function presentLandingMarket(
  stats: LandingMarketStats,
): LandingMarketPresentation {
  return {
    prices: presentLandingPrices(stats),
    marketCap: presentLandingMarketCap(stats),
    marketplaceSupply: marketplaceSupply(stats.marketplace),
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
    marketCap: { USDC: empty, ETH: empty },
    marketplaceSupply: null,
  };
}

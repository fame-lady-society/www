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
    value: formatPrice(amount, currency === "USDC" ? 6 : 18, currency),
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
  };
}

import type {
  LandingMarketStats,
  LandingQuoteDto,
  MarketProjectionState,
  MarketplacePriceDto,
} from "./cachedMarketStats";

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

const DEFI_FAME_LABEL = "1,000,000 FAME";

function grouped(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatPrice(
  amount: bigint,
  decimals: number,
  symbol: "FAME" | "USDC" | "ETH",
): string {
  const base = 10n ** BigInt(decimals);
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

export function emptyLandingPrices(): LandingPrices {
  const empty = { value: null };
  return {
    defiBuy: { fame: DEFI_FAME_LABEL, USDC: empty, ETH: empty },
    defiSell: { fame: DEFI_FAME_LABEL, USDC: empty, ETH: empty },
    nftBuy: { fame: null, USDC: empty, ETH: empty },
  };
}

import {
  FAME_LANDING_COUNTER_ASSETS,
  type FameLandingFieldState,
  type FameLandingMarketplaceValue,
  type FameLandingQuoteValue,
  type FameLandingSnapshot,
} from "./snapshot";

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
export type LandingLiquidity = Readonly<{
  fame: PriceValue;
  counterAssets: ReadonlyArray<{
    address: string;
    label: string;
    value: string | null;
  }>;
}>;
export type LandingMarketPresentation = Readonly<{
  prices: LandingPrices;
  marketCap: LandingCurrencyValues;
  marketplaceSupply: string | null;
  liquidity: LandingLiquidity;
}>;

const DEFI_FAME_AMOUNT = 1_000_000n * 10n ** 18n;

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
  symbol: string,
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
  state: FameLandingFieldState<FameLandingQuoteValue>,
  currency: "USDC" | "ETH",
): PriceValue {
  if (state.status !== "available") return { value: null };
  return {
    value: formatPrice(
      BigInt(state.value.amount),
      currency === "USDC" ? 6 : 18,
      currency,
    ),
  };
}

function marketplaceFame(
  state: FameLandingFieldState<FameLandingMarketplaceValue>,
): string | null {
  if (state.status !== "available") return null;
  const market = state.value;
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
  state: FameLandingFieldState<FameLandingMarketplaceValue>,
): string | null {
  if (state.status !== "available") return null;
  return formatPrice(
    BigInt(state.value.totalSupply),
    state.value.decimals,
    "FAME",
  );
}

function marketCapValue(
  totalSupply: bigint | null,
  buy: FameLandingFieldState<FameLandingQuoteValue>,
  sell: FameLandingFieldState<FameLandingQuoteValue>,
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
    ((BigInt(buy.value.amount) + BigInt(sell.value.amount)) * totalSupply) /
    (2n * DEFI_FAME_AMOUNT);
  return {
    value: formatPrice(amount, currency === "USDC" ? 6 : 18, currency, 1),
  };
}

function presentLiquidity(snapshot: FameLandingSnapshot): LandingLiquidity {
  const state = snapshot.fields.liquidity;
  if (state.status !== "available") return emptyLandingLiquidity();
  const byAddress = new Map(
    state.value.counterAssets.map((asset) => [
      asset.address.toLowerCase(),
      asset,
    ]),
  );
  return {
    fame: { value: formatPrice(BigInt(state.value.fameAmount), 18, "FAME") },
    counterAssets: FAME_LANDING_COUNTER_ASSETS.map((metadata) => {
      const asset = byAddress.get(metadata.address.toLowerCase());
      return {
        address: metadata.address,
        label: metadata.symbol,
        value: asset
          ? formatPrice(BigInt(asset.amount), asset.decimals, asset.symbol)
          : null,
      };
    }),
  };
}

function emptyLandingLiquidity(): LandingLiquidity {
  return {
    fame: { value: null },
    counterAssets: FAME_LANDING_COUNTER_ASSETS.map((asset) => ({
      address: asset.address,
      label: asset.symbol,
      value: null,
    })),
  };
}

export function presentLandingMarket(
  snapshot: FameLandingSnapshot,
): LandingMarketPresentation {
  const { marketplace, quotes } = snapshot.fields;
  const totalSupply =
    marketplace.status === "available"
      ? BigInt(marketplace.value.totalSupply)
      : null;

  return {
    prices: {
      defiBuy: {
        fame: DEFI_FAME_LABEL,
        USDC: quoteValue(quotes.defiBuyUsdc, "USDC"),
        ETH: quoteValue(quotes.defiBuyEth, "ETH"),
      },
      defiSell: {
        fame: DEFI_FAME_LABEL,
        USDC: quoteValue(quotes.defiSellUsdc, "USDC"),
        ETH: quoteValue(quotes.defiSellEth, "ETH"),
      },
      nftBuy: {
        fame: marketplaceFame(marketplace),
        USDC: quoteValue(quotes.nftBuyUsdc, "USDC"),
        ETH: quoteValue(quotes.nftBuyEth, "ETH"),
      },
    },
    marketCap: {
      USDC: marketCapValue(
        totalSupply,
        quotes.defiBuyUsdc,
        quotes.defiSellUsdc,
        "USDC",
      ),
      ETH: marketCapValue(
        totalSupply,
        quotes.defiBuyEth,
        quotes.defiSellEth,
        "ETH",
      ),
    },
    marketplaceSupply: marketplaceSupply(marketplace),
    liquidity: presentLiquidity(snapshot),
  };
}

export function emptyLandingMarket(): LandingMarketPresentation {
  const empty = { value: null };
  return {
    prices: {
      defiBuy: { fame: DEFI_FAME_LABEL, USDC: empty, ETH: empty },
      defiSell: { fame: DEFI_FAME_LABEL, USDC: empty, ETH: empty },
      nftBuy: { fame: null, USDC: empty, ETH: empty },
    },
    marketCap: { USDC: empty, ETH: empty },
    marketplaceSupply: null,
    liquidity: emptyLandingLiquidity(),
  };
}

import Link from "next/link";
import type {
  MarketProjectionState,
  MarketplaceAuthorityDto,
  QuoteDto,
  DepthDto,
} from "../cachedMarketStats";
import { FameLandingMenu } from "./FameLandingMenu";
import {
  FameMarketBoard,
  type CurrencyBoard,
  type DisplayState,
} from "./FameMarketBoard";
import { FameSwapAccordion } from "./FameSwapAccordion";
import { multiply, normalize, validatedUsdcMidpoint, type Rational } from "../marketStats";

type Stats = Record<
  | "marketplace"
  | "usdcBuy"
  | "usdcSell"
  | "ethBuy"
  | "ethSell"
  | "buyDepth"
  | "sellDepth",
  MarketProjectionState<unknown>
>;
const number = (amount: string, decimals: number, symbol: string) =>
  `${Number(amount) / 10 ** decimals} ${symbol}`;
function rational(value: Rational): string {
  const scale = 100n;
  const scaled = (value.numerator * scale) / value.denominator;
  return `${scaled / scale}.${(scaled % scale).toString().padStart(2, "0")}`;
}
const unavailable = (state: MarketProjectionState<unknown>): DisplayState => ({
  value: null,
  note:
    state.status === "unavailable"
      ? state.reason
      : "Market data is unavailable.",
});
function quote(
  state: MarketProjectionState<unknown>,
  symbol: "USDC" | "ETH",
): DisplayState {
  if (state.status !== "available") return unavailable(state);
  const data = state.value.data as QuoteDto;
  return {
    value: number(
      data.side === "buy" ? data.amount : data.protectedAmount,
      symbol === "USDC" ? 6 : 18,
      symbol,
    ),
    note: `${state.freshness === "stale" ? "Cached and stale. " : "Cached indicative price. "}${data.side === "buy" ? "Exact purchase input." : "Protected sale output."}`,
    asOf: state.value.capturedAt,
  };
}
function fame(
  market: MarketProjectionState<unknown>,
  side: "buy" | "sell",
): DisplayState {
  if (market.status !== "available") return unavailable(market);
  const data = market.value.data as MarketplaceAuthorityDto;
  if (side === "buy" && data.paused)
    return { value: null, note: "Purchases are paused." };
  if (side === "buy" && data.inventory === "0")
    return { value: null, note: "Marketplace inventory is empty." };
  const raw =
    side === "buy"
      ? BigInt(data.unit) + BigInt(data.premium)
      : BigInt(data.unit);
  return {
    value: number(raw.toString(), data.decimals, "FAME"),
    note: `${market.freshness === "stale" ? "Cached and stale. " : "Cached indicative price. "}${side === "buy" ? "Unit plus purchase charge." : "Current Society unit."}`,
    asOf: market.value.capturedAt,
  };
}
function stat(
  state: MarketProjectionState<unknown>,
  label: string,
  formatter: (value: any) => string,
) {
  if (state.status !== "available")
    return { label, value: "Unavailable", note: state.reason };
  return {
    label,
    value: formatter(state.value.data),
    note: `${state.freshness === "stale" ? "Cached and stale" : "Cached"} · ${new Date(state.value.capturedAt).toLocaleString()}`,
  };
}
export function FameLandingPage({ stats }: { stats: Stats }) {
  const board: CurrencyBoard = {
    FAME: {
      buy: fame(stats.marketplace, "buy"),
      sell: fame(stats.marketplace, "sell"),
    },
    USDC: {
      buy: quote(stats.usdcBuy, "USDC"),
      sell: quote(stats.usdcSell, "USDC"),
    },
    ETH: { buy: quote(stats.ethBuy, "ETH"), sell: quote(stats.ethSell, "ETH") },
  };
  const market =
    stats.marketplace.status === "available"
      ? (stats.marketplace.value.data as MarketplaceAuthorityDto)
      : null;
  const usdcMidpoint =
    market && stats.usdcBuy.status === "available" && stats.usdcSell.status === "available"
      ? validatedUsdcMidpoint({
          buyInput: BigInt((stats.usdcBuy.value.data as QuoteDto).amount),
          buyFame: BigInt(market.unit) + BigInt(market.premium),
          sellOutput: BigInt((stats.usdcSell.value.data as QuoteDto).protectedAmount),
          sellFame: BigInt(market.unit),
          fameDecimals: market.decimals,
          buyCapturedAt: stats.usdcBuy.value.capturedAt,
          sellCapturedAt: stats.usdcSell.value.capturedAt,
          buyBlockNumber: stats.usdcBuy.value.blockNumber ? BigInt(stats.usdcBuy.value.blockNumber) : undefined,
          sellBlockNumber: stats.usdcSell.value.blockNumber ? BigInt(stats.usdcSell.value.blockNumber) : undefined,
        })
      : null;
  const marketCap = multiply(usdcMidpoint, market ? normalize(BigInt(market.totalSupply), market.decimals) : null);
  const rail = [
    stat(stats.usdcBuy, "FAME reference price", () =>
      stats.usdcSell.status === "available" ? "USDC midpoint" : "Unavailable",
    ),
    {
      label: "Total-supply market cap",
      value: marketCap ? `${rational(marketCap)} USDC` : "Unavailable",
      note: marketCap
        ? "totalSupply × validated USDC midpoint"
        : "A coherent USDC midpoint is unavailable.",
    },
    stat(
      stats.buyDepth,
      "Buy depth",
      (value: DepthDto) => `${number(value.amount, 6, "USDC")} within 2%`,
    ),
    stat(
      stats.sellDepth,
      "Sell depth",
      (value: DepthDto) =>
        `${number(value.amount, market?.decimals ?? 18, "FAME")} within 2%`,
    ),
    stat(
      stats.marketplace,
      "Society staked",
      (value: MarketplaceAuthorityDto) =>
        number(value.totalProviderUnits, value.decimals, "FAME"),
    ),
  ];
  const acquisition = Boolean(
    market && !market.paused && BigInt(market.inventory) > 0n,
  );
  return (
    <main className="fame-landing min-h-screen bg-black px-4 py-5 text-[#fff5d8] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <Link
            href="/fame"
            className="text-lg font-bold tracking-[.2em] text-[#f5d46d]"
          >
            FAME
          </Link>
          <FameLandingMenu />
        </header>
        <p className="mb-2 text-sm uppercase tracking-[.2em] text-[#c6b98b]">
          FAME on Base
        </p>
        <h1 className="mb-8 text-4xl font-semibold">FAME Society market</h1>
        <FameMarketBoard currencies={board} />
        <section
          aria-label="Market context"
          className="my-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          {rail.map((item) => (
            <article key={item.label} className="border border-[#685a2b] p-3">
              <h2 className="text-xs uppercase tracking-wide text-[#c6b98b]">
                {item.label}
              </h2>
              <p className="mt-2 font-semibold">{item.value}</p>
              <p className="mt-1 text-xs text-[#a99d76]">{item.note}</p>
            </article>
          ))}
        </section>
        <p className="mb-4 text-sm text-[#c6b98b]">
          Inventory {market?.inventory ?? "unavailable"} · Purchase charge{" "}
          {market
            ? number(market.premium, market.decimals, "FAME")
            : "unavailable"}{" "}
          ·{" "}
          {market?.paused
            ? "Purchases paused"
            : "Purchase state unavailable or open"}
        </p>
        <FameSwapAccordion />
        <nav
          aria-label="FAME destinations"
          className="mt-8 grid gap-3 md:grid-cols-3"
        >
          <Link
            href="/fame/market"
            className="border border-[#f5d46d] p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5d46d]"
          >
            <h2 className="font-semibold text-[#f5d46d]">FAME Marketplace</h2>
            <p className="mt-2 text-sm text-[#c6b98b]">
              {acquisition
                ? "Browse and acquire available FAME Society NFTs."
                : "Browse the FAME Society marketplace."}
            </p>
          </Link>
          <Link
            href="/fame/gallery"
            className="border border-[#8e762c] p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5d46d]"
          >
            <h2 className="font-semibold">FAME Gallery</h2>
            <p className="mt-2 text-sm text-[#c6b98b]">
              Browse the public collection.
            </p>
          </Link>
          <Link
            href="/fame/rotate"
            className="border border-[#8e762c] p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5d46d]"
          >
            <h2 className="font-semibold">Rotator</h2>
            <p className="mt-2 text-sm text-[#c6b98b]">
              Choose a waiting artwork visually.
            </p>
          </Link>
        </nav>
      </div>
    </main>
  );
}

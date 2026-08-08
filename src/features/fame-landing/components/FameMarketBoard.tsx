"use client";

import { useEffect, useState } from "react";
import type {
  LandingCurrencyValues,
  LandingMarketPresentation,
  LandingPriceRow,
} from "../pricePresentation";

const RETRY_DELAYS_MS = [5_000, 10_000, 20_000, 30_000] as const;

type RetryTimer = ReturnType<typeof setTimeout>;
type MarketRequest = (
  signal: AbortSignal,
) => Promise<LandingMarketPresentation | null>;

async function requestLandingMarket(
  signal: AbortSignal,
): Promise<LandingMarketPresentation | null> {
  const response = await fetch("/api/fame/market-prices", {
    cache: "no-store",
    signal,
  });
  return response.ok
    ? ((await response.json()) as LandingMarketPresentation)
    : null;
}

export function startMarketRefresh({
  onMarket,
  request = requestLandingMarket,
  schedule = (run, delayMs) => setTimeout(run, delayMs),
  cancel = (timer) => clearTimeout(timer),
}: {
  onMarket: (market: LandingMarketPresentation) => boolean;
  request?: MarketRequest;
  schedule?: (run: () => Promise<void>, delayMs: number) => RetryTimer;
  cancel?: (timer: RetryTimer) => void;
}): () => void {
  let stopped = false;
  let timer: RetryTimer | undefined;
  let attempt = 0;
  const controller = new AbortController();

  const refresh = async () => {
    if (stopped) return;
    let complete = false;
    try {
      const next = await request(controller.signal);
      if (next && !stopped) complete = onMarket(next);
    } catch {
      // A later attempt can recover from a transient quote-service failure.
    } finally {
      if (!stopped && !complete) {
        attempt += 1;
        timer = schedule(
          refresh,
          RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]!,
        );
      }
    }
  };

  timer = schedule(refresh, RETRY_DELAYS_MS[attempt]);
  return () => {
    stopped = true;
    controller.abort();
    if (timer) cancel(timer);
  };
}

function Loading() {
  return (
    <span
      aria-label="Loading"
      role="status"
      className="fame-skeleton inline-block h-4 w-20 rounded-sm"
    />
  );
}

function PriceCard({
  title,
  row,
}: {
  title: string;
  row: LandingPriceRow;
}) {
  return (
    <article className="grid gap-5 border-t border-[#c9aa67]/25 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c9aa67]">
          {title}
        </p>
        <div className="fame-display mt-3 text-2xl tabular-nums">
          {row.fame ?? <Loading />}
        </div>
      </div>
      <dl className="grid min-w-44 gap-2 text-sm">
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#9f9789]">USDC</dt>
          <dd>
            {row.USDC.value ? (
              <span className="font-medium tabular-nums">{row.USDC.value}</span>
            ) : (
              <Loading />
            )}
          </dd>
        </div>
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#9f9789]">ETH</dt>
          <dd>
            {row.ETH.value ? (
              <span className="font-medium tabular-nums">{row.ETH.value}</span>
            ) : (
              <Loading />
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function MarketplaceCard({
  row,
}: {
  row: LandingPriceRow;
}) {
  return (
    <article className="flex h-full min-h-64 flex-col justify-between bg-[#c9aa67] p-6 text-[#0d0c0a] sm:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d0c0a]/70">
          Marketplace
        </p>
        <h3 className="fame-display mt-5 text-3xl sm:text-4xl">
          Any 1 Society NFT
        </h3>
      </div>
      <dl className="mt-10 grid gap-2 border-t border-[#0d0c0a]/20 pt-5 text-sm">
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#0d0c0a]/65">FAME</dt>
          <dd>
            {row.fame ? (
              <span className="font-medium tabular-nums">{row.fame}</span>
            ) : (
              <Loading />
            )}
          </dd>
        </div>
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#0d0c0a]/65">USDC</dt>
          <dd>
            {row.USDC.value ? (
              <span className="font-medium tabular-nums">{row.USDC.value}</span>
            ) : (
              <Loading />
            )}
          </dd>
        </div>
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#0d0c0a]/65">ETH</dt>
          <dd>
            {row.ETH.value ? (
              <span className="font-medium tabular-nums">{row.ETH.value}</span>
            ) : (
              <Loading />
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function MarketCapCard({
  values,
  supply,
}: {
  values: LandingCurrencyValues;
  supply: string | null;
}) {
  return (
    <article className="grid gap-5 border-t border-[#c9aa67]/25 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c9aa67]">
          Market cap
        </p>
        <div className="fame-display mt-3 text-2xl tabular-nums">
          {supply ?? <Loading />}
        </div>
      </div>
      <dl className="grid min-w-44 gap-2 text-sm">
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#9f9789]">USDC</dt>
          <dd>
            {values.USDC.value ? (
              <span className="font-medium tabular-nums">
                {values.USDC.value}
              </span>
            ) : (
              <Loading />
            )}
          </dd>
        </div>
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#9f9789]">ETH</dt>
          <dd>
            {values.ETH.value ? (
              <span className="font-medium tabular-nums">
                {values.ETH.value}
              </span>
            ) : (
              <Loading />
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function missing(market: LandingMarketPresentation): boolean {
  return (
    Object.values(market.prices).some(
      (row) => !row.fame || !row.USDC.value || !row.ETH.value,
    ) ||
    !market.marketCap.USDC.value ||
    !market.marketCap.ETH.value ||
    !market.marketplaceSupply
  );
}

export function mergeLandingMarket(
  current: LandingMarketPresentation,
  next: LandingMarketPresentation,
): LandingMarketPresentation {
  const prices = Object.fromEntries(
    (Object.keys(current.prices) as Array<keyof typeof current.prices>).map(
      (key) => {
        const oldRow = current.prices[key];
        const newRow = next.prices[key];
        return [
          key,
          {
            fame: newRow.fame ?? oldRow.fame,
            USDC: { value: newRow.USDC.value ?? oldRow.USDC.value },
            ETH: { value: newRow.ETH.value ?? oldRow.ETH.value },
          },
        ];
      },
    ),
  ) as LandingMarketPresentation["prices"];
  const merged: LandingMarketPresentation = {
    prices,
    marketCap: {
      USDC: {
        value: next.marketCap.USDC.value ?? current.marketCap.USDC.value,
      },
      ETH: {
        value: next.marketCap.ETH.value ?? current.marketCap.ETH.value,
      },
    },
    marketplaceSupply: next.marketplaceSupply ?? current.marketplaceSupply,
  };
  return JSON.stringify(merged) === JSON.stringify(current) ? current : merged;
}

export function FameMarketBoard({
  initialMarket,
}: {
  initialMarket: LandingMarketPresentation;
}) {
  const [market, setMarket] = useState(initialMarket);
  const needsMarket = missing(market);

  useEffect(() => {
    if (!needsMarket) return;
    let latestMarket = initialMarket;
    return startMarketRefresh({
      onMarket: (next) => {
        latestMarket = mergeLandingMarket(latestMarket, next);
        setMarket(latestMarket);
        return !missing(latestMarket);
      },
    });
  }, [initialMarket, needsMarket]);

  return (
    <section
      aria-label="FAME market"
      className="bg-[#11100d] p-5 sm:p-8 lg:p-10"
    >
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="fame-kicker">Market on Base</p>
          <h2 className="fame-display mt-2 text-4xl sm:text-5xl">
            At a glance
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-6 text-[#9f9789]">
          Live reference prices across the token and Society marketplace.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <MarketplaceCard row={market.prices.nftBuy} />
        </div>
        <div className="lg:col-span-7">
          <MarketCapCard
            values={market.marketCap}
            supply={market.marketplaceSupply}
          />
          <PriceCard title="DeFi buy" row={market.prices.defiBuy} />
          <PriceCard title="DeFi sell" row={market.prices.defiSell} />
        </div>
      </div>
    </section>
  );
}

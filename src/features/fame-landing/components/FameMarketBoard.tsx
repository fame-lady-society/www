"use client";

import { useEffect, useState } from "react";
import type {
  LandingMarketPresentation,
  LandingPriceRow,
  PriceValue,
} from "../pricePresentation";

const RETRY_MS = 5_000;
const INITIAL_RETRY_MS = 500;

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
  onMarket: (market: LandingMarketPresentation) => void;
  request?: MarketRequest;
  schedule?: (run: () => Promise<void>, delayMs: number) => RetryTimer;
  cancel?: (timer: RetryTimer) => void;
}): () => void {
  let stopped = false;
  let timer: RetryTimer | undefined;
  const controller = new AbortController();

  const refresh = async () => {
    if (stopped) return;
    try {
      const next = await request(controller.signal);
      if (next && !stopped) onMarket(next);
    } catch {
      // Keep the activity indicator moving and try again.
    } finally {
      if (!stopped) timer = schedule(refresh, RETRY_MS);
    }
  };

  timer = schedule(refresh, INITIAL_RETRY_MS);
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

function Value({ value }: { value: PriceValue }) {
  return value.value ? (
    <span className="font-medium tabular-nums text-[#f4eee2]">
      {value.value}
    </span>
  ) : (
    <Loading />
  );
}

function PriceCard({
  title,
  row,
  featured = false,
}: {
  title: string;
  row: LandingPriceRow;
  featured?: boolean;
}) {
  return (
    <article
      className={
        featured
          ? "flex min-h-64 flex-col justify-between bg-[#c9aa67] p-6 text-[#0d0c0a] sm:p-8"
          : "grid gap-5 border-t border-[#c9aa67]/25 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      }
    >
      <div>
        <p
          className={
            featured
              ? "text-xs font-bold uppercase tracking-[0.18em] text-[#0d0c0a]/70"
              : "text-xs font-bold uppercase tracking-[0.18em] text-[#c9aa67]"
          }
        >
          {title}
        </p>
        <div
          className={`${featured ? "mt-5 text-3xl sm:text-4xl" : "mt-3 text-2xl"} fame-display tabular-nums`}
        >
          {row.fame ?? <Loading />}
        </div>
      </div>
      <dl
        className={`${featured ? "mt-10 border-t border-[#0d0c0a]/20 pt-5" : "min-w-44"} grid gap-2 text-sm`}
      >
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className={featured ? "text-[#0d0c0a]/65" : "text-[#9f9789]"}>
            USDC
          </dt>
          <dd>
            {row.USDC.value ? (
              <span className="font-medium tabular-nums">{row.USDC.value}</span>
            ) : (
              <Loading />
            )}
          </dd>
        </div>
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className={featured ? "text-[#0d0c0a]/65" : "text-[#9f9789]"}>
            ETH
          </dt>
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

const METRIC_LABELS = {
  marketCap: "Market cap",
  liquidity: "Liquidity",
  buyDepth: "Buy depth",
  sellDepth: "Sell depth",
} as const;

function missing(market: LandingMarketPresentation): boolean {
  return (
    Object.values(market.prices).some(
      (row) => !row.fame || !row.USDC.value || !row.ETH.value,
    ) || Object.values(market.metrics).some((item) => !item.value)
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
  const metrics = Object.fromEntries(
    (Object.keys(current.metrics) as Array<keyof typeof current.metrics>).map(
      (key) => [
        key,
        { value: next.metrics[key].value ?? current.metrics[key].value },
      ],
    ),
  ) as LandingMarketPresentation["metrics"];
  const merged = { prices, metrics };
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
    return startMarketRefresh({
      onMarket: (next) =>
        setMarket((current) => mergeLandingMarket(current, next)),
    });
  }, [needsMarket]);

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
          <PriceCard title="Marketplace" row={market.prices.nftBuy} featured />
        </div>
        <div className="lg:col-span-7">
          <PriceCard title="DeFi buy" row={market.prices.defiBuy} />
          <PriceCard title="DeFi sell" row={market.prices.defiSell} />
        </div>
      </div>
      <div
        aria-label="FAME stats"
        className="mt-8 grid border-t border-[#c9aa67]/25 sm:grid-cols-2 lg:grid-cols-4"
      >
        {(Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).map(
          (key) => (
            <article
              key={key}
              className="border-b border-[#c9aa67]/20 py-5 sm:px-5 sm:first:pl-0 lg:border-r lg:last:border-r-0"
            >
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#8f8779]">
                {METRIC_LABELS[key]}
              </h3>
              <p className="mt-3 min-h-6 font-medium tabular-nums text-[#f4eee2]">
                <Value value={market.metrics[key]} />
              </p>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

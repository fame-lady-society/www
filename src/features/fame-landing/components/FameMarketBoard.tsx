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
      className="inline-block size-4 animate-spin rounded-full border-2 border-[#8e762c] border-t-[#f5d46d]"
    />
  );
}

function Value({ value }: { value: PriceValue }) {
  return value.value ? (
    <span className="font-semibold tabular-nums text-[#fff5d8]">
      {value.value}
    </span>
  ) : (
    <Loading />
  );
}

function PriceCard({ title, row }: { title: string; row: LandingPriceRow }) {
  return (
    <article className="border border-[#8e762c] bg-black/30 p-5">
      <h3 className="text-lg font-semibold text-[#f5d46d]">{title}</h3>
      <div className="mt-4 text-2xl font-semibold tabular-nums">
        {row.fame ?? <Loading />}
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#c6b98b]">USDC</dt>
          <dd>
            <Value value={row.USDC} />
          </dd>
        </div>
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#c6b98b]">ETH</dt>
          <dd>
            <Value value={row.ETH} />
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
    <section aria-label="FAME market">
      <h2 className="mb-4 text-center text-3xl font-semibold">Prices</h2>
      <div className="grid gap-3 lg:grid-cols-3">
        <PriceCard title="DeFi buy" row={market.prices.defiBuy} />
        <PriceCard title="DeFi sell" row={market.prices.defiSell} />
        <PriceCard title="Marketplace" row={market.prices.nftBuy} />
      </div>
      <div
        aria-label="FAME stats"
        className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {(Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).map(
          (key) => (
            <article
              key={key}
              className="border border-[#685a2b] bg-black/30 p-4"
            >
              <h3 className="text-xs uppercase tracking-wide text-[#c6b98b]">
                {METRIC_LABELS[key]}
              </h3>
              <p className="mt-2 min-h-6 font-semibold">
                <Value value={market.metrics[key]} />
              </p>
            </article>
          ),
        )}
      </div>
    </section>
  );
}

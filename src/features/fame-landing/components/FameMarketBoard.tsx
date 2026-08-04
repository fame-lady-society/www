"use client";

import { useEffect, useState } from "react";
import type {
  LandingPriceRow,
  LandingPrices,
  PriceValue,
} from "../pricePresentation";

const RETRY_MS = 5_000;
const INITIAL_RETRY_MS = 500;

type RetryTimer = ReturnType<typeof setTimeout>;
type PriceRequest = (signal: AbortSignal) => Promise<LandingPrices | null>;

async function requestLandingPrices(
  signal: AbortSignal,
): Promise<LandingPrices | null> {
  const response = await fetch("/api/fame/market-prices", {
    cache: "no-store",
    signal,
  });
  return response.ok ? ((await response.json()) as LandingPrices) : null;
}

export function startPriceRefresh({
  onPrices,
  request = requestLandingPrices,
  schedule = (run, delayMs) => setTimeout(run, delayMs),
  cancel = (timer) => clearTimeout(timer),
}: {
  onPrices: (prices: LandingPrices) => void;
  request?: PriceRequest;
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
      if (next && !stopped) onPrices(next);
    } catch {
      // The activity indicator remains while the next retry is scheduled.
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

function Value({ price }: { price: PriceValue }) {
  return price.value ? (
    <span className="font-semibold tabular-nums text-[#fff5d8]">
      {price.value}
    </span>
  ) : (
    <Loading />
  );
}

function PriceCard({ title, row }: { title: string; row: LandingPriceRow }) {
  return (
    <article className="border border-[#8e762c] p-5">
      <h2 className="text-lg font-semibold text-[#f5d46d]">{title}</h2>
      <div className="mt-4 text-2xl font-semibold tabular-nums">
        {row.fame ?? <Loading />}
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#c6b98b]">USDC</dt>
          <dd>
            <Value price={row.USDC} />
          </dd>
        </div>
        <div className="flex min-h-6 items-center justify-between gap-4">
          <dt className="text-[#c6b98b]">ETH</dt>
          <dd>
            <Value price={row.ETH} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

function missing(prices: LandingPrices): boolean {
  return Object.values(prices).some(
    (row) => !row.fame || !row.USDC.value || !row.ETH.value,
  );
}

export function mergeLandingPrices(
  current: LandingPrices,
  next: LandingPrices,
): LandingPrices {
  let changed = false;
  const merged = Object.fromEntries(
    (Object.keys(current) as Array<keyof LandingPrices>).map((key) => {
      const oldRow = current[key];
      const newRow = next[key];
      const fame = newRow.fame ?? oldRow.fame;
      const usdc = newRow.USDC.value ?? oldRow.USDC.value;
      const eth = newRow.ETH.value ?? oldRow.ETH.value;
      changed ||= fame !== oldRow.fame;
      changed ||= usdc !== oldRow.USDC.value;
      changed ||= eth !== oldRow.ETH.value;
      return [
        key,
        {
          fame,
          USDC: { value: usdc },
          ETH: { value: eth },
        },
      ];
    }),
  ) as LandingPrices;
  return changed ? merged : current;
}

export function FameMarketBoard({
  initialPrices,
}: {
  initialPrices: LandingPrices;
}) {
  const [prices, setPrices] = useState(initialPrices);
  const needsPrices = missing(prices);

  useEffect(() => {
    if (!needsPrices) return;
    return startPriceRefresh({
      onPrices: (next) =>
        setPrices((current) => mergeLandingPrices(current, next)),
    });
  }, [needsPrices]);

  return (
    <section aria-label="FAME prices" className="grid gap-3 lg:grid-cols-3">
      <PriceCard title="DeFi buy" row={prices.defiBuy} />
      <PriceCard title="DeFi sell" row={prices.defiSell} />
      <PriceCard title="NFT buy" row={prices.nftBuy} />
    </section>
  );
}

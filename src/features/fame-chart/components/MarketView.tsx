"use client";
import { TransactionTable } from "./TransactionTable";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { HistoryTable } from "./HistoryTable";
import {
  bucketStatus,
  formatDecimal,
  selectedPool,
  poolLabel,
  timeLabel,
  MARKET,
  seriesColor,
  toggleSeries,
} from "../presentation";
import { type Currency, type History } from "../history";
import { HistoryFetchError } from "../useHistory";
const MarketCanvas = dynamic(
  () => import("./MarketCanvas").then((m) => m.MarketCanvas),
  { ssr: false, loading: () => <div className="h-[390px] sm:h-[480px]" /> },
);
const buttonClass =
  "fame-focus min-h-11 whitespace-nowrap px-4 text-sm hover:bg-[#c9aa67]/15 aria-pressed:bg-[#c9aa67] aria-pressed:text-[#0d0c0a]";
export function MarketView({
  history,
  onLoadOlder,
  selection,
  onSelectionChange,
  loadingSeries = [],
  currency,
  onCurrencyChange,
  error,
  fetching,
  onRefresh,
}: {
  history?: History;
  onLoadOlder?: () => void;
  selection: string[];
  onSelectionChange: (ids: string[]) => void;
  loadingSeries?: string[];
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  error: Error | null;
  fetching: boolean;
  onRefresh: () => void;
}) {
  const [hours, setHours] = useState(24),
    [reset, setReset] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  // Never label a cached response with another currency while a request is pending.
  const data = history?.currency === currency ? history : undefined;
  const pools = data?.pools ?? [];
  const poolKey = pools.join(",");
  const poolIds = useMemo(() => {
    const available = new Set([
      MARKET,
      ...(poolKey ? poolKey.split(",") : selection),
    ]);
    const valid = selection.filter((id) => available.has(id));
    return valid.length ? valid : [MARKET];
  }, [selection, poolKey]);
  const market = poolIds.includes(MARKET);
  const rows = useMemo(
    () =>
      data?.buckets.filter((b) => b.timestamp >= data.to - hours * 3600) ?? [],
    [data, hours],
  );
  const latest = data?.buckets.findLast((b) =>
    poolIds.some((id) => selectedPool(b, id)?.price != null),
  );
  const bucket = data?.buckets.find((b) => b.timestamp === selected) ?? latest;
  const status = bucket
    ? `${timeLabel(bucket.timestamp, true)} UTC`
    : "Select a five-minute interval";
  const message =
    error instanceof HistoryFetchError &&
    error.code === "sampled-history-not-ready"
      ? "Sampled market history is not available yet."
      : "Could not load market history.";
  return (
    <section aria-label="FAME price chart">
      <div className="border border-[#c9aa67]/25 bg-[#0d0c0a]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c9aa67]/20 p-3 sm:px-6">
          <div
            role="group"
            aria-label="Price and volume currency"
            className="flex border border-[#c9aa67]/30"
          >
            {(["USDC", "ETH"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={currency === c}
                className={buttonClass}
                onClick={() => onCurrencyChange(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <fieldset className="min-w-0 max-w-full" aria-label="Chart series">
            <legend className="mb-2 text-xs text-[#bdb4a4]">
              Chart series · select at least one
            </legend>
            <div className="flex flex-wrap gap-2">
              {[MARKET, ...pools].map((id) => (
                <label
                  key={id}
                  className="fame-focus flex min-h-11 cursor-pointer items-center gap-2 border border-[#c9aa67]/30 px-3 text-xs has-[:checked]:bg-[#c9aa67] has-[:checked]:text-[#0d0c0a]"
                >
                  <input
                    type="checkbox"
                    name="fame-chart-series"
                    value={id}
                    checked={poolIds.includes(id)}
                    disabled={poolIds.length === 1 && poolIds.includes(id)}
                    onChange={() =>
                      onSelectionChange(toggleSeries(poolIds, id))
                    }
                    className="accent-[#c9aa67]"
                  />
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: seriesColor(id) }}
                  />
                  {poolLabel(id)}
                </label>
              ))}
            </div>
          </fieldset>
          <div
            role="group"
            aria-label="Chart time range"
            className="flex border border-[#c9aa67]/30"
          >
            {[1, 6, 24].map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={hours === h}
                className={buttonClass}
                onClick={() => {
                  setHours(h);
                  setReset((n) => n + 1);
                }}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
        {loadingSeries.length > 0 && data && (
          <p role="status" className="px-4 py-2 text-sm text-[#bdb4a4]">
            Loading {loadingSeries.map(poolLabel).join(", ")}…
          </p>
        )}
        {error && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-[#e4cd96]"
          >
            <span>
              {data
                ? `Refresh failed. Showing the last successful history through ${timeLabel(data.publishedThroughTimestamp, true)} UTC.`
                : message}
            </span>
            <button
              type="button"
              disabled={fetching}
              onClick={onRefresh}
              className="fame-focus min-h-11 px-3 underline disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}
        {data ? (
          <>
            {!rows.some((b) =>
              poolIds.some((id) => selectedPool(b, id)?.price != null),
            ) && (
              <p role="status" className="px-4 pt-4 text-sm text-[#bdb4a4]">
                No sampled prices for this view in this window.
              </p>
            )}
            <MarketCanvas
              history={data}
              onLoadOlder={onLoadOlder}
              currency={currency}
              poolIds={poolIds}
              hours={hours}
              reset={reset}
              onSelect={setSelected}
            />
          </>
        ) : (
          <div
            role="status"
            className="flex h-[390px] items-center justify-center text-sm text-[#bdb4a4] sm:h-[480px]"
          >
            {error
              ? "The chart will appear when history is available."
              : "Loading market history…"}
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-2 border-t border-[#c9aa67]/20 px-4 py-3 text-xs text-[#bdb4a4]">
          <span>
            5m spot candles ·{" "}
            {poolIds.length > 1
              ? "Colors identify series · Overlaid volumes"
              : "Volume"}{" "}
            in {currency} · UTC
          </span>
          <span>
            {data
              ? `${timeLabel(data.from, true)} to ${timeLabel(data.to, true)} UTC`
              : "Last 24 hours"}
          </span>
        </div>
        <div className="border-t border-[#c9aa67]/20 px-4 py-4 sm:px-6">
          <p
            className="h-5 truncate text-xs leading-5 text-[#bdb4a4]"
            title={status}
          >
            {status}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table
              className="w-full table-fixed text-left text-xs leading-5 tabular-nums"
              style={{ minWidth: 800 }}
            >
              <thead className="text-[#bdb4a4]">
                <tr>
                  {[
                    "Series",
                    "Open",
                    "High",
                    "Low",
                    "Close",
                    `Reference (${currency})`,
                    `Volume (${currency})`,
                    "Executions",
                    "Status",
                  ].map((label) => (
                    <th key={label} className="px-2 font-normal">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {poolIds.map((id) => {
                  const sample = bucket && selectedPool(bucket, id);
                  const values = [
                    formatDecimal(sample?.candle?.open),
                    formatDecimal(sample?.candle?.high),
                    formatDecimal(sample?.candle?.low),
                    formatDecimal(sample?.candle?.close),
                    formatDecimal(sample?.price),
                    formatDecimal(sample?.volume),
                    sample?.tradeCount ?? "Unavailable",
                    bucket ? bucketStatus(bucket, id) : "Unavailable",
                  ];
                  return (
                    <tr key={id}>
                      <th
                        className="truncate px-2 py-2 font-normal"
                        title={poolLabel(id)}
                        style={{ color: seriesColor(id) }}
                      >
                        {poolLabel(id)}
                      </th>
                      {values.map((value, i) => (
                        <td
                          key={i}
                          title={String(value)}
                          className="truncate px-2 py-2"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <TransactionTable currency={currency} />
      <p className="mt-4 text-xs leading-6 text-[#bdb4a4]">
        Blended always includes the backend’s tracked market; selecting pools
        does not recalculate it. Comparison volumes are overlaid, not added
        together.
        {market
          ? " Market price is weighted by each pool’s FAME balance at the start of the bucket. Weights stay fixed within the bucket. Volume and inventory combine tracked pools. "
          : ""}
        Candles follow spot-price changes, converted at each bucket’s closing
        rate. They exclude intrabucket movement of conversion pools. Dots show
        bucket-end reference prices; quiet intervals use flat reference bars.
        Hollow candles have incomplete opening state. Missing data remains gaps.
      </p>
      {data && (
        <details className="mt-6 border-y border-[#c9aa67]/25">
          <summary className="fame-focus cursor-pointer py-4 text-sm text-[#e4cd96]">
            Data and coverage
          </summary>
          <p className="mb-4 text-xs leading-6 text-[#bdb4a4]">
            Volume values use each bucket’s closing conversion rate. Executions
            count pool swaps, not unique transactions. Inventory is the value of
            assets held by the selected pools. The blended price is an
            inventory-weighted index, not an executable quote. Price, activity
            and inventory can be unavailable independently. USDC is denominated
            in the token, not USD.
          </p>
          {poolIds.map((id) => (
            <HistoryTable
              key={id}
              rows={rows}
              currency={currency}
              poolId={id}
            />
          ))}
          <a
            href="/licenses/lightweight-charts.txt"
            className="fame-focus my-4 inline-block text-xs text-[#bdb4a4] underline"
          >
            Chart library license and notices
          </a>
        </details>
      )}
    </section>
  );
}

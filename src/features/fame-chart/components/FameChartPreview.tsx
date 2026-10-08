"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useHistory } from "../useHistory";
import { formatDecimal } from "../presentation";

const MarketCanvas = dynamic(
  () => import("./MarketCanvas").then((m) => m.MarketCanvas),
  { ssr: false, loading: () => <div className="h-[260px] sm:h-[320px]" /> },
);
const series = ["market"];
const ignoreSelection = () => {};

export function FameChartPreview() {
  const query = useHistory("USDC", series, false);
  const history = query.data;
  const latest = history?.buckets.findLast((b) => b.market.price !== null);
  return (
    <section
      aria-label="FAME 24-hour blended chart"
      className="relative mt-6 border border-[#c9aa67]/25 bg-[#0d0c0a]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c9aa67]/20 px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-sm text-[#e4cd96]">$FAME · Blended · 24h</h2>
          <p className="mt-1 text-xs text-[#bdb4a4]">
            USDC per FAME · Updates every minute
          </p>
        </div>
        {latest && (
          <p className="text-xl tabular-nums">
            {formatDecimal(latest.market.price)}{" "}
            <span className="text-xs text-[#bdb4a4]">USDC</span>
          </p>
        )}
        <span className="text-sm text-[#e4cd96]" aria-hidden="true">
          View chart ↗
        </span>
      </div>
      <div className="pointer-events-none" aria-hidden="true">
        {history && latest ? (
          <MarketCanvas
            history={history}
            currency="USDC"
            poolIds={series}
            hours={24}
            reset={0}
            onSelect={ignoreSelection}
            preview
          />
        ) : (
          <div className="flex h-[260px] items-center justify-center px-4 text-sm text-[#bdb4a4] sm:h-[320px]">
            {query.error
              ? "Chart temporarily unavailable"
              : history
                ? "No prices available in the past 24 hours"
                : "Loading chart…"}
          </div>
        )}
      </div>
      {query.error && history && (
        <p role="status" className="px-4 py-2 text-xs text-[#bdb4a4]">
          Refresh unavailable. Showing the last loaded chart.
        </p>
      )}
      <Link
        href="/fame/chart"
        className="fame-focus absolute inset-0"
        aria-label="Open the full FAME market chart"
      />
    </section>
  );
}

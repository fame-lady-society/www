"use client";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { activitySchema, fameAmount } from "../activity";
import { closedDay, DAY, type Currency } from "../history";
import { formatDecimal, poolLabel, timeLabel } from "../presentation";

const labels = {
  buy: "Buy",
  sell: "Sell",
  add: "Add liquidity",
  remove: "Remove liquidity",
};
export function TransactionTable({ currency }: { currency: Currency }) {
  const [end, setEnd] = useState(() => closedDay().to);
  const [revision, setRevision] = useState(0);
  const query = useInfiniteQuery({
    queryKey: ["fame-activity", currency, end, revision],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const params = new URLSearchParams({
        currency,
        from: String(end - DAY),
        to: String(end),
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      const response = await fetch(`/api/fame/activity?${params}`, { signal });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(
          body.error === "cursor-reset-required"
            ? "History changed. Refresh to load the latest transactions."
            : "Transactions could not be loaded.",
        );
      }
      return activitySchema.parse(await response.json());
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: Infinity,
    retry: false,
  });
  const pages = query.data?.pages ?? [];
  const rows = [
    ...new Map(pages.flatMap((p) => p.rows).map((r) => [r.id, r])).values(),
  ];
  const incomplete = pages.some(
    (p) =>
      p.coverage.unavailableBuckets.length ||
      p.coverage.partialBuckets.length ||
      p.coverage.outsidePublishedWindow ||
      p.coverage.notYetPublished,
  );
  return (
    <section
      aria-label="Transactions"
      className="my-6 border border-[#c9aa67]/25"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[#c9aa67]/20 px-4 py-4">
        <div>
          <h2 className="text-lg">Transactions</h2>
          <p className="mt-1 text-xs text-[#bdb4a4]">
            All tracked pools · Past 24 hours · UTC
          </p>
        </div>
        <button
          type="button"
          className="fame-focus px-3 py-2 text-sm text-[#e4cd96] disabled:opacity-40"
          disabled={query.isFetching}
          onClick={() => {
            setEnd(closedDay().to);
            setRevision((n) => n + 1);
          }}
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left text-sm tabular-nums">
          <thead className="text-xs text-[#bdb4a4]">
            <tr>
              {[
                "Time (UTC)",
                "Type",
                "Pool",
                "FAME",
                `Value (${currency})`,
                "Transaction",
              ].map((label) => (
                <th key={label} className="px-4 py-3 font-normal">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#c9aa67]/10">
                <td className="px-4 py-3">{timeLabel(row.timestamp, true)}</td>
                <td
                  className={`px-4 py-3 ${row.type === "buy" ? "text-[#67bf95]" : row.type === "sell" ? "text-[#ff3b3b]" : "text-[#e4cd96]"}`}
                >
                  {labels[row.type]}
                </td>
                <td className="px-4 py-3">{poolLabel(row.poolId)}</td>
                <td
                  className="px-4 py-3"
                  title={fameAmount(row.fameAtoms, row.fameDecimals)}
                >
                  {formatDecimal(fameAmount(row.fameAtoms, row.fameDecimals))}
                </td>
                <td className="px-4 py-3">{formatDecimal(row.size)}</td>
                <td className="px-4 py-3">
                  <a
                    className="fame-focus text-[#e4cd96] underline"
                    href={`https://basescan.org/tx/${row.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View transaction ${row.transactionHash}, log ${row.logIndex}`}
                  >
                    {row.transactionHash.slice(0, 8)}…
                    {row.transactionHash.slice(-6)} ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 text-xs text-[#bdb4a4]" aria-live="polite">
        {query.isPending
          ? "Loading transactions…"
          : query.error
            ? query.error.message
            : !rows.length
              ? query.hasNextPage
                ? "No transactions in this page. Load more to continue."
                : incomplete
                  ? "No transactions in the available history."
                  : "No transactions in the past 24 hours."
              : null}
        {incomplete && !query.error && (
          <p className="mt-2">Some intervals are not available yet.</p>
        )}
        {query.hasNextPage && (
          <button
            type="button"
            disabled={query.isFetching}
            onClick={() => {
              void query.fetchNextPage();
            }}
            className="fame-focus mt-3 px-3 py-2 text-sm text-[#e4cd96] disabled:opacity-40"
          >
            {query.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        )}
        <p className="mt-3">
          One row per pool event; a transaction may appear more than once.
          Values use the bucket-end conversion rate.
        </p>
      </div>
    </section>
  );
}

"use client";
import { useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  closedDay,
  DAY,
  parseChart,
  mergeChart,
  combineCharts,
  type ChartState,
  type Currency,
} from "./history";
export class HistoryFetchError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}
export function useHistory(
  currency: Currency,
  series: string[],
  preloadOlder = true,
) {
  const client = useQueryClient();
  const [pages, setPages] = useState(preloadOlder ? 1 : 0);
  // Keep an older day loaded behind the initial 24-hour viewport.
  const requests = Array.from({ length: pages + 1 }, (_, page) =>
    series.map((id) => ({ id, page })),
  ).flat();
  const queries = useQueries({
    queries: requests.map(({ id, page }) => {
      const queryKey = ["fame-chart-v1", currency, id, "latest", page];
      return {
        queryKey,
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          const previous = client.getQueryData<ChartState>(queryKey),
            end = closedDay().to - page * DAY,
            bounds = { from: end - DAY, to: end };
          let cursor = previous?.cursor;
          for (let attempt = 0; attempt < 2; attempt++) {
            const expected = {
              ...bounds,
              currency,
              series: id,
              ...(cursor ? { cursor } : {}),
            };
            const params = new URLSearchParams({
              currency,
              series: id,
              from: String(bounds.from),
              to: String(bounds.to),
              ...(cursor ? { cursor } : {}),
            });
            const response = await fetch(`/api/fame/history?${params}`, {
              signal,
            });
            if (!response.ok) {
              const body = await response.json();
              if (
                response.status === 409 &&
                body.error === "cursor-reset-required" &&
                cursor &&
                attempt === 0
              ) {
                cursor = undefined;
                continue;
              }
              throw new HistoryFetchError(
                typeof body.error === "string"
                  ? body.error
                  : "history-unavailable",
                response.status,
              );
            }
            const parsed = parseChart(await response.json(), expected);
            signal.throwIfAborted();
            const current = client.getQueryData<ChartState>(queryKey);
            if (current?.cursor !== previous?.cursor) return current!; // A newer request already won.
            return mergeChart(cursor ? previous : undefined, parsed);
          }
          throw new HistoryFetchError("history-unavailable", 503);
        },
        staleTime: 30_000,
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        retry: (attempt: number, error: Error) =>
          attempt < 1 &&
          !(error instanceof HistoryFetchError && error.status < 500),
        retryDelay: 2000,
      };
    }),
  });
  const readySeries = new Set(
    queries
      .slice(0, series.length)
      .flatMap((q) => (q.data ? [q.data.series] : [])),
  );
  const states = queries.flatMap((q) =>
    q.data && readySeries.has(q.data.series) ? [q.data] : [],
  );
  const data = combineCharts(states);
  const isFetching = queries.some((q) => q.isFetching);
  return {
    data,
    loadOlder: () => {
      if (
        isFetching ||
        queries.some((q) => q.error) ||
        data?.buckets[0]?.publicationStatus === "outside-published-window"
      )
        return;
      setPages(pages + 1);
    },
    error: queries.find((q) => q.error)?.error ?? null,
    isFetching,
    loadingSeries: series.filter((_, i) => !queries[i].data),
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  };
}

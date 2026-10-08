"use client";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  closedDay,
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
export function useHistory(currency: Currency, series: string[]) {
  const client = useQueryClient();
  const queries = useQueries({
    queries: series.map((id) => {
      const queryKey = ["fame-chart-v1", currency, id, "24h"];
      return {
        queryKey,
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          const previous = client.getQueryData<ChartState>(queryKey),
            bounds = closedDay();
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
  const states = queries.flatMap((q) => (q.data ? [q.data] : []));
  return {
    data: combineCharts(states),
    error: queries.find((q) => q.error)?.error ?? null,
    isFetching: queries.some((q) => q.isFetching),
    loadingSeries: series.filter((_, i) => !queries[i].data),
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  };
}

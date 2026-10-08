export const INTERVAL = 300,
  DAY = 86400;
export type Currency = "ETH" | "USDC";
export type Bounds = { from: number; to: number };
export type HistoryRequest = Bounds & {
  currency: Currency;
  series: string;
  cursor?: string;
};
export type Candle = {
  open: string;
  high: string;
  low: string;
  close: string;
  coverage: "complete" | "partial" | "reference-only";
};
type Coverage = "complete" | "partial" | "missing";
export type MarketMetric = {
  status: "complete" | "partial" | "unavailable";
  value: string | null;
};
type PublicationStatus =
  | "published"
  | "outside-published-window"
  | "not-yet-published";
export type ChartBucket = {
  timestamp: number;
  publicationStatus: PublicationStatus;
  price: string | null;
  candle: Candle | null;
  volume: string | null;
  inventory: string | null;
  volumeStatus: MarketMetric["status"];
  inventoryStatus: MarketMetric["status"];
  tradeCount: number | null;
  eventCoverage: Coverage;
  marketVolume?: MarketMetric;
};
export type ChartResponse = Bounds & {
  version: "fame-chart-v1";
  mode: "snapshot" | "delta";
  baseCursor: string | null;
  cursor: string;
  currency: Currency;
  series: string;
  resolution: 300;
  policyRevision: string;
  publicationId: string;
  publishedThroughTimestamp: number;
  priceMethod: string;
  candleMethod: string;
  conversionMethod: string;
  pools: string[];
  upserts: ChartBucket[];
  removedTimestamps: number[];
};
export type ChartState = Omit<
  ChartResponse,
  "upserts" | "removedTimestamps" | "mode" | "baseCursor"
> & { buckets: ChartBucket[] };
export type PoolSample = Pick<
  ChartBucket,
  | "price"
  | "candle"
  | "volume"
  | "inventory"
  | "tradeCount"
  | "eventCoverage"
  | "publicationStatus"
> & { poolId: string };
export type Bucket = {
  timestamp: number;
  publicationStatus: PublicationStatus;
  series: PoolSample[];
  market: { price: string | null; candle: Candle | null };
  totals: {
    volume: MarketMetric;
    inventory: MarketMetric;
    tradeCount: number | null;
    eventCoverage: Coverage;
  };
};
export type History = Bounds & {
  currency: Currency;
  pools: string[];
  publishedThroughTimestamp: number;
  buckets: Bucket[];
};
export function closedDay(now = Date.now()): Bounds {
  const to = Math.floor(now / (INTERVAL * 1000)) * INTERVAL;
  return { from: to - DAY, to };
}
function check(v: unknown): asserts v {
  if (!v) throw new Error("Invalid chart response.");
}
function record(v: unknown): Record<string, unknown> {
  check(v && typeof v === "object" && !Array.isArray(v));
  return v as Record<string, unknown>;
}
function natural(v: unknown): number {
  check(typeof v === "number" && Number.isSafeInteger(v) && v >= 0);
  return v;
}
function hash(v: unknown): string {
  check(typeof v === "string" && /^[a-f0-9]{64}$/.test(v));
  return v;
}
function token(v: unknown): string {
  check(
    typeof v === "string" && v.length <= 1024 && /^[A-Za-z0-9_-]+$/.test(v),
  );
  return v;
}
function decimal(v: unknown): string | null {
  if (v === null) return null;
  check(typeof v === "string" && /^(0|[1-9][0-9]{0,37})\.[0-9]{18}$/.test(v));
  return v;
}
export function decimalAtoms(v: string): bigint {
  return BigInt(v.replace(".", ""));
}
function metric(value: unknown, status: unknown): MarketMetric {
  check(
    status === "complete" || status === "partial" || status === "unavailable",
  );
  const v = decimal(value);
  check((status === "unavailable") === (v === null));
  return { status, value: v };
}
export function parseChart(
  value: unknown,
  expected?: HistoryRequest,
): ChartResponse {
  const h = record(value);
  check(h.version === "fame-chart-v1" && h.resolution === 300);
  check(h.currency === "ETH" || h.currency === "USDC");
  check(h.mode === "snapshot" || h.mode === "delta");
  const from = natural(h.from),
    to = natural(h.to);
  check(from % 300 === 0 && to % 300 === 0 && to > from && to - from <= DAY);
  check(typeof h.series === "string" && /^[a-z0-9-]{1,100}$/.test(h.series));
  const cursor = token(h.cursor),
    baseCursor = h.baseCursor === null ? null : token(h.baseCursor);
  check((h.mode === "snapshot") === (baseCursor === null));
  if (expected)
    check(
      from === expected.from &&
        to === expected.to &&
        h.currency === expected.currency &&
        h.series === expected.series &&
        baseCursor === (expected.cursor ?? null),
    );
  check(
    Array.isArray(h.pools) &&
      h.pools.length > 0 &&
      h.pools.length <= 20 &&
      h.pools.every(
        (p) =>
          typeof p === "string" &&
          p !== "market" &&
          /^[a-z0-9-]{1,100}$/.test(p),
      ) &&
      new Set(h.pools).size === h.pools.length,
  );
  const pools = h.pools as string[];
  check(h.series === "market" || pools.includes(h.series));
  check(typeof h.priceMethod === "string");
  check(
    h.priceMethod ===
      (h.series === "market"
        ? "fame-balance-weighted-spot-v1"
        : "bucket-end-spot") &&
      h.candleMethod === "spot-events-at-bucket-end-rate" &&
      h.conversionMethod === "bucket-end-spot",
  );
  const publishedThroughTimestamp = natural(h.publishedThroughTimestamp);
  check(publishedThroughTimestamp % 300 === 0);
  check(Array.isArray(h.upserts) && h.upserts.length <= (to - from) / 300);
  const times = new Set<number>();
  const upserts = h.upserts.map((v): ChartBucket => {
    const b = record(v),
      timestamp = natural(b.timestamp);
    check(
      timestamp % 300 === 0 &&
        timestamp >= from &&
        timestamp < to &&
        !times.has(timestamp),
    );
    times.add(timestamp);
    check(
      b.publicationStatus === "published" ||
        b.publicationStatus === "outside-published-window" ||
        b.publicationStatus === "not-yet-published",
    );
    check(
      b.eventCoverage === "complete" ||
        b.eventCoverage === "partial" ||
        b.eventCoverage === "missing",
    );
    const price = decimal(b.price),
      volume = metric(b.volume, b.volumeStatus),
      inventory = metric(b.inventory, b.inventoryStatus),
      tradeCount = b.tradeCount === null ? null : natural(b.tradeCount);
    check(price === null || decimalAtoms(price) > 0n);
    let candle: Candle | null = null;
    if (b.candle !== null) {
      const c = record(b.candle),
        open = decimal(c.open),
        high = decimal(c.high),
        low = decimal(c.low),
        close = decimal(c.close);
      check(open !== null && high !== null && low !== null && close !== null);
      check(
        c.coverage === "complete" ||
          c.coverage === "partial" ||
          c.coverage === "reference-only",
      );
      check(
        close === price &&
          decimalAtoms(low) > 0n &&
          decimalAtoms(low) <= decimalAtoms(open) &&
          decimalAtoms(low) <= decimalAtoms(close) &&
          decimalAtoms(high) >= decimalAtoms(open) &&
          decimalAtoms(high) >= decimalAtoms(close),
      );
      if (c.coverage === "reference-only")
        check(open === high && high === low && low === close);
      candle = { open, high, low, close, coverage: c.coverage };
    }
    if (b.publicationStatus !== "published")
      check(
        price === null &&
          candle === null &&
          volume.value === null &&
          inventory.value === null &&
          tradeCount === null &&
          b.eventCoverage === "missing",
      );
    if (b.publicationStatus === "published")
      check(timestamp < publishedThroughTimestamp);
    if (b.publicationStatus === "not-yet-published")
      check(timestamp >= publishedThroughTimestamp);
    if (b.eventCoverage === "missing")
      check(volume.value === null && tradeCount === null);
    if (b.eventCoverage === "complete") check(tradeCount !== null);
    const marketVolume =
      h.series === "market" ? undefined : record(b.marketVolume);
    return {
      timestamp,
      publicationStatus: b.publicationStatus,
      price,
      candle,
      volume: volume.value,
      inventory: inventory.value,
      volumeStatus: volume.status,
      inventoryStatus: inventory.status,
      tradeCount,
      eventCoverage: b.eventCoverage,
      ...(marketVolume
        ? { marketVolume: metric(marketVolume.value, marketVolume.status) }
        : {}),
    };
  });
  check(Array.isArray(h.removedTimestamps));
  const removedTimestamps = h.removedTimestamps.map(natural);
  check(
    removedTimestamps.length <= 288 &&
      new Set(removedTimestamps).size === removedTimestamps.length &&
      removedTimestamps.every(
        (t) => t % 300 === 0 && t >= from && t < to && !times.has(t),
      ),
  );
  if (h.mode === "snapshot")
    check(
      upserts.length === (to - from) / 300 && removedTimestamps.length === 0,
    );
  return {
    version: "fame-chart-v1",
    mode: h.mode,
    baseCursor,
    cursor,
    currency: h.currency,
    series: h.series,
    from,
    to,
    resolution: 300,
    policyRevision: hash(h.policyRevision),
    publicationId: hash(h.publicationId),
    publishedThroughTimestamp,
    priceMethod: h.priceMethod,
    candleMethod: h.candleMethod,
    conversionMethod: h.conversionMethod,
    pools,
    upserts,
    removedTimestamps,
  };
}
export function mergeChart(
  previous: ChartState | undefined,
  response: ChartResponse,
): ChartState {
  if (response.mode === "delta")
    check(
      previous &&
        response.baseCursor === previous.cursor &&
        response.series === previous.series &&
        response.currency === previous.currency &&
        response.policyRevision === previous.policyRevision,
    );
  const byTime = new Map(
    (response.mode === "delta" ? previous!.buckets : [])
      .filter((b) => b.timestamp >= response.from && b.timestamp < response.to)
      .map((b) => [b.timestamp, b]),
  );
  for (const t of response.removedTimestamps) byTime.delete(t);
  for (const b of response.upserts) byTime.set(b.timestamp, b);
  const buckets = [...byTime.values()].sort(
    (a, b) => a.timestamp - b.timestamp,
  );
  // The current protocol represents missing states as explicit gaps, never an incomplete grid.
  check(
    buckets.length === (response.to - response.from) / 300 &&
      buckets.every((b, i) => b.timestamp === response.from + i * 300),
  );
  const {
    mode: _,
    baseCursor: __,
    upserts: ___,
    removedTimestamps: ____,
    ...metadata
  } = response;
  return { ...metadata, buckets };
}
/** Presentation model combining only explicitly requested series, never their prices. */
export function combineCharts(states: ChartState[]): History | undefined {
  if (!states.length) return undefined;
  const anchor = states.reduce((a, b) => (b.to > a.to ? b : a)),
    valid = states.filter(
      (s) =>
        s.currency === anchor.currency &&
        s.policyRevision === anchor.policyRevision,
    );
  const from = Math.min(...valid.map((s) => s.from));
  const maps = [...valid]
    .sort((a, b) => b.to - a.to)
    .map((s) => ({
      state: s,
      buckets: new Map(s.buckets.map((b) => [b.timestamp, b])),
    }));
  return {
    currency: anchor.currency,
    from,
    to: anchor.to,
    pools: anchor.pools,
    publishedThroughTimestamp: Math.min(
      ...valid.map((s) => s.publishedThroughTimestamp),
    ),
    buckets: Array.from({ length: (anchor.to - from) / 300 }, (_, i) => {
      const timestamp = from + i * 300,
        rows = maps.flatMap(({ state, buckets }) => {
          const b = buckets.get(timestamp);
          return b ? [{ state, b }] : [];
        });
      // Adjacent rolling windows can overlap; prefer the newest window per series.
      const uniqueRows = rows.filter(
        (row, index) =>
          rows.findIndex((other) => other.state.series === row.state.series) ===
          index,
      );
      const m = uniqueRows.find((r) => r.state.series === "market")?.b,
        other = rows.find((r) => r.b.marketVolume)?.b.marketVolume;
      const unavailable: MarketMetric = { status: "unavailable", value: null };
      return {
        timestamp,
        publicationStatus:
          m?.publicationStatus ??
          rows[0]?.b.publicationStatus ??
          "not-yet-published",
        market: { price: m?.price ?? null, candle: m?.candle ?? null },
        totals: {
          volume: m
            ? { value: m.volume, status: m.volumeStatus }
            : other ?? unavailable,
          inventory: m
            ? { value: m.inventory, status: m.inventoryStatus }
            : unavailable,
          tradeCount: m?.tradeCount ?? null,
          eventCoverage:
            m?.eventCoverage ??
            (other?.status === "complete"
              ? "complete"
              : other?.status === "partial"
                ? "partial"
                : "missing"),
        },
        series: uniqueRows.map(({ state, b }) => ({
          ...b,
          poolId: state.series,
        })),
      };
    }),
  };
}

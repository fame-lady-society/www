import { formatUnits } from "viem";
import type {
  LineData,
  CandlestickData,
  HistogramData,
  UTCTimestamp,
  WhitespaceData,
} from "lightweight-charts";
import {
  decimalAtoms,
  INTERVAL,
  type Bounds,
  type Bucket,
  type History,
} from "./history";
export const MARKET = "market";
export const PRICE_COLOR = "#e9bf62";
const SERIES_COLORS: Record<string, string> = {
  [MARKET]: "#e9bf62",
  "scale-equalizer-weth-fame": "#66bfff",
  "uniswap-v2-fame-direct": "#ce9aff",
  "scale-equalizer-frxusd-fame": "#ff935c",
  "scale-equalizer-scale-fame": "#6fdbb1",
  "slipstream-basedflick-fame": "#f28fba",
};
export function seriesColor(id: string) {
  return SERIES_COLORS[id] ?? PRICE_COLOR;
}
export function toggleSeries(selected: string[], id: string): string[] {
  if (!selected.includes(id)) return [...selected, id];
  return selected.length === 1
    ? selected
    : selected.filter((value) => value !== id);
}
const axisNumber = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 6,
});
export function formatAxisNumber(value: number): string {
  return Math.abs(value) >= 1e9 || (value !== 0 && Math.abs(value) < 1e-6)
    ? value.toExponential(3)
    : axisNumber.format(value);
}
export function selectedPool(bucket: Bucket, poolId: string) {
  return bucket.series.find((p) => p.poolId === poolId);
}
export function poolLabel(id: string): string {
  const labels: Record<string, string> = {
    [MARKET]: "Blended",
    "scale-equalizer-weth-fame": "Equalizer · FAME/WETH",
    "uniswap-v2-fame-direct": "Uniswap V2 · FAME/WETH",
    "scale-equalizer-frxusd-fame": "Equalizer · FAME/frxUSD",
    "scale-equalizer-scale-fame": "Equalizer · FAME/SCALE",
    "slipstream-basedflick-fame": "Slipstream · FAME/BASED FLICK",
  };
  return labels[id] ?? id;
}
export function bucketStatus(bucket: Bucket, poolId: string): string {
  const status = selectedPool(bucket, poolId)?.publicationStatus;
  if (!status) return "Series not loaded";
  if (status === "not-yet-published") return "Awaiting publication";
  if (status === "outside-published-window") return "Outside published history";
  const p = selectedPool(bucket, poolId);
  return [
    p?.candle?.coverage === "partial"
      ? "Partial spot candle"
      : p?.candle?.coverage === "reference-only"
        ? "Flat reference bar"
        : p?.candle
          ? "Spot candle"
          : "Candle unavailable",
    p?.eventCoverage === "complete"
      ? p.tradeCount === 0
        ? "No trades"
        : "Complete activity"
      : p?.eventCoverage === "partial"
        ? "Partial activity"
        : "Activity unavailable",
  ].join(" · ");
}
export function chartSeries(history: History, poolId: string) {
  const prices: (LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp>)[] = [];
  const candles: (
    | CandlestickData<UTCTimestamp>
    | WhitespaceData<UTCTimestamp>
  )[] = [];
  const volumes: (
    | HistogramData<UTCTimestamp>
    | WhitespaceData<UTCTimestamp>
  )[] = [];
  for (const b of history.buckets) {
    const p = selectedPool(b, poolId),
      time = b.timestamp as UTCTimestamp;
    prices.push(p?.price != null ? { time, value: Number(p.price) } : { time });
    candles.push(
      p?.candle
        ? {
            time,
            open: Number(p.candle.open),
            high: Number(p.candle.high),
            low: Number(p.candle.low),
            close: Number(p.candle.close),
            ...(p.candle.coverage === "partial"
              ? {
                  color: "transparent",
                  borderColor: "#e9bf62",
                  wickColor: "#e9bf62",
                }
              : p.candle.coverage === "reference-only"
                ? {
                    color: PRICE_COLOR,
                    borderColor: PRICE_COLOR,
                    wickColor: PRICE_COLOR,
                  }
                : {}),
          }
        : { time },
    );
    const volume = poolId === MARKET ? b.totals.volume.value : p?.volume;
    const complete =
      poolId === MARKET
        ? b.totals.volume.status === "complete" &&
          b.totals.eventCoverage === "complete"
        : p?.eventCoverage === "complete";
    volumes.push(
      volume != null
        ? {
            time,
            value: Number(volume),
            color: complete ? "#c9aa6788" : "#c9aa6744",
          }
        : { time },
    );
  }
  return { prices, candles, volumes };
}
export function volumeSummary(buckets: Bucket[], poolId: string) {
  let total = 0n,
    known = 0,
    incomplete = false;
  for (const b of buckets) {
    const p = selectedPool(b, poolId);
    if (poolId === MARKET) {
      if (b.totals.volume.value !== null) {
        total += decimalAtoms(b.totals.volume.value);
        known++;
      }
      if (
        b.totals.volume.status !== "complete" ||
        b.totals.eventCoverage !== "complete"
      )
        incomplete = true;
      continue;
    }
    if (p?.volume != null) {
      total += decimalAtoms(p.volume);
      known++;
    }
    if (p?.eventCoverage !== "complete" || p.volume === null) incomplete = true;
  }
  return { value: known ? formatUnits(total, 18) : null, incomplete };
}
// Fixed-point strings are retained in the text UI. Numbers are only used by canvas.
export function formatDecimal(
  value: string | null | undefined,
  significant = 6,
): string {
  if (value === null || value === undefined) return "Unavailable";
  const [whole, fraction = ""] = value.split(".");
  if (BigInt(whole) > 0n) {
    const places = Math.max(0, significant - whole.length);
    const tail = fraction.slice(0, places).replace(/0+$/, "");
    return BigInt(whole).toLocaleString("en-US") + (tail ? `.${tail}` : "");
  }
  const first = fraction.search(/[1-9]/);
  if (first < 0) return "0";
  return `0.${fraction.slice(0, first + significant).replace(/0+$/, "")}`;
}

export function timeLabel(timestamp: number, date = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    ...(date ? ({ month: "short", day: "2-digit" } as const) : {}),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp * 1000));
}

export function refreshedViewport(
  visible: { from: number; to: number },
  old: Bounds,
  next: Bounds,
) {
  const oldCount = (old.to - old.from) / INTERVAL;
  const following = visible.to >= oldCount - 1;
  const shift = following
    ? (next.to - next.from) / INTERVAL - oldCount
    : (old.from - next.from) / INTERVAL;
  return { from: visible.from + shift, to: visible.to + shift };
}

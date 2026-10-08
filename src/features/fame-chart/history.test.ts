import assert from "node:assert/strict";
import { it } from "node:test";
import usdc from "./fixtures/sampled-usdc.json";
import eth from "./fixtures/sampled-eth.json";
import { parseChart, mergeChart, combineCharts } from "./history";
import {
  chartSeries,
  volumeSummary,
  toggleSeries,
  refreshedViewport,
} from "./presentation";
it("projects compact snapshots without leaking internal evidence", () => {
  for (const input of [usdc, eth]) {
    const response = parseChart({ ...input, secret: "not-public" });
    assert(!JSON.stringify(response).includes("not-public"));
    const state = mergeChart(undefined, response),
      h = combineCharts([state])!;
    assert.equal(h.buckets.length, 288);
    assert.equal(h.pools.length, 5);
    assert(
      chartSeries(h, "market").candles.some(
        (c) => "high" in c && c.high !== c.low,
      ),
    );
    assert.equal(chartSeries(h, "market").prices.length, 288);
  }
});
it("repair deltas replace history and reject stale/out-of-order responses atomically", () => {
  const initial = mergeChart(undefined, parseChart(usdc));
  const b = structuredClone(initial.buckets[0]);
  b.price = "1.000000000000000000";
  b.candle = null;
  const wire = {
    ...usdc,
    mode: "delta",
    baseCursor: initial.cursor,
    cursor: "next",
    upserts: [b],
  };
  const repaired = mergeChart(initial, parseChart(wire));
  assert.equal(repaired.buckets[0].price, b.price);
  assert.equal(repaired.buckets.length, 288);
  assert.throws(() => mergeChart(repaired, parseChart(wire)));
  const snapshot = parseChart({
    ...usdc,
    cursor: "next",
    upserts: repaired.buckets,
  });
  assert.deepEqual(mergeChart(undefined, snapshot), repaired);
});
it("idle updates retain data; rolling windows evict expired buckets and add explicit gaps", () => {
  const initial = mergeChart(undefined, parseChart(usdc));
  const idle = parseChart({
    ...usdc,
    mode: "delta",
    baseCursor: initial.cursor,
    upserts: [],
  });
  assert.deepEqual(mergeChart(initial, idle).buckets, initial.buckets);
  const gap = {
    ...initial.buckets[0],
    timestamp: initial.to,
    publicationStatus: "not-yet-published",
    price: null,
    candle: null,
    volume: null,
    inventory: null,
    volumeStatus: "unavailable",
    inventoryStatus: "unavailable",
    tradeCount: null,
    eventCoverage: "missing",
  };
  const rolled = mergeChart(
    initial,
    parseChart({
      ...usdc,
      mode: "delta",
      baseCursor: initial.cursor,
      cursor: "rolled",
      from: initial.from + 300,
      to: initial.to + 300,
      upserts: [gap],
    }),
  );
  assert.equal(rolled.buckets[0].timestamp, initial.from + 300);
  assert.equal(rolled.buckets.at(-1)!.price, null);
  assert.throws(() =>
    mergeChart(
      initial,
      parseChart({
        ...usdc,
        mode: "delta",
        baseCursor: initial.cursor,
        from: initial.from + 300,
        to: initial.to + 300,
        upserts: [],
      }),
    ),
  );
});
it("invalid shapes, OHLC, identity and duplicate timestamps are rejected", () => {
  for (const mutate of [
    (h: any) => (h.upserts[0].price = "NaN"),
    (h: any) => (h.upserts[0].candle.low = "999.000000000000000000"),
    (h: any) => (h.upserts[1].timestamp = h.upserts[0].timestamp),
    (h: any) => (h.version = "old"),
    (h: any) => (h.mode = "delta"),
  ]) {
    const bad = structuredClone(usdc);
    mutate(bad);
    assert.throws(() => parseChart(bad));
  }
  assert.throws(() =>
    parseChart(usdc, {
      from: usdc.from,
      to: usdc.to,
      currency: "ETH",
      series: "market",
    }),
  );
});
it("missing samples stay gaps and market totals retain their completeness", () => {
  const state = mergeChart(undefined, parseChart(usdc));
  state.buckets[0].price = null;
  state.buckets[0].candle = null;
  state.buckets[0].volume = null;
  state.buckets[0].volumeStatus = "unavailable";
  const h = combineCharts([state])!,
    series = chartSeries(h, "market");
  assert.deepEqual(series.prices[0], { time: state.from });
  assert.deepEqual(series.volumes[0], { time: state.from });
  assert(volumeSummary(h.buckets, "market").incomplete);
});
it("preserves comparison selection and historical viewport behavior", () => {
  assert.deepEqual(toggleSeries(["market"], "a"), ["market", "a"]);
  assert.deepEqual(toggleSeries(["market"], "market"), ["market"]);
  assert.deepEqual(
    refreshedViewport(
      { from: 20, to: 40 },
      { from: 0, to: 86400 },
      { from: 300, to: 86700 },
    ),
    { from: 19, to: 39 },
  );
});

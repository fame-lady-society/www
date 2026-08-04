import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { marketFreshness, midpoint, multiply, ratio, spreadBps } from "./marketStats";

describe("FAME landing market arithmetic", () => {
  it("uses exact rational arithmetic for prices and market cap", () => {
    const buy = ratio(2_000_000n, 6, 1_000_000_000_000_000_000n, 18);
    const sell = ratio(1_000_000n, 6, 1_000_000_000_000_000_000n, 18);
    assert.deepEqual(midpoint(buy, sell), { numerator: 3n, denominator: 2n });
    assert.deepEqual(multiply(midpoint(buy, sell), { numerator: 888n, denominator: 1n }), { numerator: 1332n, denominator: 1n });
    assert.equal(spreadBps(buy, sell), 6666n);
  });

  it("keeps numeric values stale through 30 minutes then suppresses them", () => {
    const now = Date.parse("2026-08-03T12:30:00.000Z");
    assert.equal(marketFreshness("2026-08-03T12:29:00.000Z", now), "fresh");
    assert.equal(marketFreshness("2026-08-03T12:25:00.000Z", now), "stale");
    assert.equal(marketFreshness("2026-08-03T12:00:00.000Z", now), "stale");
    assert.equal(marketFreshness("2026-08-03T11:59:59.999Z", now), "unavailable");
  });
});

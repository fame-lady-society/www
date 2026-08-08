import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { marketFreshness } from "./marketStats";

describe("FAME landing price age", () => {
  it("keeps prices for thirty minutes", () => {
    const now = Date.parse("2026-08-03T12:30:00.000Z");
    assert.equal(marketFreshness("2026-08-03T12:29:00.000Z", now), "fresh");
    assert.equal(marketFreshness("2026-08-03T12:25:00.000Z", now), "stale");
    assert.equal(marketFreshness("2026-08-03T12:00:00.000Z", now), "stale");
    assert.equal(
      marketFreshness("2026-08-03T11:59:59.999Z", now),
      "unavailable",
    );
  });
});

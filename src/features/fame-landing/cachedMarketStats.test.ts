import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { composeMarketProjections } from "./cachedMarketStats";

describe("FAME landing projection composition", () => {
  it("keeps sources independent when one cold source fails", async () => {
    const states = await composeMarketProjections({
      market: async () => ({ capturedAt: "2026-08-03T12:29:00.000Z", data: { unit: "1" } }),
      usdcBuy: async () => { throw new Error("offline"); },
    }, Date.parse("2026-08-03T12:30:00.000Z"));
    assert.equal(states.market.status, "available");
    assert.deepEqual(states.usdcBuy, { status: "unavailable", reason: "Market data is unavailable." });
  });
});

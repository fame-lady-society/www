import assert from "node:assert/strict";
import test from "node:test";
import {
  createDeadlineRefreshGate,
  deriveAuctionClock,
} from "./useAuctionClock";

test("interpolates display time without making settlement authoritative", () => {
  const clock = deriveAuctionClock({
    blockTimestamp: 100n,
    endTime: 105n,
    observedAtMs: 1_000,
    nowMs: 7_000,
    canonicalCanBid: true,
    canonicalCanSettle: false,
  });

  assert.equal(clock.displayTimestamp, 106n);
  assert.equal(clock.remainingSeconds, 0n);
  assert.equal(clock.canBid, false);
  assert.equal(clock.canSettle, false);
  assert.equal(clock.shouldRefreshDeadline, true);
});

test("settlement becomes available only from the canonical projection", () => {
  const clock = deriveAuctionClock({
    blockTimestamp: 105n,
    endTime: 105n,
    observedAtMs: 1_000,
    nowMs: 1_000,
    canonicalCanBid: false,
    canonicalCanSettle: true,
  });

  assert.equal(clock.canBid, false);
  assert.equal(clock.canSettle, true);
  assert.equal(clock.shouldRefreshDeadline, false);
});

test("requests one refresh for each observed deadline", () => {
  let refreshes = 0;
  const gate = createDeadlineRefreshGate(() => {
    refreshes += 1;
  });

  gate.request(105n, true);
  gate.request(105n, true);
  gate.request(106n, false);
  gate.request(106n, true);

  assert.equal(refreshes, 2);
});

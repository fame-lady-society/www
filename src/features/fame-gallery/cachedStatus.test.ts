import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FAME_GALLERY_STATUS_FRESH_TTL_MS,
  FAME_GALLERY_STATUS_MAX_AGE_MS,
  presentFameGalleryStatuses,
} from "./cachedStatus";

const now = 2_000_000;
const snapshot = (observedAt: number, membershipFingerprint = "current") => ({
  observedAt,
  membershipFingerprint,
  statuses: { "1": "owned" as const },
});

describe("FAME Gallery cached status presentation", () => {
  it("keeps a matching snapshot fresh below five minutes", () => {
    const result = presentFameGalleryStatuses(snapshot(now - FAME_GALLERY_STATUS_FRESH_TTL_MS + 1), "current", now);
    assert.equal(result.freshness, "fresh");
    assert.deepEqual(result.statuses, { "1": "owned" });
  });

  it("keeps a matching retained snapshot explicitly stale from five through thirty minutes", () => {
    const atFiveMinutes = presentFameGalleryStatuses(snapshot(now - FAME_GALLERY_STATUS_FRESH_TTL_MS), "current", now);
    const atThirtyMinutes = presentFameGalleryStatuses(snapshot(now - FAME_GALLERY_STATUS_MAX_AGE_MS), "current", now);
    assert.equal(atFiveMinutes.freshness, "stale");
    assert.equal(atThirtyMinutes.freshness, "stale");
    assert.equal(atThirtyMinutes.observedAt, now - FAME_GALLERY_STATUS_MAX_AGE_MS);
    assert.deepEqual(atThirtyMinutes.statuses, { "1": "owned" });
  });

  it("suppresses old status badges after thirty minutes while retaining the observation time", () => {
    const observedAt = now - FAME_GALLERY_STATUS_MAX_AGE_MS - 1;
    const result = presentFameGalleryStatuses(snapshot(observedAt), "current", now);
    assert.equal(result.freshness, "unavailable");
    assert.equal(result.observedAt, observedAt);
    assert.deepEqual(result.statuses, {});
  });

  it("maps cold failure and membership mismatch to unknown decorations", () => {
    assert.deepEqual(presentFameGalleryStatuses(null, "current", now), {
      freshness: "unavailable",
      observedAt: null,
      statuses: {},
    });
    assert.deepEqual(presentFameGalleryStatuses(snapshot(now, "old"), "current", now), {
      freshness: "unavailable",
      observedAt: null,
      statuses: {},
    });
  });
});

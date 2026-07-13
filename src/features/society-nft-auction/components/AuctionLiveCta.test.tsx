import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AUCTION_CTA_TIMING_FUNCTIONS,
  auctionLiveCtaTimerDelay,
  AuctionLiveCtaView,
  createAuctionLiveCtaReadContracts,
  deriveAuctionLiveCtaWindow,
} from "./AuctionLiveCta";

const auctionAddress = "0x6536A328419785212BD4DA43F4E5155af60dB7D2";

describe("auction live CTA", () => {
  it("loads both fixed timestamps through one read-contracts query", () => {
    assert.deepEqual(AUCTION_CTA_TIMING_FUNCTIONS, ["startTime", "endTime"]);
    assert.deepEqual(createAuctionLiveCtaReadContracts(null), []);
    assert.deepEqual(
      createAuctionLiveCtaReadContracts(auctionAddress).map(
        (contract) => contract.functionName,
      ),
      ["startTime", "endTime"],
    );
  });

  it("is visible only during the active onchain window", () => {
    const live = (
      startTime: bigint | undefined,
      endTime: bigint | undefined,
      nowMs: number,
    ) => deriveAuctionLiveCtaWindow({ startTime, endTime, nowMs }).live;

    assert.equal(live(100n, 200n, 99_000), false);
    assert.equal(live(100n, 200n, 100_000), true);
    assert.equal(live(100n, 200n, 199_999), true);
    assert.equal(live(100n, 200n, 200_000), false);
    assert.equal(live(0n, 0n, 100_000), false);
    assert.equal(live(undefined, undefined, 100_000), false);
  });

  it("caps distant boundaries so the local timer can re-arm", () => {
    assert.equal(auctionLiveCtaTimerDelay(null, 100_000), null);
    assert.equal(auctionLiveCtaTimerDelay(200_000, 100_000), 100_025);
    assert.equal(auctionLiveCtaTimerDelay(3_000_000_000, 0), 2_147_483_647);
  });

  it("schedules only the next local start or end boundary", () => {
    const cases = [
      {
        name: "unconfigured timestamps",
        input: { startTime: undefined, endTime: undefined, nowMs: 100_000 },
        expected: { live: false, nextBoundaryMs: null },
      },
      {
        name: "unstarted timestamps",
        input: { startTime: 0n, endTime: 0n, nowMs: 100_000 },
        expected: { live: false, nextBoundaryMs: null },
      },
      {
        name: "before start",
        input: { startTime: 100n, endTime: 200n, nowMs: 99_000 },
        expected: { live: false, nextBoundaryMs: 100_000 },
      },
      {
        name: "live",
        input: { startTime: 100n, endTime: 200n, nowMs: 150_000 },
        expected: { live: true, nextBoundaryMs: 200_000 },
      },
      {
        name: "ended",
        input: { startTime: 100n, endTime: 200n, nowMs: 200_000 },
        expected: { live: false, nextBoundaryMs: null },
      },
      {
        name: "invalid range",
        input: { startTime: 200n, endTime: 100n, nowMs: 150_000 },
        expected: { live: false, nextBoundaryMs: null },
      },
    ] as const;

    for (const { name, input, expected } of cases) {
      assert.deepEqual(deriveAuctionLiveCtaWindow(input), expected, name);
    }
  });

  it("renders the live auction content and link", () => {
    const html = renderToStaticMarkup(<AuctionLiveCtaView />);

    assert.match(html, /Auction live/);
    assert.match(html, /The Number One Ranked Fame Lady/);
    assert.match(html, /href="\/fame\/auction"/);
    assert.match(html, /View live auction/);
  });
});

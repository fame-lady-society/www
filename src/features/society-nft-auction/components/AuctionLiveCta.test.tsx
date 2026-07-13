import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AuctionLiveCtaView,
  deriveAuctionLiveCtaState,
  isAuctionLive,
} from "./AuctionLiveCta";

describe("auction live CTA", () => {
  it("is visible only during the active onchain window", () => {
    assert.equal(isAuctionLive(0, 200n, 100n), false);
    assert.equal(isAuctionLive(1, 200n, 100n), true);
    assert.equal(isAuctionLive(1, 200n, 200n), false);
    assert.equal(isAuctionLive(2, 200n, 100n), false);
    assert.equal(isAuctionLive(undefined, undefined, undefined), false);
  });

  it("enables watchers only for their relevant lifecycle window", () => {
    const cases = [
      {
        name: "unconfigured",
        input: { configured: false, lifecycle: undefined },
        expected: [false, false, false],
      },
      {
        name: "unknown lifecycle",
        input: { configured: true, lifecycle: undefined },
        expected: [false, false, false],
      },
      {
        name: "unstarted",
        input: { configured: true, lifecycle: 0 },
        expected: [false, true, false],
      },
      {
        name: "live",
        input: {
          configured: true,
          lifecycle: 1,
          endTime: 200n,
          blockTimestamp: 199n,
        },
        expected: [true, false, true],
      },
      {
        name: "deadline reached",
        input: {
          configured: true,
          lifecycle: 1,
          endTime: 200n,
          blockTimestamp: 200n,
        },
        expected: [false, false, false],
      },
      {
        name: "retained deadline",
        input: {
          configured: true,
          lifecycle: 1,
          endTime: 200n,
          retainedDeadlineReached: true,
        },
        expected: [false, false, false],
      },
      {
        name: "settled",
        input: { configured: true, lifecycle: 2 },
        expected: [false, false, false],
      },
    ] as const;

    for (const { name, input, expected } of cases) {
      const state = deriveAuctionLiveCtaState({
        endTime: undefined,
        blockTimestamp: undefined,
        ...input,
      });
      assert.deepEqual(
        [
          state.blockWatcherEnabled,
          state.startWatcherEnabled,
          state.settlementWatcherEnabled,
        ],
        expected,
        name,
      );
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

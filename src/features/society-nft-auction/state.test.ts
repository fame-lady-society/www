import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import {
  buildAuctionSnapshot,
  projectAuctionPage,
  validateBidAmount,
} from "./state";

const auctionAddress = "0x1111111111111111111111111111111111111111" as Address;
const societyNft = "0x2222222222222222222222222222222222222222" as Address;
const bidder = "0x3333333333333333333333333333333333333333" as Address;
const recipient = "0x4444444444444444444444444444444444444444" as Address;

function snapshot(lifecycle: 0 | 1 | 2) {
  return buildAuctionSnapshot({
    auctionAddress,
    societyNft,
    lifecycle,
    tokenId: 144n,
    startTime: 1_000n,
    endTime: 2_000n,
    highestBidder: bidder,
    highestBid: 1_000_000_000_000_000_000n,
    settledRecipient: recipient,
  });
}

describe("Society NFT auction lifecycle projection", () => {
  it("stays non-interactive while the latest block time is loading", () => {
    const result = projectAuctionPage(snapshot(1), null);

    assert.deepEqual(result, {
      kind: "loading",
      message: "Loading auction",
      canBid: false,
      canSettle: false,
    });
  });

  it("keeps an unstarted auction lot-free and non-interactive", () => {
    const result = projectAuctionPage(snapshot(0), 999n);

    assert.equal(result.kind, "unstarted");
    assert.equal(result.message, "Auction has not started");
    assert.equal(result.canBid, false);
    assert.equal(result.canSettle, false);
    assert.equal("lot" in result, false);
    assert.equal("metadata" in result, false);
  });

  it("uses the exact onchain deadline as the active/ended boundary", () => {
    const active = projectAuctionPage(snapshot(1), 1_500n);
    assert.equal(active.kind, "active");
    assert.equal(active.canBid, true);
    assert.equal(active.canSettle, false);

    const finalActiveSecond = projectAuctionPage(snapshot(1), 1_999n);
    assert.equal(finalActiveSecond.kind, "active");

    const ended = projectAuctionPage(snapshot(1), 2_000n);
    assert.equal(ended.kind, "ended_unsettled");
    assert.equal(ended.canBid, false);
    assert.equal(ended.canSettle, true);
  });

  it("projects settled recipient and winning bid from settled state", () => {
    const result = projectAuctionPage(snapshot(2), 2_500n);

    assert.equal(result.kind, "settled");
    if (result.kind !== "settled") assert.fail("expected settled projection");
    assert.equal(result.canBid, false);
    assert.equal(result.canSettle, false);
    assert.equal(result.settledRecipient, recipient);
    assert.equal(result.winningBid, 1_000_000_000_000_000_000n);
  });

  it("turns incomplete required reads into a retryable failure", () => {
    const partial = buildAuctionSnapshot({
      auctionAddress,
      societyNft,
      lifecycle: 1,
      tokenId: 144n,
      startTime: 1_000n,
      endTime: undefined,
      highestBidder: bidder,
      highestBid: 1n,
      settledRecipient: recipient,
    });

    const result = projectAuctionPage(partial, 1_500n);
    assert.equal(result.kind, "failure");
    if (result.kind !== "failure") assert.fail("expected failure projection");
    assert.equal(result.retryable, true);
    assert.match(result.message, /endTime/);
  });

  it("does not expose failed-refund accounting in snapshots or projections", () => {
    const built = snapshot(1);
    const result = projectAuctionPage(built, 1_500n);

    assert.equal("failedRefundDonations" in built, false);
    assert.equal("failedRefundDonations" in result, false);
  });
});

describe("exact ETH bid validation", () => {
  const highestBid = 1_000_000_000_000_000_000n;

  it("rejects zero, equal, below, exponent, negative, and over-precision bids", () => {
    for (const amount of [
      "0",
      "1",
      "0.999999999999999999",
      "1e1",
      "-2",
      "1.0000000000000000001",
    ]) {
      assert.equal(validateBidAmount(amount, highestBid).valid, false, amount);
    }
  });

  it("accepts exactly one wei above the current bid", () => {
    assert.deepEqual(validateBidAmount("1.000000000000000001", highestBid), {
      valid: true,
      wei: 1_000_000_000_000_000_001n,
    });
  });

  it("parses fractional ETH directly into bigint wei", () => {
    assert.deepEqual(validateBidAmount("0.000000000000000001", 0n), {
      valid: true,
      wei: 1n,
    });
    assert.deepEqual(validateBidAmount("12.34", 0n), {
      valid: true,
      wei: 12_340_000_000_000_000_000n,
    });
  });
});

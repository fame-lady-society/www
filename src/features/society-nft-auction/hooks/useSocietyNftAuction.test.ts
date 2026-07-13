import assert from "node:assert/strict";
import test from "node:test";
import { zeroAddress } from "viem";
import type {
  AuctionActiveProjection,
  AuctionUnstartedProjection,
} from "../types";
import {
  AUCTION_SNAPSHOT_FUNCTIONS,
  type CanonicalAuctionRefreshRead,
  createSocietyNftAuctionReadContracts,
  mapSocietyNftAuctionReads,
  metadataTargetFromProjection,
  prepareAuctionAction,
  refreshCanonicalAuction,
} from "./useSocietyNftAuction";

const auctionAddress = "0x6536A328419785212BD4DA43F4E5155af60dB7D2";
const societyNft = "0xBB5ED04dD7B207592429eb8d599d103CCad646c4";
const bidder = "0x00000000000000000000000000000000000000B1";

function successfulRefreshReads(): CanonicalAuctionRefreshRead[] {
  return AUCTION_SNAPSHOT_FUNCTIONS.map(() => ({
    status: "success",
    result: null,
  }));
}

test("maps the complete required read tuple in stable order", () => {
  assert.deepEqual(AUCTION_SNAPSHOT_FUNCTIONS, [
    "SOCIETY_NFT",
    "lifecycle",
    "tokenId",
    "startTime",
    "endTime",
    "highestBidder",
    "highestBid",
    "settledRecipient",
  ]);

  const result = mapSocietyNftAuctionReads(auctionAddress, [
    societyNft,
    1,
    144n,
    1_000n,
    2_000n,
    bidder,
    3n,
    zeroAddress,
  ]);

  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.equal(result.snapshot.tokenId, 144n);
    assert.equal(result.snapshot.highestBid, 3n);
  }
});

test("fails closed when a required read is missing", () => {
  const result = mapSocietyNftAuctionReads(auctionAddress, [
    societyNft,
    1,
    144n,
  ]);

  assert.equal(result.status, "failure");
});

test("missing configuration produces no contract calls", () => {
  assert.deepEqual(createSocietyNftAuctionReadContracts(null), []);
  assert.equal(
    metadataTargetFromProjection({
      kind: "unstarted",
      message: "Auction has not started",
      auctionAddress,
      societyNft,
      canBid: false,
      canSettle: false,
    } satisfies AuctionUnstartedProjection),
    null,
  );
});

test("metadata is requested only for a started lot", () => {
  assert.deepEqual(
    metadataTargetFromProjection({
      kind: "active",
      message: "Auction is live",
      auctionAddress,
      societyNft,
      lot: { tokenId: 144n },
      startTime: 1_000n,
      endTime: 2_000n,
      highestBidder: bidder,
      highestBid: 1n,
      canBid: true,
      canSettle: false,
    } satisfies AuctionActiveProjection),
    { societyNft, tokenId: 144n },
  );
});

test("canonical refresh rejects when either required refetch fails", async () => {
  const failure = new Error("block RPC unavailable");

  await assert.rejects(
    refreshCanonicalAuction(
      async () => ({
        error: null,
        data: successfulRefreshReads(),
      }),
      async () => ({ error: failure, data: undefined }),
    ),
    failure,
  );
});

test("canonical refresh rejects a partial required-read failure", async () => {
  const reads = successfulRefreshReads();
  reads[3] = { status: "failure" };

  await assert.rejects(
    refreshCanonicalAuction(
      async () => ({ error: null, data: reads }),
      async () => ({ error: null, data: { timestamp: 1_000n } }),
    ),
    /incomplete data/i,
  );
});

test("canonical refresh can recover the active minimum-bid read", async () => {
  let minimumReadAttempts = 0;

  await refreshCanonicalAuction(
    async () => ({
      error: null,
      data: successfulRefreshReads(),
    }),
    async () => ({ error: null, data: { timestamp: 1_000n } }),
    async () => {
      minimumReadAttempts += 1;
      return { error: null, data: 1_100_000_000_000_000_000n };
    },
  );

  assert.equal(minimumReadAttempts, 1);
  const withoutMinimum = await refreshCanonicalAuction(
    async () => ({
      error: null,
      data: successfulRefreshReads(),
    }),
    async () => ({ error: null, data: { timestamp: 1_000n } }),
    async () => ({ error: new Error("BiddingClosed"), data: undefined }),
  );
  assert.equal(withoutMinimum.minimumNextBid, null);
});

test("deadline refresh skips the minimum read after projecting the fresh state", async () => {
  let minimumReadAttempts = 0;
  const refreshed = await refreshCanonicalAuction(
    async () => ({
      error: null,
      data: [
        { status: "success", result: societyNft },
        { status: "success", result: 1 },
        { status: "success", result: 144n },
        { status: "success", result: 1_000n },
        { status: "success", result: 2_000n },
        { status: "success", result: bidder },
        { status: "success", result: 10n },
        { status: "success", result: zeroAddress },
      ],
    }),
    async () => ({ error: null, data: { timestamp: 2_000n } }),
    async () => {
      minimumReadAttempts += 1;
      return { error: new Error("BiddingClosed"), data: undefined };
    },
    (canonical) =>
      prepareAuctionAction(auctionAddress, canonical).projection.kind ===
      "active",
  );

  assert.equal(minimumReadAttempts, 0);
  assert.equal(
    prepareAuctionAction(auctionAddress, refreshed).projection.kind,
    "ended_unsettled",
  );
});

test("prepares an action from the freshly returned snapshot and minimum", async () => {
  const refreshed = await refreshCanonicalAuction(
    async () => ({
      error: null,
      data: [
        { status: "success", result: societyNft },
        { status: "success", result: 1 },
        { status: "success", result: 144n },
        { status: "success", result: 1_000n },
        { status: "success", result: 2_000n },
        { status: "success", result: bidder },
        { status: "success", result: 10n },
        { status: "success", result: zeroAddress },
      ],
    }),
    async () => ({ error: null, data: { timestamp: 1_500n } }),
    async () => ({ error: null, data: 11n }),
  );

  const prepared = prepareAuctionAction(auctionAddress, refreshed);
  assert.equal(prepared.projection.kind, "active");
  assert.equal(prepared.minimumNextBid, 11n);
});

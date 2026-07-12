import assert from "node:assert/strict";
import test from "node:test";
import { zeroAddress } from "viem";
import {
  AUCTION_SNAPSHOT_FUNCTIONS,
  createCoalescedAuctionRefresh,
  createSocietyNftAuctionReadContracts,
  mapSocietyNftAuctionReads,
  metadataTargetFromProjection,
} from "./useSocietyNftAuction";

const auctionAddress = "0x6536A328419785212BD4DA43F4E5155af60dB7D2";
const societyNft = "0xBB5ED04dD7B207592429eb8d599d103CCad646c4";
const bidder = "0x00000000000000000000000000000000000000B1";

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
  assert.equal(metadataTargetFromProjection({ kind: "unstarted" }), null);
});

test("metadata is requested only for a started lot", () => {
  assert.deepEqual(
    metadataTargetFromProjection({
      kind: "active",
      societyNft,
      lot: { tokenId: 144n },
    }),
    { societyNft, tokenId: 144n },
  );
});

test("auction events coalesce into one canonical refresh", async () => {
  let refreshes = 0;
  const onAuctionEvent = createCoalescedAuctionRefresh(() => {
    refreshes += 1;
  });

  // Started, bid, and settled handlers all use this same callback. Logs never
  // supply state to it; they are only freshness hints.
  onAuctionEvent();
  onAuctionEvent();
  onAuctionEvent();
  assert.equal(refreshes, 0);

  await new Promise<void>((resolve) => queueMicrotask(resolve));
  assert.equal(refreshes, 1);
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Address } from "viem";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import { GalleryPurchaseModalContent, GalleryViewContent } from "./GalleryView";
import { ListingCardView } from "./ListingCard";
import {
  galleryPurchaseReducer,
  initialGalleryPurchaseState,
  type GalleryAcquiredNft,
} from "../transactions/purchaseQueue";
import {
  acquiredNftLatestOwner,
  AcquiredNftResultView,
} from "./AcquiredNftResult";

describe("TEST gallery public view", () => {
  it("distinguishes loading, failed, verified-empty, and incomplete discovery", () => {
    const loading = renderToStaticMarkup(
      <GalleryViewContent state={{ status: "loading" }} />,
    );
    const failed = renderToStaticMarkup(
      <GalleryViewContent
        state={{ status: "failure", message: "RPC unavailable" }}
        onRefresh={() => undefined}
      />,
    );
    const empty = renderToStaticMarkup(
      <GalleryViewContent state={{ status: "empty" }} />,
    );
    const incomplete = renderToStaticMarkup(
      <GalleryViewContent
        state={{ status: "incomplete" }}
        onRefresh={() => undefined}
      >
        <div>Verified token #2</div>
      </GalleryViewContent>,
    );

    assert.match(loading, /Loading TEST gallery/);
    assert.doesNotMatch(loading, /Buy with TEST/);
    assert.match(failed, /RPC unavailable|Try again/);
    assert.match(empty, /No active TEST listings/);
    assert.match(incomplete, /Discovery is incomplete/);
    assert.match(incomplete, /Verified token #2/);
  });

  it("shows canonical payment facts while metadata uses fallback art", () => {
    const html = renderToStaticMarkup(
      <ListingCardView
        tokenId={7n}
        unit={1_000_000n * 10n ** 18n}
        premium={1_000n * 10n ** 18n}
        metadata={decodeTestGalleryMetadata("bad uri")}
        onBuy={() => undefined}
      />,
    );

    assert.match(html, /Society NFT #7/);
    assert.match(html, /1,000,000 TEST/);
    assert.match(html, /1,000 TEST/);
    assert.match(html, /1,001,000 TEST/);
    assert.match(html, /Artwork unavailable/);
    assert.match(html, /Buy with TEST/);
    assert.match(html, /Recipient \(optional\)/);
    assert.doesNotMatch(html, /eligible|allowlist|deployment flag/i);
  });

  it("keeps a broadcast transaction visible when receipt lookup is unknown", () => {
    const hash = `0x${"a".repeat(64)}` as `0x${string}`;
    const broadcast = galleryPurchaseReducer(initialGalleryPurchaseState, {
      type: "broadcast",
      kind: "fill",
      hash,
    });
    const unknown = galleryPurchaseReducer(broadcast, {
      type: "outcome_unknown",
      kind: "fill",
      cause: new Error("RPC unavailable"),
    });
    const html = renderToStaticMarkup(
      <GalleryPurchaseModalContent
        state={unknown}
        onDone={() => undefined}
        onRetryVerification={() => undefined}
      />,
    );

    assert.match(html, /receipt could not be confirmed/);
    assert.match(html, /View gallery purchase/);
    assert.match(html, /Done/);
  });

  it("shows the verified NFT outcome even when artwork metadata fails", () => {
    const acquiredNft: GalleryAcquiredNft = {
      transactionHash: `0x${"a".repeat(64)}`,
      receiptBlockNumber: 101n,
      buyer: "0x1111111111111111111111111111111111111111",
      recipient: "0x2222222222222222222222222222222222222222",
      tokenId: 7n,
      unit: 1_000n * 10n ** 18n,
      premium: 50n * 10n ** 18n,
      total: 1_050n * 10n ** 18n,
      inventoryBefore: 10n,
      inventoryAfter: 11n,
      receiptBlockInventory: 11n,
      receiptBlockAccruedFees: 70n,
      currentOwner: "0x3333333333333333333333333333333333333333",
      listingActive: false,
      tokenUri: null,
    };
    const html = renderToStaticMarkup(
      <AcquiredNftResultView
        result={acquiredNft}
        metadata={decodeTestGalleryMetadata("")}
        latestOwner="0x4444444444444444444444444444444444444444"
      />,
    );

    assert.match(html, /Society NFT #7/);
    assert.match(html, /Recipient:/);
    assert.match(html, /Owner at end of receipt block:/);
    assert.match(html, /Current owner:/);
    assert.match(html, /Paid: 1,050 TEST/);
    assert.match(html, /Artwork unavailable/);
    assert.match(html, /View verified purchase/);
    assert.doesNotMatch(html, /export|report/i);
  });

  it("does not label a pre-receipt token projection as the current owner", () => {
    const owner = "0x2222222222222222222222222222222222222222" as Address;
    const projection = {
      status: "success" as const,
      blockNumber: 99n,
      data: {
        tokenId: 7n,
        listing: { premium: 0n, active: false },
        owner,
        tokenUri: "",
      },
    };

    assert.equal(acquiredNftLatestOwner(projection, 100n), null);
    assert.equal(acquiredNftLatestOwner(projection, 99n), owner);
  });
});

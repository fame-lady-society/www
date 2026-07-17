import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import { GalleryViewContent } from "./GalleryView";
import { ListingCardView } from "./ListingCard";

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
        walletConnected={false}
        onBuy={() => undefined}
      />,
    );

    assert.match(html, /Society NFT #7/);
    assert.match(html, /1,000,000 TEST/);
    assert.match(html, /1,000 TEST/);
    assert.match(html, /1,001,000 TEST/);
    assert.match(html, /Artwork unavailable/);
    assert.match(html, /Buy with TEST/);
    assert.doesNotMatch(html, /eligible|allowlist|deployment flag/i);
  });
});

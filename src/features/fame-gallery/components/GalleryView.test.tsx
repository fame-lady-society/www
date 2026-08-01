import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import { FAME, USDC } from "../../fame-swap/tokens";
import type { GalleryCheckoutQuote } from "../types";
import { ArtworkCard } from "./ArtworkCard";
import {
  GalleryArtworkGrid,
  GalleryFundingLink,
  GalleryPaymentPanel,
  GalleryViewContent,
  type PresentedGalleryArtwork,
} from "./GalleryView";

function dataUri(mime: string, value: string) {
  return `data:${mime};base64,${Buffer.from(value).toString("base64")}`;
}

function readyMetadata(name: string) {
  return decodeTestGalleryMetadata(
    dataUri(
      "application/json",
      JSON.stringify({
        name,
        description: "On-chain test art",
        image: dataUri(
          "image/svg+xml",
          '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>',
        ),
      }),
    ),
  );
}

const price = 1_001_000n * 10n ** 18n;

const checkoutQuote: GalleryCheckoutQuote = {
  paymentAsset: "USDC",
  inputToken: USDC,
  checkout: "0x1111111111111111111111111111111111111111",
  marketplace: "0x2222222222222222222222222222222222222222",
  quoteBlockNumber: 49_000_000n,
  routeId: "usdc-route",
  routeHash: `0x${"33".repeat(32)}`,
  route: {
    version: 1,
    tokenIn: USDC,
    tokenOut: FAME,
    amountIn: 12_340_000n,
    minAmountOutAfterFee: price,
    recipient: "0x1111111111111111111111111111111111111111",
    deadline: 1_900_000_000n,
    legs: [],
  },
  marketplaceUnit: 1_000_000n * 10n ** 18n,
  marketplacePremium: 1_000n * 10n ** 18n,
  maximumPremium: 1_000n * 10n ** 18n,
  marketplaceFameCharge: price,
  maximumInput: 12_340_000n,
  estimatedInputResidue: 10_000n,
  protectedFame: price + 100n * 10n ** 18n,
  estimatedFameOutput: price + 200n * 10n ** 18n,
  estimatedSurplusFame: 200n * 10n ** 18n,
  expiresAt: new Date("2030-01-01T00:00:00Z"),
};

describe("TEST gallery public view", () => {
  it("shows the funded maximum, FAME charge, residue, protection, and liquidity refund copy", () => {
    const html = renderToStaticMarkup(
      <GalleryPaymentPanel
        paymentAsset="USDC"
        checkoutEnabled
        marketplaceFameCharge={price}
        quote={checkoutQuote}
        quoteLoading={false}
        quoteError={null}
        locked={false}
        onPaymentAssetChange={() => undefined}
        onRefreshQuote={() => undefined}
      />,
    );

    assert.match(html, /Maximum input funded/);
    assert.match(html, /12.34 USDC/);
    assert.match(html, /Marketplace FAME charge/);
    assert.match(html, /Estimated input residue/);
    assert.match(html, /Protected FAME/);
    assert.match(html, /Estimated surplus FAME/);
    assert.match(html, /returned to your wallet as FAME/);
    assert.match(html, /depends on liquidity when the transaction executes/);
    assert.doesNotMatch(html, /warning|high refund|unusual/i);
  });

  it("links Base buyers to the full swap page without embedding a widget", () => {
    const baseFunding = renderToStaticMarkup(
      <GalleryFundingLink chainId={8_453} />,
    );
    const testnetFunding = renderToStaticMarkup(
      <GalleryFundingLink chainId={84_532} />,
    );

    assert.match(baseFunding, /href="\/fame\/swap"/);
    assert.match(baseFunding, /Get FAME/);
    assert.equal(testnetFunding, "");
  });

  it("distinguishes loading, failed, incomplete, and successful-empty catalog states", () => {
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
      <GalleryViewContent state={{ status: "incomplete" }} />,
    );

    assert.match(loading, /Loading TEST gallery/);
    assert.doesNotMatch(loading, /Buy with TEST/);
    assert.match(failed, /RPC unavailable/);
    assert.match(failed, /Try again/);
    assert.match(empty, /No artwork is available right now/);
    assert.doesNotMatch(empty, /listing|inventory|pool/i);
    assert.match(incomplete, /Artwork availability could not be confirmed/);
    assert.match(incomplete, /Reload this page to try again/);
    assert.doesNotMatch(incomplete, /No artwork is available right now/);
  });

  it("presents artwork and one global TEST price without route mechanics", () => {
    const artworks: PresentedGalleryArtwork[] = [
      { stableKey: "one", metadata: readyMetadata("Sunrise") },
      { stableKey: "two", metadata: readyMetadata("Sunrise") },
    ];
    const html = renderToStaticMarkup(
      <GalleryViewContent state={{ status: "ready" }}>
        <GalleryArtworkGrid
          artworks={artworks}
          totalPrice={price}
          onBuy={() => undefined}
          onRetry={() => undefined}
        />
      </GalleryViewContent>,
    );

    assert.equal(html.match(/1,001,000 TEST/g)?.length, 1);
    assert.equal(html.match(/Buy with TEST/g)?.length, 2);
    assert.equal(html.match(/Sunrise/g)?.length, 4);
    assert.doesNotMatch(html, /On-chain test art/);
    assert.doesNotMatch(
      html,
      /token\s*#|token id|recipient|premium|unit|listing|inventory|mint pool|burn pool|held:/i,
    );
  });

  it("shows retryable unavailable artwork without a Buy action", () => {
    const html = renderToStaticMarkup(
      <ArtworkCard
        metadata={decodeTestGalleryMetadata("bad uri")}
        purchaseLocked={false}
        onBuy={() => undefined}
        onRetry={() => undefined}
      />,
    );

    assert.match(html, /Artwork unavailable/);
    assert.match(html, /Retry/);
    assert.doesNotMatch(html, /Buy with TEST/);
    assert.doesNotMatch(html, /token|route|source|pool|inventory/i);
  });

  it("locks every artwork while a purchase is active", () => {
    const html = renderToStaticMarkup(
      <GalleryArtworkGrid
        artworks={[
          { stableKey: "one", metadata: readyMetadata("Sunrise") },
          { stableKey: "two", metadata: readyMetadata("Moonlight") },
        ]}
        totalPrice={price}
        purchaseLocked
        activeArtworkKey="one"
        onBuy={() => undefined}
        onRetry={() => undefined}
      />,
    );

    assert.equal(html.match(/disabled=""/g)?.length, 2);
    assert.match(html, /Purchase in progress/);
  });

  it("keeps browsing available while purchases are paused", () => {
    const html = renderToStaticMarkup(
      <GalleryViewContent state={{ status: "ready" }} paused>
        <GalleryArtworkGrid
          artworks={[{ stableKey: "one", metadata: readyMetadata("Sunrise") }]}
          totalPrice={price}
          purchaseLocked
          onBuy={() => undefined}
          onRetry={() => undefined}
        />
      </GalleryViewContent>,
    );

    assert.match(html, /Purchases are temporarily paused/);
    assert.match(html, /Sunrise/);
    assert.match(html, /disabled=""/);
  });
});

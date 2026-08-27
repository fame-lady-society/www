import "./headlessUiTestSetup";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FameMetadataResult } from "@/features/fame/metadata";
import type { GalleryArtworkTarget } from "../types";
import {
  GalleryTokenDetailContent,
  GalleryTokenPurchasePanel,
  galleryTokenDetailState,
} from "./GalleryTokenView";

const metadata: FameMetadataResult = {
  status: "ready",
  image: "/images/fame/gold-leaf-square.png",
  name: "Golden Hour",
  description: "A Society artwork in the late afternoon light.",
  attributes: [{ traitType: "Palette", value: "Gold" }],
  error: null,
};

const target: GalleryArtworkTarget = {
  targetId: "held:42",
  kind: "held",
  tokenId: 42n,
  artworkHash: `0x${"22".repeat(32)}`,
  tokenUri: "data:token-uri",
  artworkError: null,
};

const noOp = () => undefined;

function purchasePanel(
  state: Parameters<typeof GalleryTokenPurchasePanel>[0]["state"],
  overrides: Partial<Parameters<typeof GalleryTokenPurchasePanel>[0]> = {},
) {
  return (
    <GalleryTokenPurchasePanel
      state={state}
      totalPrice={1_001_000n * 10n ** 18n}
      tokenSymbol="FAME"
      paymentAsset="FAME"
      checkoutEnabled
      quote={null}
      quoteLoading={false}
      quoteError={null}
      paused={false}
      purchaseLocked={false}
      purchaseInProgress={false}
      artworkReady
      onPaymentAssetChange={noOp}
      onRefreshQuote={noOp}
      onBuy={noOp}
      onRetryAvailability={noOp}
      onRetryArtwork={noOp}
      {...overrides}
    />
  );
}

describe("FAME marketplace token detail page", () => {
  it("maps canonical projections to loading, failure, unlisted, and listed states", () => {
    assert.deepEqual(galleryTokenDetailState({ status: "loading" }), {
      status: "loading",
    });
    assert.deepEqual(
      galleryTokenDetailState({
        status: "failure",
        blockNumber: 1n,
        message: "RPC unavailable",
      }),
      { status: "failure", message: "RPC unavailable" },
    );
    assert.deepEqual(
      galleryTokenDetailState({
        status: "success",
        blockNumber: 2n,
        data: { tokenId: 42n, target: null },
      }),
      { status: "unlisted" },
    );
    assert.deepEqual(
      galleryTokenDetailState({
        status: "success",
        blockNumber: 3n,
        data: { tokenId: 42n, target },
      }),
      { status: "listed", target },
    );
  });

  it("shows marketplace essentials and permanent sharing controls", () => {
    const html = renderToStaticMarkup(
      <GalleryTokenDetailContent
        metadata={metadata}
        onRetryArtwork={noOp}
        onShare={noOp}
        purchasePanel={<div>Purchase controls</div>}
      />,
    );

    assert.match(html, /Golden Hour/);
    assert.doesNotMatch(html, /SOCIETY #42/);
    assert.match(html, /late afternoon light/);
    assert.match(html, /href="\/fame\/market"/u);
    assert.match(html, />Share</u);
    assert.match(html, /Purchase controls/);
    assert.ok(
      html.indexOf("Purchase controls") <
        html.indexOf("A Society artwork in the late afternoon light."),
      "purchase controls should render before the token description",
    );
    assert.doesNotMatch(html, /Palette|artwork hash|owner|contract address/iu);
  });

  it("keeps unlisted tokens readable without a Buy action", () => {
    const html = renderToStaticMarkup(purchasePanel({ status: "unlisted" }));
    assert.match(html, /Not currently for sale/);
    assert.match(html, /permanent page will stay available/);
    assert.doesNotMatch(html, /Buy with/);
  });

  it("fails availability closed with a retry action", () => {
    const html = renderToStaticMarkup(
      purchasePanel({ status: "failure", message: "RPC unavailable" }),
    );
    assert.match(html, /availability could not be confirmed/);
    assert.match(html, /Try again/);
    assert.doesNotMatch(html, /Buy with/);
  });

  it("shows the live price and disables Buy while the marketplace is paused", () => {
    const html = renderToStaticMarkup(
      purchasePanel(
        { status: "listed", target },
        { paused: true, purchaseLocked: true },
      ),
    );
    assert.match(html, /Available now/);
    assert.match(html, /1,001,000 FAME/);
    assert.match(html, /Purchases are temporarily paused/);
    assert.match(html, /<button[^>]*disabled=""[^>]*>Buy with FAME<\/button>/u);
  });

  it("disables purchasing when the artwork preview cannot be confirmed", () => {
    const html = renderToStaticMarkup(
      purchasePanel(
        { status: "listed", target },
        { artworkReady: false, purchaseLocked: true },
      ),
    );
    assert.match(html, /artwork preview could not be confirmed/);
    assert.match(html, /Retry artwork/);
    assert.match(html, /<button[^>]*disabled=""[^>]*>Buy with FAME<\/button>/u);
  });
});

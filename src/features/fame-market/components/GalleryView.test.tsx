import "./headlessUiTestSetup";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import { FAME, USDC, WETH } from "../../fame-swap/tokens";
import type { GalleryCheckoutQuote } from "../types";
import type { GalleryPurchaseState } from "../transactions/purchaseQueue";
import { ArtworkCard } from "./ArtworkCard";
import {
  GalleryArtworkGrid,
  GalleryFundingLink,
  GalleryPaymentPanel,
  GalleryViewContent,
  galleryPurchaseReceiptHref,
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
const displayedFameCharge = price + 600_000_000_000_000_000n;
const purchaseHash = `0x${"44".repeat(32)}` as const;

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
  marketplaceFameCharge: displayedFameCharge,
  maximumInput: 12_345_678n,
  estimatedInputResidue: 10_001n,
  protectedFame: price + 100n * 10n ** 18n,
  estimatedFameOutput: price + 200_600_000_000_000_000_000n,
  estimatedSurplusFame: 200_600_000_000_000_000_000n,
  expiresAt: new Date("2030-01-01T00:00:00Z"),
};

describe("gallery purchase navigation", () => {
  it("links a verified checkout purchase to its transaction receipt page", () => {
    const state: GalleryPurchaseState = {
      status: "verified",
      terms: {
        chainId: 8453,
        account: "0x1111111111111111111111111111111111111111",
        recipient: "0x1111111111111111111111111111111111111111",
        selectedTarget: { targetId: "mint:7", tokenId: 7n },
        artworkHash: `0x${"55".repeat(32)}`,
        unit: 1_000_000n,
        maxPremium: 30_000n,
        maximumSpend: 1n,
        allowanceTarget: "0x2222222222222222222222222222222222222222",
        checkout: {
          paymentAsset: "ETH",
          inputToken: "0x0000000000000000000000000000000000000000",
          checkout: "0x3333333333333333333333333333333333333333",
          marketplace: "0x2222222222222222222222222222222222222222",
          maximumInput: 1n,
          routeHash: `0x${"66".repeat(32)}`,
          routeDeadline: 1_900_000_000n,
          quoteBlockNumber: 49_000_000n,
        },
      },
      approvalHash: null,
      purchaseHash,
      failure: null,
      acquisition: null,
      refreshFailure: null,
    };

    assert.equal(
      galleryPurchaseReceiptHref(state),
      `/fame/market/purchase/${purchaseHash}`,
    );
    assert.equal(
      galleryPurchaseReceiptHref({ ...state, status: "refreshing" }),
      null,
    );
  });
});

describe("TEST gallery public view", () => {
  it("shows concise checkout costs and liquidity refund copy", () => {
    const html = renderToStaticMarkup(
      <GalleryPaymentPanel
        paymentAsset="USDC"
        checkoutEnabled
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
    assert.match(html, /1,001,001 FAME/);
    assert.doesNotMatch(html, /Estimated input residue/);
    assert.doesNotMatch(html, /Protected FAME/);
    assert.match(html, /Estimated surplus FAME/);
    assert.match(html, /201 FAME/);
    assert.match(html, /returned to your wallet as FAME/);
    assert.match(html, /depends on liquidity when the transaction executes/);
    assert.doesNotMatch(html, /warning|high refund|unusual/i);
    assert.match(html, /aria-label="Payment asset"/u);
    assert.match(html, /aria-haspopup="listbox"/u);
    assert.doesNotMatch(html, /<select/u);

    const directHtml = renderToStaticMarkup(
      <GalleryPaymentPanel
        paymentAsset="FAME"
        checkoutEnabled
        quote={null}
        quoteLoading={false}
        quoteError={null}
        locked={false}
        onPaymentAssetChange={() => undefined}
        onRefreshQuote={() => undefined}
      />,
    );
    assert.doesNotMatch(directHtml, /Maximum input funded/);
    assert.doesNotMatch(directHtml, /Marketplace FAME charge/);
    assert.doesNotMatch(directHtml, /1,001,001 FAME/);
  });

  it("limits ETH and WETH checkout amounts to four decimal places", () => {
    const maximumInput = 119_814_123_456_789_000n;
    const residue = 1_234_567_890_000n;
    const renderPayment = (paymentAsset: "ETH" | "WETH") =>
      renderToStaticMarkup(
        <GalleryPaymentPanel
          paymentAsset={paymentAsset}
          checkoutEnabled
          quote={{
            ...checkoutQuote,
            paymentAsset,
            inputToken:
              paymentAsset === "ETH"
                ? "0x0000000000000000000000000000000000000000"
                : WETH,
            maximumInput,
            estimatedInputResidue: residue,
          }}
          quoteLoading={false}
          quoteError={null}
          locked={false}
          onPaymentAssetChange={() => undefined}
          onRefreshQuote={() => undefined}
        />,
      );

    assert.match(renderPayment("ETH"), /0.1198 ETH/);
    assert.match(renderPayment("WETH"), /0.1198 WETH/);
    assert.doesNotMatch(renderPayment("ETH"), /0.119814/);
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

  it("keeps the FAME price while labeling the selected checkout asset", () => {
    const html = renderToStaticMarkup(
      <GalleryArtworkGrid
        artworks={[{ stableKey: "one", metadata: readyMetadata("Sunrise") }]}
        totalPrice={price}
        onBuy={() => undefined}
        onRetry={() => undefined}
        tokenSymbol="FAME"
        purchaseTokenSymbol="ETH"
      />,
    );

    assert.match(html, /1,001,000 FAME/);
    assert.match(html, /Buy with ETH/);
    assert.doesNotMatch(html, /1,001,000 ETH/);
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

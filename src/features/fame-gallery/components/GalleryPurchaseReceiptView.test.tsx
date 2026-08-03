import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Address, Hash } from "viem";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import type { GalleryPurchaseReceiptProjection } from "../transactions/projectPurchaseReceipt";
import { GalleryPurchaseReceiptContent } from "./GalleryPurchaseReceiptView";

function dataUri(mime: string, value: string) {
  return `data:${mime};base64,${Buffer.from(value).toString("base64")}`;
}

const marketplacePurchase: GalleryPurchaseReceiptProjection = {
  transactionHash: `0x${"11".repeat(32)}` as Hash,
  blockNumber: 49_000_001n,
  buyer: "0x1111111111111111111111111111111111111111",
  recipient: "0x1111111111111111111111111111111111111111",
  shellId: 199n,
  path: "mint",
  sourceId: 412n,
  artworkHash: `0x${"22".repeat(32)}` as Hash,
  unit: 1_000_000n * 10n ** 18n,
  premium: 30_000n * 10n ** 18n,
  total: 1_030_000n * 10n ** 18n,
  inventoryBefore: 88n,
  inventoryAfter: 89n,
  metadataUpdatedTokenIds: [199n, 412n],
  checkout: {
    inputAsset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    routeHash: `0x${"33".repeat(32)}` as Hash,
    inputAmount: 123_456_789n,
    inputRefund: 1_000_000n,
    routerFameOutput: 1_040_000n * 10n ** 18n,
    marketplaceFameCharge: 1_030_000n * 10n ** 18n,
    fameRefund: 10_000n * 10n ** 18n,
  },
  route: {
    schemaVersion: 1,
    tokenIn: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    tokenOut: "0xf307e242Bfe1ec1Ff01A4CEf2fDaA81b10a52418",
    amountIn: 123_456_789n,
    grossAmountOut: 1_041_041n * 10n ** 18n,
    feeAmount: 1_041n * 10n ** 18n,
    netAmountOut: 1_040_000n * 10n ** 18n,
  },
};

const mirror = "0x2222222222222222222222222222222222222222" as Address;
const metadata = decodeTestGalleryMetadata(
  dataUri(
    "application/json",
    JSON.stringify({
      name: "FAME Society",
      description: "A metadata-swapped Society artwork.",
      image: dataUri(
        "image/svg+xml",
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>',
      ),
      attributes: [{ trait_type: "Edition", value: "Society" }],
    }),
  ),
);

describe("gallery purchase receipt page", () => {
  it("shows the artwork, actual checkout settlement, swap tokens, and indexing guidance", () => {
    const html = renderToStaticMarkup(
      <GalleryPurchaseReceiptContent
        purchase={marketplacePurchase}
        metadata={metadata}
        mirror={mirror}
        explorerBaseUrl="https://basescan.org"
        forkMode
      />,
    );

    assert.match(html, /You got FAME Society/);
    assert.match(html, /Society #199/);
    assert.match(html, /122\.45 USDC/);
    assert.match(html, /Returned to wallet/);
    assert.match(html, /1 USDC/);
    assert.match(html, /1,030,000 FAME/);
    assert.match(html, /10,000 FAME/);
    assert.match(html, /Mint-pool metadata swap/);
    assert.match(html, /Your token · Society #199/);
    assert.match(html, /Pool token · Society #412/);
    assert.match(html, new RegExp(`opensea\\.io/assets/base/${mirror}/199`));
    assert.match(html, new RegExp(`opensea\\.io/assets/base/${mirror}/412`));
    assert.match(html, /Refresh metadata/);
    assert.match(html, /local Base fork/);
    assert.match(html, /View transaction/);
    assert.match(html, /Back to FAME Marketplace/);
    assert.match(html, /Back to gallery/);
    assert.equal(html.match(/href="\/fame\/gallery"/g)?.length, 2);
  });

  it("explains a direct held-token delivery without inventing a metadata swap", () => {
    const html = renderToStaticMarkup(
      <GalleryPurchaseReceiptContent
        purchase={{
          ...marketplacePurchase,
          path: "held",
          sourceId: null,
          checkout: null,
          route: null,
          metadataUpdatedTokenIds: [],
        }}
        metadata={metadata}
        mirror={mirror}
        explorerBaseUrl="https://basescan.org"
        forkMode={false}
      />,
    );

    assert.match(html, /Held artwork delivery/);
    assert.match(html, /no metadata swap was needed/);
    assert.doesNotMatch(html, /Pool token/);
    assert.doesNotMatch(html, /local Base fork/);
  });
});

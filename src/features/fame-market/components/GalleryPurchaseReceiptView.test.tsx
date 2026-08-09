import assert from "node:assert/strict";
// @ts-expect-error Bun runs this test, but the application tsconfig excludes Bun's ambient types.
import { describe, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Address, Hash } from "viem";
import {
  GalleryRuntimeProvider,
  type GalleryRuntimeConfig,
} from "../config/galleryRuntime";
import { decodeTestGalleryMetadata } from "../metadata/testMetadata";
import type { GalleryPurchaseReceiptProjection } from "../transactions/projectPurchaseReceipt";

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
  grossPremiumAmount: 30_000n * 10n ** 18n,
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
const metadataUri = dataUri(
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
);
const metadata = decodeTestGalleryMetadata(metadataUri);
const receipt = {
  status: "success" as const,
  transactionHash: marketplacePurchase.transactionHash,
  blockNumber: marketplacePurchase.blockNumber,
  logs: [],
};
const mintPoolStartReads: Array<Record<string, unknown>> = [];

mock.module("wagmi", () => ({
  useReadContract: () => ({ data: metadataUri }),
  useTransactionReceipt: () => ({
    data: receipt,
    isPending: false,
    isError: false,
    refetch: () => Promise.resolve(),
  }),
}));
mock.module("@/wagmi", () => ({
  creatorArtistMagicAbi: [],
  useReadCreatorArtistMagicGetMintPoolStart: (
    parameters: Record<string, unknown>,
  ) => {
    mintPoolStartReads.push(parameters);
    return {
      data: undefined,
      isError: true,
      error: new Error("mint-pool boundary unavailable"),
    };
  },
}));
mock.module("../hooks/useGalleryMetadata", () => ({
  useGalleryMetadata: () => ({
    metadata,
    isLoading: false,
    retry: () => Promise.resolve(),
  }),
}));
mock.module("../transactions/projectPurchaseReceipt", () => ({
  projectGalleryPurchaseReceipt: () => marketplacePurchase,
}));

const { GalleryPurchaseReceiptContent, GalleryPurchaseReceiptView } =
  await import("./GalleryPurchaseReceiptView");

const runtime: GalleryRuntimeConfig = {
  schemaVersion: 1,
  chainId: 8453,
  forkMode: false,
  addresses: {
    fame: "0x1111111111111111111111111111111111111111",
    mirror,
    creatorMagic: "0x3333333333333333333333333333333333333333",
    gallery: "0x4444444444444444444444444444444444444444",
  },
  checkout: null,
  token: { name: "FAME", symbol: "FAME" },
  collection: { firstTokenId: 1, lastTokenId: 9999 },
  deployment: { blockNumber: 1n },
  explorerBaseUrl: "https://basescan.org",
  labels: {
    title: "FAME Marketplace",
    description: "Test marketplace",
    network: "Base",
  },
};

describe("gallery purchase receipt page", () => {
  it("shows the artwork, actual checkout settlement, swap tokens, and indexing guidance", () => {
    const html = renderToStaticMarkup(
      <GalleryPurchaseReceiptContent
        purchase={marketplacePurchase}
        metadata={metadata}
        mirror={mirror}
        explorerBaseUrl="https://basescan.org"
        forkMode
        mintPoolStart={413n}
      />,
    );

    assert.match(html, /You got FAME Society/);
    assert.match(html, /Society #199/);
    assert.match(html, /122\.45 USDC/);
    assert.match(html, /Returned to wallet/);
    assert.match(html, /Net input paid/);
    assert.doesNotMatch(html, /Direct FAME payment/);
    assert.match(html, /1 USDC/);
    assert.match(html, /1,030,000 FAME/);
    assert.match(html, /Gross marketplace premium/);
    assert.doesNotMatch(html, /net (?:wallet )?(?:loss|cost)/i);
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
    assert.equal(html.match(/Back to FAME Marketplace/g)?.length, 2);
    assert.equal(html.match(/href="\/fame\/market"/g)?.length, 2);
  });

  it("does not link a never-minted token at the mint-pool boundary", () => {
    const html = renderToStaticMarkup(
      <GalleryPurchaseReceiptContent
        purchase={marketplacePurchase}
        metadata={metadata}
        mirror={mirror}
        explorerBaseUrl="https://basescan.org"
        forkMode={false}
        mintPoolStart={412n}
      />,
    );

    assert.match(html, /Your token · Society #199/);
    assert.match(html, /Pool token · Society #412/);
    assert.match(html, new RegExp(`opensea\\.io/assets/base/${mirror}/199`));
    assert.doesNotMatch(
      html,
      new RegExp(`opensea\\.io/assets/base/${mirror}/412`),
    );
    assert.doesNotMatch(html, /new artwork on both tokens/);
  });

  it("keeps both token records unlinked while the mint-pool boundary is unavailable", () => {
    const html = renderToStaticMarkup(
      <GalleryPurchaseReceiptContent
        purchase={marketplacePurchase}
        metadata={metadata}
        mirror={mirror}
        explorerBaseUrl="https://basescan.org"
        forkMode
        mintPoolStart={null}
      />,
    );

    assert.match(html, /Your token · Society #199/);
    assert.match(html, /Pool token · Society #412/);
    assert.doesNotMatch(html, /href="[^"]*opensea\.io/);
    assert.doesNotMatch(html, /OpenSea indexing/);
    assert.doesNotMatch(html, /Refresh metadata/);
    assert.doesNotMatch(html, /OpenSea token links are unavailable/);
    assert.match(html, /local Base fork/);
  });

  it("pins the mint-pool boundary read to the receipt block and fails links closed on read error", () => {
    mintPoolStartReads.length = 0;

    const html = renderToStaticMarkup(
      <GalleryRuntimeProvider config={runtime}>
        <GalleryPurchaseReceiptView
          transactionHash={marketplacePurchase.transactionHash}
        />
      </GalleryRuntimeProvider>,
    );

    assert.equal(mintPoolStartReads.length, 1);
    assert.equal(
      mintPoolStartReads[0]?.blockNumber,
      marketplacePurchase.blockNumber,
    );
    assert.deepEqual(mintPoolStartReads[0]?.query, { enabled: true });
    assert.match(html, /Your token · Society #199/);
    assert.match(html, /Pool token · Society #412/);
    assert.doesNotMatch(html, /href="[^"]*opensea\.io/);
    assert.match(html, /OpenSea token links are unavailable/);
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
        mintPoolStart={413n}
      />,
    );

    assert.match(html, /Held artwork delivery/);
    assert.match(html, /Direct FAME payment/);
    assert.doesNotMatch(html, /Net input paid/);
    assert.match(html, /Gross marketplace premium/);
    assert.match(html, /no metadata swap was needed/);
    assert.doesNotMatch(html, /Pool token/);
    assert.doesNotMatch(html, /local Base fork/);
  });
});

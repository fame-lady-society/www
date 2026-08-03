import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "./baseSepoliaTestGallery";
import { BASE_SEPOLIA_TEST_GALLERY_MANIFEST } from "./baseSepoliaTestGallery.generated";
import {
  buildBaseSepoliaTestGalleryManifest,
  formatGeneratedManifest,
} from "../../../../scripts/generate-base-sepolia-test-gallery-manifest";
import { universalPoolArtMarketplaceAbi } from "../../../wagmi";

const EXPECTED_ADDRESSES = {
  fame: "0x2cF0408Ee86b337216dD0073ab257F84497067cA",
  mirror: "0x2907936013BDF568F98A98893AC1C746256A9cC5",
  creatorMagic: "0xa16C005203cD46cC1929cc8e494cF7945887951B",
  gallery: "0x821ab043a94688aC22C5a1b0113fc33ed4Fb6843",
} as const;

function featureSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return featureSourceFiles(path);
    return /\.[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

describe("Base Sepolia TEST gallery manifest", () => {
  it("exposes only inert successor deployment facts", () => {
    assert.equal(BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId, 84_532);
    assert.deepEqual(
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses,
      EXPECTED_ADDRESSES,
    );
    assert.deepEqual(BASE_SEPOLIA_TEST_GALLERY_CONFIG.testToken, {
      name: "Example",
      symbol: "TEST",
      unit: 1_000_000n,
    });
    assert.deepEqual(BASE_SEPOLIA_TEST_GALLERY_CONFIG.collection, {
      firstTokenId: 1,
      lastTokenId: 888,
    });
    assert.deepEqual(BASE_SEPOLIA_TEST_GALLERY_CONFIG.deployment, {
      blockNumber: 44_329_992n,
    });
    assert.equal(
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.metadataStrategy,
      "nested-onchain-data-uri",
    );
    assert.equal(
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.explorerBaseUrl,
      "https://sepolia.basescan.org",
    );
    assert.equal("checkpoint" in BASE_SEPOLIA_TEST_GALLERY_CONFIG, false);
    assert.equal("readiness" in BASE_SEPOLIA_TEST_GALLERY_CONFIG, false);
  });

  it("imports without performing RPC, explorer, or readiness work", () => {
    const moduleUrl = pathToFileURL(
      resolve(
        process.cwd(),
        "src/features/fame-gallery/config/baseSepoliaTestGallery.ts",
      ),
    ).href;
    const result = spawnSync(
      process.execPath,
      [
        "-e",
        `globalThis.fetch = async () => { throw new Error("unexpected network call") }; await import(${JSON.stringify(moduleUrl)});`,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
  });

  it("reproduces the committed manifest from deterministic local facts", () => {
    const generated = buildBaseSepoliaTestGalleryManifest();

    assert.deepEqual(generated, BASE_SEPOLIA_TEST_GALLERY_MANIFEST);
    assert.match(
      formatGeneratedManifest(generated),
      /UniversalPoolArtMarketplace deployment facts/,
    );
  });

  it("generates the successor reads, writes, event, and named errors", () => {
    const abiNames = new Set<string>(
      universalPoolArtMarketplaceAbi
        .filter((item) => "name" in item)
        .map((item) => item.name),
    );

    for (const name of [
      "fame",
      "mirror",
      "creatorMagic",
      "premium",
      "communityFee",
      "providerFee",
      "totalProviderUnits",
      "providerPosition",
      "activeProviderCount",
      "activeProviderAt",
      "activeProviderCap",
      "MAX_INVENTORY_BATCH_SIZE",
      "feeRecipient",
      "paused",
      "inventory",
      "artworkHash",
      "owner",
      "purchaseHeld",
      "purchasePool",
      "depositInventory",
      "depositInventoryBatch",
      "withdrawInventory",
      "withdrawInventorySelected",
      "setCommunityFee",
      "setProviderFee",
      "setFeeRecipient",
      "pause",
      "unpause",
      "ArtworkPurchased",
      "InventoryDeposited",
      "InventoryBatchDeposited",
      "InventoryWithdrawn",
      "ZeroAddress",
      "InvalidDependency",
      "StackMismatch",
      "FeeTooLarge",
      "InvalidActiveProviderCap",
      "InvalidInventoryBatchSize",
      "DuplicateInventoryToken",
      "ActiveProviderCapReached",
      "NoProviderPosition",
      "NoPooledInventory",
      "InvalidFeeRecipient",
      "FeeRecipientNotSkippingNFT",
      "PurchasesPaused",
      "MarketNotPaused",
      "MarketAlreadyPaused",
      "SettlementInProgress",
      "OwnershipRenunciationDisabled",
      "UnsupportedNFT",
      "CoreAssetRescueBlocked",
      "InvalidRecipient",
      "PremiumExceedsMaximum",
      "UnavailableShell",
      "ArtworkMismatch",
      "PaymentTransferFailed",
      "BuyerMirrorBalanceTooLow",
      "InventoryInvariantBroken",
      "SourceEqualsShell",
      "ArtPoolSourceExcluded",
      "IneligiblePoolSource",
      "AmbiguousPoolSource",
    ]) {
      assert.ok(
        abiNames.has(name),
        `missing ${name} from generated successor marketplace ABI`,
      );
    }
  });

  it("does not import the retired ClosedLoop gallery ABI", () => {
    const featureRoot = resolve(process.cwd(), "src/features/fame-gallery");
    const imports = featureSourceFiles(featureRoot)
      .filter((file) => !/\.test\.[jt]sx?$/.test(file))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    assert.doesNotMatch(imports, /\bclosedLoopGallerySwapAbi\b/);
  });
});

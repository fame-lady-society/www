import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { hasLegacyPosition } from "../liquidity/legacyPosition";
import { baseLegacyUniversalMarketplaceAddress } from "@/features/fame/contract";
import { createBaseLegacyGalleryRuntime } from "../config/baseGallery";
import {
  galleryLiquidityFameApprovalRequest,
  galleryLiquidityWithdrawalRequest,
} from "../transactions/liquidityRequests";

const account = "0x1111111111111111111111111111111111111111";
const fame = "0x2222222222222222222222222222222222222222";
const creatorMagic = "0x3333333333333333333333333333333333333333";
const activeMarketplace = "0x4444444444444444444444444444444444444444";
const checkout = "0x5555555555555555555555555555555555555555";

describe("legacy provider recovery", () => {
  it("exposes recovery only for a successful positive old position", () => {
    assert.equal(hasLegacyPosition({ status: "idle" }), false);
    assert.equal(
      hasLegacyPosition({
        status: "failure",
        blockNumber: 1n,
        message: "unavailable",
      }),
      false,
    );
    assert.equal(
      hasLegacyPosition({
        status: "success",
        blockNumber: 1n,
        data: {
          account,
          unitCount: 0n,
          indexPlusOne: 0n,
          withdrawalPremium: null,
        },
      }),
      false,
    );
    assert.equal(
      hasLegacyPosition({
        status: "success",
        blockNumber: 1n,
        data: {
          account,
          unitCount: 1n,
          indexPlusOne: 1n,
          withdrawalPremium: 0n,
        },
      }),
      true,
    );
  });

  it("pins approval and withdrawal requests to the retired marketplace", () => {
    const runtime = createBaseLegacyGalleryRuntime(
      { creatorMagic, marketplace: activeMarketplace, checkout },
      { forkMode: false },
    );
    assert.equal(
      runtime.addresses.gallery,
      baseLegacyUniversalMarketplaceAddress,
    );
    assert.equal(runtime.checkout, null);
    assert.equal(
      galleryLiquidityFameApprovalRequest(
        account,
        8453,
        fame,
        runtime.addresses.gallery,
        10n,
      ).args[0],
      baseLegacyUniversalMarketplaceAddress,
    );
    assert.equal(
      galleryLiquidityWithdrawalRequest(
        account,
        8453,
        runtime.addresses.gallery,
        123n,
        10n,
      ).address,
      runtime.addresses.gallery,
    );
  });

  it("does not publish any retired deposit, purchase, or metadata-swap action", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/features/fame-market/components/LegacyPositionRecovery.tsx",
      ),
      "utf8",
    );
    assert.doesNotMatch(
      source,
      /depositInventory|purchase|banish|updateMetadata/,
    );
  });
});

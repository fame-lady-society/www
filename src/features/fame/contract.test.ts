import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  baseCreatorArtistMagicV3Address,
  baseFameMarketplaceCheckoutV3Address,
  baseFameV3Stack,
  baseLegacyUniversalMarketplaceAddress,
  baseUniversalMarketplaceV3Address,
} from "./contract";

describe("Base FAME V3 stack", () => {
  it("pins the dry-run-predicted active stack in source", () => {
    assert.deepEqual(baseFameV3Stack(), {
      creatorMagic: baseCreatorArtistMagicV3Address,
      marketplace: baseUniversalMarketplaceV3Address,
      checkout: baseFameMarketplaceCheckoutV3Address,
    });
    assert.equal(
      baseCreatorArtistMagicV3Address,
      "0x6754e4871775A781702f2Ab6e494754a562586ee",
    );
    assert.equal(
      baseUniversalMarketplaceV3Address,
      "0x93222897902a5Fc2f20079d242c660117277930A",
    );
    assert.equal(
      baseFameMarketplaceCheckoutV3Address,
      "0x50B9649Aa28D7d0B966B2A51092C5BcF37905a63",
    );
  });

  it("retains the retired marketplace only as the legacy recovery address", () => {
    assert.equal(
      baseLegacyUniversalMarketplaceAddress,
      "0x54e7E4F2d439Be599706f51068f7EB2ce2D2a27e",
    );
  });
});

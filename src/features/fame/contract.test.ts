import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base } from "viem/chains";
import {
  baseFameCheckoutAddress,
  baseUniversalMarketplaceAddress,
  creatorArtistMagicAddress,
} from "./contract";

describe("Base FAME marketplace contracts", () => {
  it("uses the final marketplace and checkout addresses", () => {
    assert.equal(
      baseUniversalMarketplaceAddress,
      "0x54e7E4F2d439Be599706f51068f7EB2ce2D2a27e",
    );
    assert.equal(
      baseFameCheckoutAddress,
      "0x1905B4a633074243f3D9FDB59596fB7419adce2c",
    );
  });
});

describe("creatorArtistMagicAddress", () => {
  it("targets the authoritative Base migration contract", () => {
    assert.equal(
      creatorArtistMagicAddress(base.id),
      "0xC8268c2aa571F3C88044C2959F73DdB8eB9e139F",
    );
  });
});

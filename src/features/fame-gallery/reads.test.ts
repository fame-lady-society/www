import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base } from "viem/chains";
import {
  creatorArtistMagicAddress,
  fameFromNetwork,
  societyFromNetwork,
} from "@/features/fame/contract";
import { hasVerifiedFameGalleryMarketplaceAuthority } from "./reads";

const verifiedAuthority = () => ({
  fame: fameFromNetwork(base.id),
  mirror: societyFromNetwork(base.id),
  creatorMagic: creatorArtistMagicAddress(base.id),
  paused: false,
  inventory: 1n,
});

describe("FAME Gallery marketplace authority", () => {
  it("requires every global authority fact before public card decorations", () => {
    assert.equal(hasVerifiedFameGalleryMarketplaceAuthority(verifiedAuthority()), true);
    for (const field of ["fame", "mirror", "creatorMagic", "paused", "inventory"] as const) {
      const authority = verifiedAuthority();
      authority[field] = null as never;
      assert.equal(hasVerifiedFameGalleryMarketplaceAuthority(authority), false, field);
    }
  });

  it("rejects contradictory marketplace identity", () => {
    assert.equal(hasVerifiedFameGalleryMarketplaceAuthority({
      ...verifiedAuthority(),
      fame: "0x0000000000000000000000000000000000000001",
    }), false);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base } from "viem/chains";
import { creatorArtistMagicAddress } from "./contract";

describe("creatorArtistMagicAddress", () => {
  it("targets the authoritative Base migration contract", () => {
    assert.equal(
      creatorArtistMagicAddress(base.id),
      "0xC8268c2aa571F3C88044C2959F73DdB8eB9e139F",
    );
  });
});

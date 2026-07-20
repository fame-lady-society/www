import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BurnPoolImage } from "./burnPoolImage";

describe("BurnPoolImage", () => {
  it("renders the image resolved from CreatorArtistMagic metadata", () => {
    const image = "https://images.example/645.png";
    const element = BurnPoolImage({ tokenId: 645, image });

    assert.equal(element.props.src, image);
    assert.equal(element.props.alt, "Burned token 645");
  });
});

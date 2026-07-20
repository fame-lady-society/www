import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BurnPoolImage } from "./burnPoolImage";
import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";

describe("BurnPoolImage", () => {
  it("links to the canonical rotate route and exposes an accessible name with the token ID", () => {
    const image = "https://images.example/645.png";
    const element = BurnPoolImage({ tokenId: 645, image });

    assert.equal(element.props.href, "/fame/rotate/645");
    assert.match(String(element.props["aria-label"]), /645/);
    assert.match(
      String(element.props["aria-label"]),
      /Society NFT|burn pool|rotation/i,
    );
  });

  it("retains target identity and image fallback behavior for the child artwork", () => {
    const element = BurnPoolImage({
      tokenId: 12,
      image: FAME_METADATA_FALLBACK_IMAGE,
    });

    assert.equal(element.props.href, "/fame/rotate/12");
    assert.match(String(element.props["aria-label"]), /12/);

    const img = element.props.children;
    assert.equal(img.props.src, FAME_METADATA_FALLBACK_IMAGE);
    assert.equal(img.props.alt, "Burned token 12");
    assert.equal(img.props.width, 400);
    assert.equal(img.props.height, 400);
  });

  it("renders the image resolved from CreatorArtistMagic metadata under the link", () => {
    const image = "https://images.example/645.png";
    const element = BurnPoolImage({ tokenId: 645, image });
    const img = element.props.children;

    assert.equal(img.props.src, image);
    assert.equal(img.props.alt, "Burned token 645");
  });
});

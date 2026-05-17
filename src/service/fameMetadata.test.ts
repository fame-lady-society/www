import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fameMetadataFetchUrls,
  imageFromFameMetadata,
  irysGatewayToArweaveUrl,
  normalizeFameImageUrl,
} from "./fameMetadata";

describe("fame metadata URL handling", () => {
  it("converts Irys gateway URLs to Arweave gateway URLs", () => {
    assert.equal(
      irysGatewayToArweaveUrl(
        "https://gateway.irys.xyz/txid/path/to/metadata.json",
      ),
      "https://arweave.net/txid/path/to/metadata.json",
    );
  });

  it("fetches Irys metadata through Arweave before trying the original gateway", () => {
    assert.deepEqual(
      fameMetadataFetchUrls("https://gateway.irys.xyz/txid/metadata.json"),
      [
        "https://arweave.net/txid/metadata.json",
        "https://gateway.irys.xyz/txid/metadata.json",
      ],
    );
  });

  it("leaves non-Irys and local image URLs unchanged", () => {
    assert.equal(
      normalizeFameImageUrl("https://www.fameladysociety.com/image.png"),
      "https://www.fameladysociety.com/image.png",
    );
    assert.equal(
      normalizeFameImageUrl("/images/fame/gold-leaf-square.png"),
      "/images/fame/gold-leaf-square.png",
    );
  });

  it("extracts and normalizes the metadata image field", () => {
    assert.equal(
      imageFromFameMetadata({
        image: "https://gateway.irys.xyz/imageTx",
      }),
      "https://arweave.net/imageTx",
    );
  });

  it("rejects metadata without a usable image", () => {
    assert.throws(
      () => imageFromFameMetadata({ image: "" }),
      /FAME metadata image must be a non-empty string/,
    );
    assert.throws(
      () => imageFromFameMetadata({ name: "FAME Society" }),
      /FAME metadata is missing an image field/,
    );
  });
});

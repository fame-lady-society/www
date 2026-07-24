import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  BASE_GALLERY_ADDRESSES,
  createBaseGalleryRuntime,
  parseBaseMarketplaceAddress,
} from "./baseGallery";

const marketplace = "0x1111111111111111111111111111111111111111";

describe("Base FAME gallery configuration", () => {
  it("uses canonical Base contracts and only a plain runtime marketplace address", () => {
    const address = parseBaseMarketplaceAddress(marketplace);
    assert.equal(address, marketplace);
    assert.ok(address);

    const config = createBaseGalleryRuntime(address);
    assert.equal(config.chainId, 8_453);
    assert.deepEqual(config.addresses, {
      ...BASE_GALLERY_ADDRESSES,
      gallery: marketplace,
    });
    assert.equal(config.token.symbol, "FAME");
    assert.equal(config.labels.network, "Base");
    assert.deepEqual(config.collection, {
      firstTokenId: 1,
      lastTokenId: 888,
    });
    assert.equal("manifest" in config, false);
    assert.equal("hash" in config, false);
    assert.equal("proof" in config, false);
  });

  it("rejects a missing or malformed marketplace address", () => {
    assert.equal(parseBaseMarketplaceAddress(undefined), null);
    assert.equal(parseBaseMarketplaceAddress(""), null);
    assert.equal(parseBaseMarketplaceAddress("not-an-address"), null);
  });

  it("keeps the direct route out of both site menus", () => {
    for (const file of [
      "src/features/appbar/components/SiteMenu.tsx",
      "src/features/appbar/components.app/SiteMenu.tsx",
    ]) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      assert.doesNotMatch(source, /\/fame\/gallery/);
      assert.doesNotMatch(source, />\s*Gallery\s*</);
    }
  });

  it("wires the direct route to the public env address and client gallery", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/fame/gallery/page.tsx"),
      "utf8",
    );
    assert.match(source, /NEXT_PUBLIC_BASE_UNIVERSAL_MARKETPLACE_ADDRESS/);
    assert.match(source, /<GalleryView \/>/);
    assert.doesNotMatch(source, /\/api\//);
  });
});

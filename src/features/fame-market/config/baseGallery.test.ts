import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BASE_GALLERY_ADDRESSES,
  createBaseGalleryRuntime,
} from "./baseGallery";
import { parseBaseGalleryForkContracts } from "../contracts";
import { useGalleryRuntime } from "./galleryRuntime";

const marketplace = "0x1111111111111111111111111111111111111111";
const checkout = "0x2222222222222222222222222222222222222222";

describe("Base FAME gallery configuration", () => {
  it("uses canonical Base contracts and only a plain runtime marketplace address", () => {
    const contracts = parseBaseGalleryForkContracts({
      marketplace,
      checkout,
      forkMode: true,
    });
    assert.ok(contracts);

    const config = createBaseGalleryRuntime(contracts);
    assert.equal(config.chainId, 8_453);
    assert.deepEqual(config.addresses, {
      ...BASE_GALLERY_ADDRESSES,
      gallery: marketplace,
    });
    assert.equal(config.checkout?.mode, "fork");
    assert.equal(config.checkout?.address, checkout);
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

  it("fails clearly when a marketplace consumer renders without a runtime provider", () => {
    function RuntimeConsumer() {
      useGalleryRuntime();
      return null;
    }

    assert.throws(
      () => renderToStaticMarkup(createElement(RuntimeConsumer)),
      /Gallery runtime is not configured.*GalleryRuntimeProvider/,
    );
  });

  it("rejects a missing or malformed marketplace address", () => {
    assert.equal(
      parseBaseGalleryForkContracts({
        marketplace: undefined,
        checkout,
        forkMode: true,
      }),
      null,
    );
    assert.equal(
      parseBaseGalleryForkContracts({
        marketplace: "",
        checkout,
        forkMode: true,
      }),
      null,
    );
    assert.equal(
      parseBaseGalleryForkContracts({
        marketplace: "not-an-address",
        checkout,
        forkMode: true,
      }),
      null,
    );
  });

  it("fails the alternative checkout closed without a valid fork address", () => {
    const missing = parseBaseGalleryForkContracts({
      marketplace,
      checkout: undefined,
      forkMode: true,
    });
    const malformed = parseBaseGalleryForkContracts({
      marketplace,
      checkout: "not-an-address",
      forkMode: true,
    });
    assert.ok(missing);
    assert.ok(malformed);
    assert.equal(createBaseGalleryRuntime(missing).checkout, null);
    assert.equal(createBaseGalleryRuntime(malformed).checkout, null);
  });

  it("keeps alternative checkout disabled outside explicit fork mode", () => {
    const contracts = parseBaseGalleryForkContracts({
      marketplace,
      checkout,
      forkMode: false,
    });
    assert.ok(contracts);
    assert.equal(createBaseGalleryRuntime(contracts).checkout, null);
  });

  it("keeps the Marketplace, Gallery, and Rotator routes distinct in both site menus", () => {
    for (const file of [
      "src/features/appbar/components/SiteMenu.tsx",
      "src/features/appbar/components.app/SiteMenu.tsx",
    ]) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      assert.match(source, /href="\/fame\/market"/);
      assert.match(source, /FAME Marketplace/);
      assert.match(source, /href="\/fame\/gallery"/);
      assert.match(source, /FAME Gallery/);
      assert.match(source, /href="\/fame\/rotate"/);
      assert.match(source, /FAME Rotator/);
    }
  });

  it("wires the direct route to the public env address and client gallery", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/fame/market/page.tsx"),
      "utf8",
    );
    assert.match(source, /NEXT_PUBLIC_BASE_UNIVERSAL_MARKETPLACE_ADDRESS/);
    assert.match(source, /NEXT_PUBLIC_BASE_FAME_CHECKOUT_ADDRESS/);
    assert.match(source, /<GalleryView \/>/);
    assert.match(
      readFileSync(
        resolve(
          process.cwd(),
          "src/features/fame-market/components/GalleryView.tsx",
        ),
        "utf8",
      ),
      /<GalleryLiquidityCta \/>/,
    );
    assert.doesNotMatch(source, /\/api\//);
  });

  it("uses one site-navigation shell for the gallery and purchase receipt", () => {
    const shell = readFileSync(
      resolve(
        process.cwd(),
        "src/features/fame-market/components/BaseGalleryShell.tsx",
      ),
      "utf8",
    );
    assert.match(shell, /<FameMain/);

    const fameShell = readFileSync(
      resolve(process.cwd(), "src/features/fame/components/FameShell.tsx"),
      "utf8",
    );
    assert.match(fameShell, /<Main/);
    assert.match(fameShell, /<SiteMenu isFame \/>/);
    assert.match(fameShell, /<LinksMenuItems \/>/);

    const appBar = readFileSync(
      resolve(process.cwd(), "src/features/appbar/components/appBar.tsx"),
      "utf8",
    );
    assert.match(appBar, /<IconButton/);
    assert.match(appBar, /aria-label="Open navigation menu"/);

    for (const file of [
      "src/app/fame/market/page.tsx",
      "src/app/fame/market/purchase/[transactionHash]/page.tsx",
    ]) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      assert.match(source, /<BaseGalleryShell/);
    }

    const stakeLayout = readFileSync(
      resolve(process.cwd(), "src/app/fame/market/stake/layout.tsx"),
      "utf8",
    );
    assert.match(stakeLayout, /<BaseGalleryShell/);
  });

  it("mounts every liquidity interaction as a real gallery route", () => {
    const routes = [
      ["src/app/fame/market/stake/page.tsx", "GalleryStakeView"],
      ["src/app/fame/market/stake/deposit/page.tsx", "GalleryStakeDepositView"],
      ["src/app/fame/market/stake/unstake/page.tsx", "GalleryStakeUnstakeView"],
    ] as const;
    for (const [file, component] of routes) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      assert.match(source, new RegExp(`<${component} \\/>`));
      assert.doesNotMatch(source, /\/api\//);
    }
  });

  it("publishes only the canonical marketplace route family", () => {
    for (const file of [
      "src/app/fame/market/page.tsx",
      "src/app/fame/market/purchase/[transactionHash]/page.tsx",
      "src/app/fame/market/stake/page.tsx",
      "src/app/fame/market/stake/deposit/page.tsx",
      "src/app/fame/market/stake/unstake/page.tsx",
    ]) {
      assert.equal(existsSync(resolve(process.cwd(), file)), true, file);
    }

    for (const file of [
      "src/app/fame/market/test/page.tsx",
      "src/app/fame/market/test/layout.tsx",
      "src/app/fame/market/test/admin/page.tsx",
      "src/app/fame/gallery/purchase/[transactionHash]/page.tsx",
      "src/app/fame/gallery/stake/page.tsx",
      "src/app/fame/gallery/test/page.tsx",
    ]) {
      assert.equal(existsSync(resolve(process.cwd(), file)), false, file);
    }
  });
});

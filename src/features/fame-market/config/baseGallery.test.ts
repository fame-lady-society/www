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
import { parseBaseGalleryContracts } from "../contracts";
import { useGalleryRuntime } from "./galleryRuntime";

const marketplace = "0x1111111111111111111111111111111111111111";
const checkout = "0x2222222222222222222222222222222222222222";

describe("Base FAME gallery configuration", () => {
  it("uses canonical Base contracts and only a plain runtime marketplace address", () => {
    const contracts = parseBaseGalleryContracts({
      marketplace,
      checkout,
    });
    assert.ok(contracts);

    const config = createBaseGalleryRuntime(contracts, { forkMode: false });
    assert.equal(config.chainId, 8_453);
    assert.deepEqual(config.addresses, {
      ...BASE_GALLERY_ADDRESSES,
      gallery: marketplace,
    });
    assert.equal(config.forkMode, false);
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
      parseBaseGalleryContracts({
        marketplace: undefined,
        checkout,
      }),
      null,
    );
    assert.equal(
      parseBaseGalleryContracts({
        marketplace: "",
        checkout,
      }),
      null,
    );
    assert.equal(
      parseBaseGalleryContracts({
        marketplace: "not-an-address",
        checkout,
      }),
      null,
    );
  });

  it("fails the alternative checkout closed without a valid checkout address", () => {
    const missing = parseBaseGalleryContracts({
      marketplace,
      checkout: undefined,
    });
    const malformed = parseBaseGalleryContracts({
      marketplace,
      checkout: "not-an-address",
    });
    assert.ok(missing);
    assert.ok(malformed);
    assert.equal(
      createBaseGalleryRuntime(missing, { forkMode: false }).checkout,
      null,
    );
    assert.equal(
      createBaseGalleryRuntime(malformed, { forkMode: false }).checkout,
      null,
    );
  });

  it("keeps the deployed checkout enabled independently of fork mode", () => {
    const contracts = parseBaseGalleryContracts({
      marketplace,
      checkout,
    });
    assert.ok(contracts);
    const production = createBaseGalleryRuntime(contracts, {
      forkMode: false,
    });
    const fork = createBaseGalleryRuntime(contracts, { forkMode: true });

    assert.equal(production.checkout?.address, checkout);
    assert.equal(production.forkMode, false);
    assert.equal(fork.checkout?.address, checkout);
    assert.equal(fork.forkMode, true);
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

  it("wires the direct route to the canonical contract addresses and client gallery", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/fame/market/page.tsx"),
      "utf8",
    );
    assert.match(source, /baseUniversalMarketplaceAddress/);
    assert.match(source, /baseFameCheckoutAddress/);
    assert.match(source, /parseBaseGalleryContracts/);
    assert.doesNotMatch(source, /parseBaseGalleryForkContracts/);
    assert.doesNotMatch(source, /process\.env\.NEXT_PUBLIC_BASE_/);
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
    assert.match(fameShell, /<SiteMenu activeFamePage=\{activeFamePage\} \/>/);
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

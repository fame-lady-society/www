import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fixture from "./fixtures/fame-landing-defi-snapshot-v1.json";
import { parseFameLandingSnapshot } from "./snapshot";
import {
  emptyLandingMarket,
  formatPrice,
  presentLandingMarket,
} from "./pricePresentation";

function parsedFixture() {
  return parseFameLandingSnapshot(
    structuredClone(fixture),
    Date.parse("2026-08-09T12:01:00.000Z"),
  );
}

describe("FAME landing snapshot presentation", () => {
  it("keeps normal prices compact", () => {
    assert.equal(formatPrice(108_821_009_700_020_240n, 18, "ETH"), "0.109 ETH");
    assert.equal(formatPrice(202_946_333n, 6, "USDC"), "202.95 USDC");
    assert.equal(formatPrice(233_430_200n, 6, "USDC"), "233.43 USDC");
    assert.equal(formatPrice(120_934_000_000_000_000n, 18, "ETH"), "0.121 ETH");
  });

  it("abbreviates thousands and millions to at most one decimal", () => {
    assert.equal(formatPrice(218_655_239_996n, 6, "USDC"), "218.7K USDC");
    assert.equal(formatPrice(1_000_000_000n, 6, "USDC"), "1K USDC");
    assert.equal(formatPrice(1_050_000n * 10n ** 18n, 18, "FAME"), "1.1M FAME");
  });

  it("renders every value from one parsed producer snapshot", () => {
    const market = presentLandingMarket(parsedFixture());

    assert.deepEqual(market.prices, {
      defiBuy: {
        fame: "1M FAME",
        USDC: { value: "250 USDC" },
        ETH: { value: "0.42 ETH" },
      },
      defiSell: {
        fame: "1M FAME",
        USDC: { value: "240 USDC" },
        ETH: { value: "0.41 ETH" },
      },
      nftBuy: {
        fame: "1.05M FAME",
        USDC: { value: "262.5 USDC" },
        ETH: { value: "0.44 ETH" },
      },
    });
    assert.deepEqual(market.marketCap, {
      USDC: { value: "242K USDC" },
      ETH: { value: "409.9 ETH" },
    });
    assert.equal(market.marketplaceSupply, "987.7M FAME");
    assert.deepEqual(market.liquidity, {
      fame: { value: "25M FAME" },
      counterAssets: [
        {
          address: "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926",
          label: "basedflick",
          value: "100 basedflick",
        },
        {
          address: "0x4200000000000000000000000000000000000006",
          label: "WETH",
          value: "3 WETH",
        },
        {
          address: "0x54016a4848a38f257b6e96331f7404073fd9c32c",
          label: "SCALE",
          value: "400 SCALE",
        },
        {
          address: "0xe5020a6d073a794b6e7f05678707de47986fb0b6",
          label: "frxUSD",
          value: "500 frxUSD",
        },
      ],
    });
  });

  it("withholds only the cell backed by an unavailable quote leaf", () => {
    const snapshot = parsedFixture();
    const market = presentLandingMarket({
      ...snapshot,
      fields: {
        ...snapshot.fields,
        quotes: {
          ...snapshot.fields.quotes,
          defiBuyUsdc: { status: "unavailable", reason: "no-safe-route" },
        },
      },
    });

    assert.equal(market.prices.defiBuy.USDC.value, null);
    assert.equal(market.prices.defiBuy.ETH.value, "0.42 ETH");
    assert.equal(market.prices.defiSell.USDC.value, "240 USDC");
    assert.equal(market.marketCap.USDC.value, null);
    assert.equal(market.marketCap.ETH.value, "409.9 ETH");
    assert.equal(market.liquidity.fame.value, "25M FAME");
  });

  it("withholds marketplace-derived cells without gating NFT quotes or liquidity", () => {
    const snapshot = parsedFixture();
    const market = presentLandingMarket({
      ...snapshot,
      fields: {
        ...snapshot.fields,
        marketplace: {
          status: "unavailable",
          reason: "dependency-unavailable",
        },
      },
    });

    assert.equal(market.prices.nftBuy.fame, null);
    assert.equal(market.marketplaceSupply, null);
    assert.equal(market.marketCap.USDC.value, null);
    assert.equal(market.marketCap.ETH.value, null);
    assert.equal(market.prices.nftBuy.USDC.value, "262.5 USDC");
    assert.equal(market.prices.nftBuy.ETH.value, "0.44 ETH");
    assert.equal(market.liquidity.fame.value, "25M FAME");
    assert.deepEqual(
      market.liquidity.counterAssets.map(({ value }) => value),
      ["100 basedflick", "3 WETH", "400 SCALE", "500 frxUSD"],
    );
  });

  it("withholds liquidity cells without gating prices or marketplace values", () => {
    const snapshot = parsedFixture();
    const market = presentLandingMarket({
      ...snapshot,
      fields: {
        ...snapshot.fields,
        liquidity: {
          status: "unavailable",
          reason: "dependency-unavailable",
        },
      },
    });

    assert.equal(market.liquidity.fame.value, null);
    assert.ok(
      market.liquidity.counterAssets.every(({ value }) => value === null),
    );
    assert.equal(market.prices.defiBuy.USDC.value, "250 USDC");
    assert.equal(market.prices.defiBuy.ETH.value, "0.42 ETH");
    assert.equal(market.prices.defiSell.USDC.value, "240 USDC");
    assert.equal(market.prices.defiSell.ETH.value, "0.41 ETH");
    assert.equal(market.prices.nftBuy.fame, "1.05M FAME");
    assert.equal(market.prices.nftBuy.USDC.value, "262.5 USDC");
    assert.equal(market.prices.nftBuy.ETH.value, "0.44 ETH");
    assert.equal(market.marketplaceSupply, "987.7M FAME");
    assert.equal(market.marketCap.USDC.value, "242K USDC");
    assert.equal(market.marketCap.ETH.value, "409.9 ETH");
  });

  it("provides one complete established unavailable market state", () => {
    const market = emptyLandingMarket();

    assert.equal(market.prices.defiBuy.fame, "1M FAME");
    assert.equal(market.prices.defiBuy.USDC.value, null);
    assert.equal(market.prices.nftBuy.fame, null);
    assert.equal(market.marketCap.USDC.value, null);
    assert.equal(market.marketplaceSupply, null);
    assert.equal(market.liquidity.fame.value, null);
    assert.equal(market.liquidity.counterAssets.length, 4);
    assert.ok(
      market.liquidity.counterAssets.every(({ value }) => value === null),
    );
  });
});

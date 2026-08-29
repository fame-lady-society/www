import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateMarketCap,
  consumeMarketCapUnitSuffix,
  formatFameUsdc,
  formatSocietyEth,
  formatSocietyUsdc,
  marketCapInputPlaceholder,
  type MarketCapCalculatorData,
} from "./marketCapCalculator";

const conversion = {
  buy: { usdc: "250000000", eth: "420000000000000000" },
  sell: { usdc: "240000000", eth: "410000000000000000" },
};

const calculatorData: MarketCapCalculatorData = {
  currentMarketCapUsdc: null,
  currentMarketCapInput: null,
  conversion,
};

describe("FAME market-cap calculator", () => {
  it("consumes K, M, and B suffixes from typed input", () => {
    assert.deepEqual(consumeMarketCapUnitSuffix("400K"), {
      value: "400",
      unit: "K",
    });
    assert.deepEqual(consumeMarketCapUnitSuffix("400 M"), {
      value: "400",
      unit: "M",
    });
    assert.deepEqual(consumeMarketCapUnitSuffix("400.5b"), {
      value: "400.5",
      unit: "B",
    });
    assert.equal(consumeMarketCapUnitSuffix("400KM"), null);
  });

  it("applies the K, M, and B market-cap units", () => {
    for (const [unit, expected] of [
      ["K", 1_000_000_000n],
      ["M", 1_000_000_000_000n],
      ["B", 1_000_000_000_000_000n],
    ] as const) {
      const result = calculateMarketCap("1", unit, calculatorData);

      assert.equal(result.status, "available");
      if (result.status === "available") {
        assert.equal(result.marketCapUsdc, expected);
      }
    }
  });

  it("divides the market cap by 888 and 888M", () => {
    const oneSociety = calculateMarketCap("888", "K", calculatorData);
    const oneFame = calculateMarketCap("888", "M", calculatorData);

    assert.equal(oneSociety.status, "available");
    assert.equal(oneFame.status, "available");
    if (oneSociety.status === "available") {
      assert.equal(formatSocietyUsdc(oneSociety.marketCapUsdc), "$1,000");
      assert.equal(formatFameUsdc(oneSociety.marketCapUsdc), "$0.001");
    }
    if (oneFame.status === "available") {
      assert.equal(formatSocietyUsdc(oneFame.marketCapUsdc), "$1,000,000");
      assert.equal(formatFameUsdc(oneFame.marketCapUsdc), "$1");
    }
  });

  it("uses the midpoint of the DeFi buy and sell ratios for Ξ", () => {
    const result = calculateMarketCap("242", "K", calculatorData);

    assert.equal(result.status, "available");
    if (result.status === "available") {
      assert.equal(formatSocietyUsdc(result.marketCapUsdc), "$272.52");
      assert.equal(formatSocietyEth(result.societyEthWei ?? 0n), "0.462 Ξ");
      assert.equal(formatFameUsdc(result.marketCapUsdc), "$0.000273");
    }
  });

  it("formats the current market cap as an editable placeholder", () => {
    assert.deepEqual(marketCapInputPlaceholder(241975308645n), {
      value: "242",
      unit: "K",
    });
    assert.deepEqual(marketCapInputPlaceholder(1_250_000_000_000n), {
      value: "1.3",
      unit: "M",
    });
    assert.deepEqual(marketCapInputPlaceholder(2_500_000_000_000_000n), {
      value: "2.5",
      unit: "B",
    });
  });

  it("uses the current snapshot when the field is blank", () => {
    const result = calculateMarketCap("", "K", {
      ...calculatorData,
      currentMarketCapUsdc: "241975308645",
    });

    assert.equal(result.status, "available");
    if (result.status === "available") {
      assert.equal(formatSocietyUsdc(result.marketCapUsdc), "$272.49");
      assert.equal(formatFameUsdc(result.marketCapUsdc), "$0.000272");
    }
  });

  it("fails closed for empty, non-positive, and malformed values", () => {
    const noCurrentMarket = {
      ...calculatorData,
      conversion: null,
    };

    assert.equal(calculateMarketCap("", "M", noCurrentMarket).status, "empty");
    assert.equal(
      calculateMarketCap("0", "M", noCurrentMarket).status,
      "invalid",
    );
    assert.equal(
      calculateMarketCap("1e6", "M", noCurrentMarket).status,
      "invalid",
    );
  });

  it("keeps USDC and FAME values when the Ξ conversion is unavailable", () => {
    const result = calculateMarketCap("242", "K", {
      ...calculatorData,
      conversion: null,
    });

    assert.equal(result.status, "available");
    if (result.status === "available") {
      assert.equal(result.societyEthWei, null);
      assert.equal(formatSocietyUsdc(result.marketCapUsdc), "$272.52");
      assert.equal(formatFameUsdc(result.marketCapUsdc), "$0.000273");
    }
  });
});

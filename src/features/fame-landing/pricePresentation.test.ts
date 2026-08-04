import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPrice } from "./pricePresentation";

describe("FAME landing price formatting", () => {
  it("keeps normal prices compact", () => {
    assert.equal(
      formatPrice(108_821_009_700_020_240n, 18, "ETH"),
      "0.108821 ETH",
    );
    assert.equal(formatPrice(202_946_333n, 6, "USDC"), "202.946333 USDC");
  });

  it("never turns a small nonzero price into zero or scientific notation", () => {
    const value = formatPrice(20_411n, 18, "ETH");
    assert.equal(value, "0.00000000000002041 ETH");
    assert.doesNotMatch(value, /e[+-]/i);
  });
});

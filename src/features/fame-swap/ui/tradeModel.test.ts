import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, USDC, WETH, tokenForAddress } from "../tokens";
import {
  defaultFameSwapTrade,
  deriveFameSwapPair,
  flipFameSwapMode,
  isFameAnchoredPair,
  tradeModeForPair,
} from "./tradeModel";

function token(address: typeof FAME | typeof USDC | typeof WETH) {
  const result = tokenForAddress(address);
  assert.ok(result);
  return result;
}

describe("FAME swap trade model", () => {
  it("defaults to buying FAME with USDC", () => {
    const pair = deriveFameSwapPair(defaultFameSwapTrade());

    assert.equal(pair.tokenIn.address, USDC);
    assert.equal(pair.tokenOut.address, FAME);
    assert.equal(pair.inputLabel, "Pay USDC");
    assert.equal(pair.outputLabel, "Receive FAME");
  });

  it("derives sell mode with FAME as input", () => {
    const pair = deriveFameSwapPair({
      mode: "sell",
      asset: token(WETH),
    });

    assert.equal(pair.tokenIn.address, FAME);
    assert.equal(pair.tokenOut.address, WETH);
    assert.equal(pair.inputLabel, "Sell FAME");
    assert.equal(pair.outputLabel, "Receive WETH");
  });

  it("flips mode while preserving the opposite asset", () => {
    const trade = {
      mode: "buy" as const,
      asset: token(USDC),
    };
    const flipped = flipFameSwapMode(trade);

    assert.equal(flipped.mode, "sell");
    assert.equal(flipped.asset.address, USDC);
    assert.equal(deriveFameSwapPair(flipped).tokenIn.address, FAME);
  });

  it("rejects non-FAME pairs", () => {
    assert.equal(isFameAnchoredPair(token(USDC), token(WETH)), false);
    assert.equal(tradeModeForPair(token(USDC), token(WETH)), null);
  });
});

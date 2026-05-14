import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NATIVE_ETH, USDC, tokenForAddress } from "../tokens";
import {
  NATIVE_ETH_PRESET_RESERVE,
  amountToInputValue,
  presetAmount,
  usablePresetBalance,
} from "./amountPresets";

function token(address: typeof USDC | typeof NATIVE_ETH) {
  const result = tokenForAddress(address);
  assert.ok(result);
  return result;
}

describe("FAME swap amount presets", () => {
  it("computes ERC-20 percentage presets from raw balances", () => {
    const usdc = token(USDC);
    const balance = 1_000_000n;

    assert.equal(presetAmount(balance, usdc, 25), 250_000n);
    assert.equal(presetAmount(balance, usdc, 50), 500_000n);
    assert.equal(presetAmount(balance, usdc, 75), 750_000n);
    assert.equal(presetAmount(balance, usdc, 100), balance);
  });

  it("reserves gas before native ETH presets", () => {
    const eth = token(NATIVE_ETH);
    const balance = 2_000_000_000_000_000n;
    const usable = balance - NATIVE_ETH_PRESET_RESERVE;

    assert.equal(usablePresetBalance(balance, eth), usable);
    assert.equal(presetAmount(balance, eth, 100), usable);
    assert.equal(presetAmount(balance, eth, 50), usable / 2n);
  });

  it("returns zero usable balance when native ETH is below reserve", () => {
    const eth = token(NATIVE_ETH);

    assert.equal(usablePresetBalance(NATIVE_ETH_PRESET_RESERVE, eth), 0n);
    assert.equal(presetAmount(NATIVE_ETH_PRESET_RESERVE - 1n, eth, 100), 0n);
  });

  it("formats raw preset amounts for decimal input values", () => {
    assert.equal(amountToInputValue(250_000n, token(USDC)), "0.25");
  });
});

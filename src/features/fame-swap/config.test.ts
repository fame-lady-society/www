import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { base } from "viem/chains";
import { fameRouterAddress } from "@/wagmi";
import { DEFAULT_FAME_ROUTER_ADDRESS, getFameSwapConfig } from "./config";

const envKey = "NEXT_PUBLIC_FAME_ROUTER_ADDRESS";
const overrideAddress = "0x0000000000000000000000000000000000000abc";

function withRouterEnv<T>(value: string | undefined, callback: () => T): T {
  const original = process.env[envKey];
  if (value === undefined) {
    delete process.env[envKey];
  } else {
    process.env[envKey] = value;
  }

  try {
    return callback();
  } finally {
    if (original === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = original;
    }
  }
}

describe("FAME swap config", () => {
  it("uses the generated wagmi Fame router address as the production default", () => {
    assert.equal(DEFAULT_FAME_ROUTER_ADDRESS, fameRouterAddress[base.id]);
    withRouterEnv(undefined, () => {
      assert.equal(
        getFameSwapConfig().routerAddress,
        fameRouterAddress[base.id],
      );
    });
  });

  it("allows a valid local or fork router address override", () => {
    withRouterEnv(overrideAddress, () => {
      assert.equal(getFameSwapConfig().routerAddress, overrideAddress);
    });
  });

  it("falls back to the generated address when the override is invalid", () => {
    withRouterEnv("not-an-address", () => {
      assert.equal(
        getFameSwapConfig().routerAddress,
        fameRouterAddress[base.id],
      );
    });
  });
});

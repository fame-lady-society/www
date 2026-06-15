import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { baseRpcUrls } from "./baseRpcUrls";

const originalBaseRpcUrl1 = process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
const originalBaseRpcUrl2 = process.env.NEXT_PUBLIC_BASE_RPC_URL_2;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

afterEach(() => {
  restoreEnv("NEXT_PUBLIC_BASE_RPC_URL_1", originalBaseRpcUrl1);
  restoreEnv("NEXT_PUBLIC_BASE_RPC_URL_2", originalBaseRpcUrl2);
});

describe("baseRpcUrls", () => {
  it("keeps configured Base RPC URLs ahead of the public fallback", () => {
    process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = "https://primary.example";
    process.env.NEXT_PUBLIC_BASE_RPC_URL_2 = "https://secondary.example";

    assert.deepEqual(baseRpcUrls(), [
      "https://primary.example",
      "https://secondary.example",
      "https://mainnet.base.org",
    ]);
  });

  it("deduplicates the public Base fallback", () => {
    process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = "https://mainnet.base.org";
    delete process.env.NEXT_PUBLIC_BASE_RPC_URL_2;

    assert.deepEqual(baseRpcUrls(), ["https://mainnet.base.org"]);
  });
});

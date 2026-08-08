import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { baseRpcUrls, baseServerRpcUrl } from "./baseRpcUrls";

const originalBaseRpcUrl1 = process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
const originalBaseRpcUrl2 = process.env.NEXT_PUBLIC_BASE_RPC_URL_2;
const originalBaseServerRpcUrl = process.env.BASE_RPC_URL;
const originalFameForkMode = process.env.NEXT_PUBLIC_FAME_FORK_MODE;

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
  restoreEnv("BASE_RPC_URL", originalBaseServerRpcUrl);
  restoreEnv("NEXT_PUBLIC_FAME_FORK_MODE", originalFameForkMode);
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

  it("uses only the configured loopback browser RPC in fork mode", () => {
    process.env.NEXT_PUBLIC_FAME_FORK_MODE = "1";
    process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = "http://127.0.0.1:8545";
    delete process.env.NEXT_PUBLIC_BASE_RPC_URL_2;

    assert.deepEqual(baseRpcUrls(), ["http://127.0.0.1:8545"]);
  });

  it("requires a loopback browser RPC and rejects a second RPC in fork mode", () => {
    process.env.NEXT_PUBLIC_FAME_FORK_MODE = "1";
    delete process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
    delete process.env.NEXT_PUBLIC_BASE_RPC_URL_2;

    assert.throws(
      () => baseRpcUrls(),
      /NEXT_PUBLIC_BASE_RPC_URL_1.*fork mode/u,
    );

    process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = "https://mainnet.base.org";
    assert.throws(() => baseRpcUrls(), /loopback/u);

    process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = "http://localhost:8545";
    process.env.NEXT_PUBLIC_BASE_RPC_URL_2 = "http://127.0.0.1:9545";
    assert.throws(() => baseRpcUrls(), /NEXT_PUBLIC_BASE_RPC_URL_2/u);
  });

  it("requires the same loopback server and browser RPC in fork mode", () => {
    process.env.NEXT_PUBLIC_FAME_FORK_MODE = "1";
    process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = "http://localhost:8545";
    delete process.env.BASE_RPC_URL;

    assert.throws(() => baseServerRpcUrl(), /BASE_RPC_URL.*fork mode/u);

    process.env.BASE_RPC_URL = "https://mainnet.base.org";
    assert.throws(() => baseServerRpcUrl(), /loopback/u);

    process.env.BASE_RPC_URL = "http://[::1]:8545";
    process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = "http://[::1]:8545";
    assert.equal(baseServerRpcUrl(), "http://[::1]:8545");

    process.env.BASE_RPC_URL = "http://127.0.0.1:8545";
    assert.throws(() => baseServerRpcUrl(), /must match/u);
  });

  it("preserves the existing server RPC fallback outside fork mode", () => {
    delete process.env.NEXT_PUBLIC_FAME_FORK_MODE;
    delete process.env.BASE_RPC_URL;
    process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = "https://primary.example";

    assert.equal(baseServerRpcUrl(), "https://primary.example");
  });
});

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { baseRpcUrls, baseServerRpcUrl } from "./baseRpcUrls";

const names = [
  "BASE_RPC_URL",
  "NEXT_PUBLIC_FAME_FORK_RPC_URL",
  "NEXT_PUBLIC_FAME_FORK_MODE",
] as const;
const original = Object.fromEntries(
  names.map((name) => [name, process.env[name]]),
);
afterEach(() => {
  for (const name of names) {
    if (original[name] === undefined) delete process.env[name];
    else process.env[name] = original[name];
  }
});

describe("Base RPC boundary", () => {
  it("keeps paid server endpoints out of browser configuration", () => {
    delete process.env.NEXT_PUBLIC_FAME_FORK_MODE;
    process.env.BASE_RPC_URL = "https://paid.example/private-key";
    assert.deepEqual(baseRpcUrls(), ["https://mainnet.base.org"]);
    assert.equal(baseServerRpcUrl(), "https://paid.example/private-key");
  });
  it("keeps the live server quote endpoint explicitly configured", () => {
    delete process.env.NEXT_PUBLIC_FAME_FORK_MODE;
    delete process.env.BASE_RPC_URL;
    assert.equal(baseServerRpcUrl(), undefined);
  });
  it("allows only a credential-free loopback URL in the explicit fork harness", () => {
    process.env.NEXT_PUBLIC_FAME_FORK_MODE = "1";
    for (const url of [
      "https://paid.example/key",
      "http://secret@localhost:8545",
      "http://localhost:8545?key=secret",
      "http://localhost:8545#secret",
    ]) {
      process.env.NEXT_PUBLIC_FAME_FORK_RPC_URL = url;
      assert.throws(() => baseRpcUrls(), /loopback|credentials/u);
    }
    process.env.NEXT_PUBLIC_FAME_FORK_RPC_URL = "http://127.0.0.1:8545";
    assert.deepEqual(baseRpcUrls(), ["http://127.0.0.1:8545"]);
  });
  it("requires matching server and browser fork endpoints", () => {
    process.env.NEXT_PUBLIC_FAME_FORK_MODE = "1";
    process.env.NEXT_PUBLIC_FAME_FORK_RPC_URL = "http://localhost:8545";
    delete process.env.BASE_RPC_URL;
    assert.throws(() => baseServerRpcUrl(), /BASE_RPC_URL/u);
    process.env.BASE_RPC_URL = "http://localhost:9545";
    assert.throws(() => baseServerRpcUrl(), /must match/u);
    process.env.BASE_RPC_URL = "http://localhost:8545";
    assert.equal(baseServerRpcUrl(), "http://localhost:8545");
  });
});

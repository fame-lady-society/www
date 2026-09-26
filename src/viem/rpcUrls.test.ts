import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  base,
  baseSepolia,
  mainnet,
  polygon,
  polygonAmoy,
  sepolia,
} from "viem/chains";
import { rpcUrls } from "./rpcUrls";

const entries = [
  [mainnet, "MAINNET_RPC_URL"],
  [base, "BASE_RPC_URL"],
  [polygon, "POLYGON_RPC_URL"],
  [sepolia, "SEPOLIA_RPC_URL"],
  [baseSepolia, "BASE_SEPOLIA_RPC_URL"],
  [polygonAmoy, "POLYGON_AMOY_RPC_URL"],
] as const;
const original = Object.fromEntries(
  entries.map(([, name]) => [name, process.env[name]]),
);
const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  if (windowDescriptor)
    Object.defineProperty(globalThis, "window", windowDescriptor);
  else Reflect.deleteProperty(globalThis, "window");
  for (const [, name] of entries) {
    if (original[name] === undefined) delete process.env[name];
    else process.env[name] = original[name];
  }
});
describe("RPC credentials", () => {
  it("uses private endpoints on the server for each configured chain", () => {
    Reflect.deleteProperty(globalThis, "window");
    for (const [chain, name] of entries) {
      process.env[name] = `https://paid.example/${chain.id}/secret`;
      assert.deepEqual(rpcUrls(chain), [process.env[name]]);
    }
  });
  it("ignores every private endpoint in a browser", () => {
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });
    for (const [chain, name] of entries) {
      process.env[name] = `https://paid.example/${chain.id}/secret`;
      assert.deepEqual(rpcUrls(chain), chain.rpcUrls.default.http);
    }
  });
});

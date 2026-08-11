import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  base,
  baseSepolia,
  mainnet,
  polygon,
  polygonAmoy,
  sepolia,
} from "viem/chains";

process.env.NEXT_PUBLIC_SEPOLIA_RPC_JSON ||= JSON.stringify([
  "http://localhost:8545",
]);
process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON ||= JSON.stringify([
  "http://localhost:8545",
]);
process.env.NEXT_PUBLIC_POLYGON_AMOY_RPCS_JSON ||= JSON.stringify([
  "http://localhost:8545",
]);

describe("global wagmi configuration", () => {
  it("exposes all six supported networks with explicit transports", async () => {
    const { chains, transports } = await import("./wagmiConfig");
    const expectedIds = [
      mainnet.id,
      base.id,
      polygon.id,
      sepolia.id,
      baseSepolia.id,
      polygonAmoy.id,
    ];

    assert.deepEqual(
      chains.map((chain) => chain.id),
      expectedIds,
    );
    assert.deepEqual(
      Object.keys(transports)
        .map(Number)
        .sort((left, right) => left - right),
      [...expectedIds].sort((left, right) => left - right),
    );
  });
});

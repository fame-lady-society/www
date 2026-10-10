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

describe("global wagmi configuration", () => {
  it("exposes all six supported networks with explicit transports", async () => {
    const previous = process.env.BASE_RPC_URL;
    process.env.BASE_RPC_URL = "https://paid.example/private-test-key";
    const { chains, transports } = await import("./wagmiConfig");
    if (previous === undefined) delete process.env.BASE_RPC_URL;
    else process.env.BASE_RPC_URL = previous;
    for (const chain of chains) {
      const transport = transports[chain.id]({ chain });
      assert.deepEqual(
        transport.value?.transports.map(
          (item: { value: { url: string } }) => item.value.url,
        ),
        chain.rpcUrls.default.http,
      );
    }
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

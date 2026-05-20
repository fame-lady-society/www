import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createIndexedPoolStateClient,
  parseIndexedPoolStateResponse,
} from "./indexedPoolStateClient";

describe("FAME indexed pool-state client", () => {
  it("posts bounded pool-state requests with service auth", async () => {
    const requests: Request[] = [];
    const client = createIndexedPoolStateClient({
      endpointUrl: "https://society.example/fame/pool-state",
      serviceToken: "unit-token",
      fetchFn: async (input, init) => {
        requests.push(new Request(input, init));
        return new Response(
          JSON.stringify({
            sourceRegistryId: "unit",
            currentBlock: 125,
            producerMaxFreshnessBlocks: 120,
            effectiveMaxFreshnessBlocks: 10,
            pools: [],
          }),
        );
      },
    });

    const response = await client.fetchPoolStates({
      currentBlock: 125,
      maxFreshnessBlocks: 10,
      poolIds: ["uniswap-v2-fame-direct"],
      stateSurfaces: ["cl-head-snapshot"],
    });

    assert.equal(response.effectiveMaxFreshnessBlocks, 10);
    assert.equal(requests[0]?.headers.get("authorization"), "Bearer unit-token");
    assert.deepEqual(await requests[0]?.json(), {
      currentBlock: 125,
      maxFreshnessBlocks: 10,
      stateSurfaces: ["cl-head-snapshot"],
      pools: [{ poolId: "uniswap-v2-fame-direct" }],
    });
  });

  it("parses fresh, stale, CL head, unsupported, and unknown entries", () => {
    const parsed = parseIndexedPoolStateResponse({
      sourceRegistryId: "unit",
      currentBlock: 125,
      producerMaxFreshnessBlocks: 120,
      effectiveMaxFreshnessBlocks: 120,
      pools: [
        {
          status: "fresh",
          poolId: "uniswap-v2-fame-direct",
          chainId: 8453,
          poolAddress: "0x3e2cab55bebf41719148b4e6b63f6644b18ae49c",
          token0: "0x4200000000000000000000000000000000000006",
          token1: "0xf307e242bfe1ec1ff01a4cef2fdaa81b10a52418",
          reserve0: "100",
          reserve1: "250",
          k: "25000",
          observedThroughBlock: 120,
          lastReserveChangeBlock: 119,
          source: "getReserves",
          quoteModel: "constant-product-reserves",
          maxFreshnessBlocks: 120,
        },
        {
          status: "stale",
          poolId: "solidly-frusd-fame",
          chainId: 8453,
          poolAddress: "0x2d756761d44eecae3a60021b802fb1563c5f04e9",
          token0: "0x80eede496655fb9047dd39d9f418d5483ed600df",
          token1: "0xf307e242bfe1ec1ff01a4cef2fdaa81b10a52418",
          reserve0: "500",
          reserve1: "750",
          k: "375000",
          observedThroughBlock: 1,
          lastReserveChangeBlock: 1,
          source: "sync-event",
          quoteModel: "constant-product-reserves",
          maxFreshnessBlocks: 120,
        },
        {
          status: "fresh",
          stateKind: "cl-head-snapshot",
          poolId: "uniswap-v3-usdc-weth-5bps",
          chainId: 8453,
          poolAddress: "0xd0b53d9277642d899df5c87a3966a349a798f224",
          poolKey: null,
          token0: "0x4200000000000000000000000000000000000006",
          token1: "0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913",
          venueFamily: "UniswapV3",
          feeBps: 5,
          feeLabel: "5 bps",
          tickSpacing: 10,
          stateViewAddress: null,
          sqrtPriceX96: "79228162514264337593543950336",
          tick: 0,
          liquidity: "1000000",
          observedThroughBlock: 124,
          source: "pool-slot0-liquidity",
          sourceRegistryId: "unit",
          maxFreshnessBlocks: 120,
        },
        {
          status: "unsupported",
          poolId: "uniswap-v4-usdc-eth",
          chainId: 8453,
          poolAddress: null,
          unsupportedReason: "concentrated-liquidity",
        },
        {
          status: "unknown",
          requested: { poolId: "missing" },
          reason: "missing-registry-entry",
        },
      ],
    });

    assert.deepEqual(
      parsed.pools.map((pool) => pool.status),
      ["fresh", "stale", "fresh", "unsupported", "unknown"],
    );
    const clHead = parsed.pools[2];
    if (!("stateKind" in clHead)) {
      assert.fail("Expected a CL head entry.");
    }
    assert.equal(clHead.stateKind, "cl-head-snapshot");
    assert.equal(clHead.venueFamily, "UniswapV3");
    assert.equal(clHead.tickSpacing, 10);
    assert.equal(clHead.tick, 0);
  });

  it("rejects malformed CL head contract fields", () => {
    const clHeadEntry = {
      status: "fresh",
      stateKind: "cl-head-snapshot",
      poolId: "uniswap-v3-usdc-weth-5bps",
      chainId: 8453,
      poolAddress: "0xd0b53d9277642d899df5c87a3966a349a798f224",
      poolKey: null,
      token0: "0x4200000000000000000000000000000000000006",
      token1: "0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913",
      venueFamily: "UniswapV3",
      feeBps: 5,
      feeLabel: "5 bps",
      tickSpacing: 10,
      stateViewAddress: null,
      sqrtPriceX96: "79228162514264337593543950336",
      tick: 0,
      liquidity: "1000000",
      observedThroughBlock: 124,
      source: "pool-slot0-liquidity",
      sourceRegistryId: "unit",
      maxFreshnessBlocks: 120,
    };
    const response = {
      sourceRegistryId: "unit",
      currentBlock: 125,
      producerMaxFreshnessBlocks: 120,
      effectiveMaxFreshnessBlocks: 120,
      pools: [clHeadEntry],
    };

    assert.throws(
      () =>
        parseIndexedPoolStateResponse({
          ...response,
          pools: [{ ...clHeadEntry, venueFamily: "uniswap-v3" }],
        }),
      /venueFamily/,
    );
    assert.throws(
      () =>
        parseIndexedPoolStateResponse({
          ...response,
          pools: [{ ...clHeadEntry, tickSpacing: 10.5 }],
        }),
      /tickSpacing/,
    );
    assert.throws(
      () =>
        parseIndexedPoolStateResponse({
          ...response,
          currentBlock: 125.5,
        }),
      /currentBlock/,
    );
  });

  it("rejects non-OK and malformed responses without exposing credentials", async () => {
    const client = createIndexedPoolStateClient({
      endpointUrl: "https://society.example/fame/pool-state",
      serviceToken: "super-secret-token",
      fetchFn: async () =>
        new Response(JSON.stringify({ error: "nope" }), { status: 401 }),
    });

    await assert.rejects(
      () =>
        client.fetchPoolStates({
          currentBlock: 125,
          poolIds: ["uniswap-v2-fame-direct"],
        }),
      (error) =>
        error instanceof Error &&
        /status 401/.test(error.message) &&
        !/super-secret-token/.test(error.message),
    );

    assert.throws(() => parseIndexedPoolStateResponse({ pools: [] }));
  });
});

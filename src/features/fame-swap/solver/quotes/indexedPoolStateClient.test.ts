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
      stateSurfaces: ["cl-replay-v1"],
      poolIds: ["uniswap-v2-fame-direct"],
    });

    assert.equal(response.effectiveMaxFreshnessBlocks, 10);
    assert.equal(requests[0]?.headers.get("authorization"), "Bearer unit-token");
    assert.deepEqual(await requests[0]?.json(), {
      currentBlock: 125,
      maxFreshnessBlocks: 10,
      stateSurfaces: ["cl-replay-v1"],
      pools: [{ poolId: "uniswap-v2-fame-direct" }],
    });
  });

  it("parses fresh, stale, unsupported, and unknown entries", () => {
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
      ["fresh", "stale", "unsupported", "unknown"],
    );
  });

  it("parses complete CL replay entries with raw bitmap and tick state", () => {
    const parsed = parseIndexedPoolStateResponse({
      sourceRegistryId: "unit",
      currentBlock: 125,
      producerMaxFreshnessBlocks: 120,
      effectiveMaxFreshnessBlocks: 120,
      pools: [
        {
          status: "fresh",
          stateKind: "cl-replay-v1",
          poolId: "slipstream-usdc-weth-100",
          chainId: 8453,
          poolAddress: "0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59",
          token0: "0x4200000000000000000000000000000000000006",
          token1: "0xf307e242bfe1ec1ff01a4cef2fdaa81b10a52418",
          venueFamily: "Slipstream",
          tickSpacing: 100,
          sqrtPriceX96: "79228162514264337593543950336",
          tick: 179200,
          liquidity: "1000",
          fee: "100",
          feeSource: "pool-fee",
          observedThroughBlock: 120,
          blockHash:
            "0x1111111111111111111111111111111111111111111111111111111111111111",
          parentHash:
            "0x2222222222222222222222222222222222222222222222222222222222222222",
          snapshotId: "unit-cl-replay",
          stateHash:
            "0x3333333333333333333333333333333333333333333333333333333333333333",
          source: "slipstream-pool-state",
          sourceRegistryId: "unit",
          maxFreshnessBlocks: 120,
          bitmapWordCount: 1,
          initializedTickCount: 1,
          bitmapChunkCount: 1,
          tickChunkCount: 1,
          minWordPosition: 7,
          maxWordPosition: 7,
          minTick: 179200,
          maxTick: 179200,
          bitmapWords: [
            {
              wordPosition: 7,
              bitmap:
                "0x0000000000000000000000000000000000000000000000000000000000000001",
            },
          ],
          initializedTicks: [
            { tick: 179200, liquidityGross: "25", liquidityNet: "15" },
          ],
        },
      ],
    });

    assert.equal(parsed.pools[0]?.status, "fresh");
    assert.equal(
      parsed.pools[0]?.status === "fresh" &&
        "stateKind" in parsed.pools[0] &&
        parsed.pools[0].stateKind,
      "cl-replay-v1",
    );
  });

  it("parses stale CL replay metadata without heavy bitmap and tick state", () => {
    const parsed = parseIndexedPoolStateResponse({
      sourceRegistryId: "unit",
      currentBlock: 125,
      producerMaxFreshnessBlocks: 120,
      effectiveMaxFreshnessBlocks: 120,
      pools: [
        {
          status: "stale",
          stateKind: "cl-replay-v1",
          poolId: "slipstream-usdc-weth-100",
          chainId: 8453,
          poolAddress: "0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59",
          token0: "0x4200000000000000000000000000000000000006",
          token1: "0xf307e242bfe1ec1ff01a4cef2fdaa81b10a52418",
          venueFamily: "Slipstream",
          tickSpacing: 100,
          sqrtPriceX96: "79228162514264337593543950336",
          tick: 179200,
          liquidity: "1000",
          fee: "100",
          feeSource: "pool-fee",
          observedThroughBlock: 1,
          blockHash:
            "0x1111111111111111111111111111111111111111111111111111111111111111",
          parentHash:
            "0x2222222222222222222222222222222222222222222222222222222222222222",
          snapshotId: "unit-cl-replay",
          stateHash:
            "0x3333333333333333333333333333333333333333333333333333333333333333",
          source: "slipstream-pool-state",
          sourceRegistryId: "unit",
          maxFreshnessBlocks: 120,
          bitmapWordCount: 0,
          initializedTickCount: 0,
          bitmapChunkCount: 0,
          tickChunkCount: 0,
          minWordPosition: null,
          maxWordPosition: null,
          minTick: null,
          maxTick: null,
        },
      ],
    });

    const pool = parsed.pools[0];
    assert.equal(pool?.status, "stale");
    assert.equal(pool && "stateKind" in pool && pool.stateKind, "cl-replay-v1");
    assert.equal(pool && "bitmapWords" in pool, false);
  });

  it("rejects incomplete fresh CL replay tick snapshots", () => {
    assert.throws(
      () =>
        parseIndexedPoolStateResponse({
          sourceRegistryId: "unit",
          currentBlock: 125,
          producerMaxFreshnessBlocks: 120,
          effectiveMaxFreshnessBlocks: 120,
          pools: [
            {
              status: "fresh",
              stateKind: "cl-replay-v1",
              poolId: "slipstream-usdc-weth-100",
              chainId: 8453,
              poolAddress: "0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59",
              token0: "0x4200000000000000000000000000000000000006",
              token1: "0xf307e242bfe1ec1ff01a4cef2fdaa81b10a52418",
              venueFamily: "Slipstream",
              tickSpacing: 100,
              sqrtPriceX96: "79228162514264337593543950336",
              tick: 179200,
              liquidity: "1000",
              fee: "100",
              feeSource: "pool-fee",
              observedThroughBlock: 120,
              blockHash:
                "0x1111111111111111111111111111111111111111111111111111111111111111",
              parentHash:
                "0x2222222222222222222222222222222222222222222222222222222222222222",
              snapshotId: "unit-cl-replay",
              stateHash:
                "0x3333333333333333333333333333333333333333333333333333333333333333",
              source: "slipstream-pool-state",
              sourceRegistryId: "unit",
              maxFreshnessBlocks: 120,
              bitmapWordCount: 1,
              initializedTickCount: 2,
              bitmapChunkCount: 1,
              tickChunkCount: 1,
              minWordPosition: 7,
              maxWordPosition: 7,
              minTick: 179200,
              maxTick: 179200,
              bitmapWords: [
                {
                  wordPosition: 7,
                  bitmap:
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                },
              ],
              initializedTicks: [
                { tick: 179200, liquidityGross: "25", liquidityNet: "15" },
              ],
            },
          ],
        }),
      /initializedTicks/,
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

  it("rejects helper responses whose block context does not match the request", async () => {
    const client = createIndexedPoolStateClient({
      endpointUrl: "https://society.example/fame/pool-state",
      serviceToken: "unit-token",
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            sourceRegistryId: "unit",
            currentBlock: 126,
            producerMaxFreshnessBlocks: 120,
            effectiveMaxFreshnessBlocks: 120,
            pools: [],
          }),
        ),
    });

    await assert.rejects(
      () =>
        client.fetchPoolStates({
          currentBlock: 125,
          poolIds: ["uniswap-v2-fame-direct"],
        }),
      /currentBlock/,
    );
  });

  it("rejects future and over-age fresh helper rows", async () => {
    const pool = {
      status: "fresh",
      poolId: "uniswap-v2-fame-direct",
      chainId: 8453,
      poolAddress: "0x3e2cab55bebf41719148b4e6b63f6644b18ae49c",
      token0: "0x4200000000000000000000000000000000000006",
      token1: "0xf307e242bfe1ec1ff01a4cef2fdaa81b10a52418",
      reserve0: "100",
      reserve1: "250",
      k: "25000",
      lastReserveChangeBlock: 119,
      source: "getReserves",
      quoteModel: "constant-product-reserves",
      maxFreshnessBlocks: 10,
    };
    const futureClient = createIndexedPoolStateClient({
      endpointUrl: "https://society.example/fame/pool-state",
      serviceToken: "unit-token",
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            sourceRegistryId: "unit",
            currentBlock: 125,
            producerMaxFreshnessBlocks: 120,
            effectiveMaxFreshnessBlocks: 10,
            pools: [{ ...pool, observedThroughBlock: 126 }],
          }),
        ),
    });
    const staleFreshClient = createIndexedPoolStateClient({
      endpointUrl: "https://society.example/fame/pool-state",
      serviceToken: "unit-token",
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            sourceRegistryId: "unit",
            currentBlock: 125,
            producerMaxFreshnessBlocks: 120,
            effectiveMaxFreshnessBlocks: 10,
            pools: [{ ...pool, observedThroughBlock: 100 }],
          }),
        ),
    });

    await assert.rejects(
      () =>
        futureClient.fetchPoolStates({
          currentBlock: 125,
          poolIds: ["uniswap-v2-fame-direct"],
        }),
      /observedThroughBlock/,
    );
    await assert.rejects(
      () =>
        staleFreshClient.fetchPoolStates({
          currentBlock: 125,
          poolIds: ["uniswap-v2-fame-direct"],
        }),
      /maxFreshnessBlocks/,
    );
  });
});

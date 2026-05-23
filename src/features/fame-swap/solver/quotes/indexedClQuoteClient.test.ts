import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createIndexedClQuoteClient,
  parseIndexedClQuoteResponse,
} from "./indexedClQuoteClient";
import { USDC, WETH } from "../../tokens";

const quotedResponse = {
  sourceRegistryId: "unit-registry",
  currentBlock: 125,
  producerMaxFreshnessBlocks: 120,
  effectiveMaxFreshnessBlocks: 120,
  quotes: [
    {
      status: "quoted",
      quoteKind: "cl-quote-v1",
      poolId: "slipstream-usdc-weth-100",
      chainId: 8453,
      poolAddress: "0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59",
      token0: WETH,
      token1: USDC,
      tokenIn: WETH,
      tokenOut: USDC,
      venueFamily: "Slipstream",
      tickSpacing: 100,
      amountIn: "1000000",
      amountOut: "999900",
      sqrtPriceX96: "79228162514264337593543950336",
      sqrtPriceX96After: "79228162514264337593543950335",
      tick: 0,
      liquidity: "1000000000000000000",
      fee: "100",
      feeSource: "pool-fee",
      observedThroughBlock: 120,
      blockHash:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
      parentHash:
        "0x2222222222222222222222222222222222222222222222222222222222222222",
      snapshotId: "unit-cl-quote",
      stateHash:
        "0x3333333333333333333333333333333333333333333333333333333333333333",
      source: "slipstream-pool-state",
      sourceRegistryId: "unit-registry",
      maxFreshnessBlocks: 120,
    },
  ],
} as const;

describe("FAME indexed CL quote client", () => {
  it("posts compact quote requests with service auth", async () => {
    const requests: Request[] = [];
    const client = createIndexedClQuoteClient({
      endpointUrl: "https://society.example/fame/pool-quotes",
      serviceToken: "unit-token",
      fetchFn: async (input, init) => {
        requests.push(new Request(input, init));
        return new Response(JSON.stringify(quotedResponse));
      },
    });

    const response = await client.fetchQuotes({
      currentBlock: 125,
      maxFreshnessBlocks: 10,
      quotes: [
        {
          poolId: "slipstream-usdc-weth-100",
          tokenIn: WETH,
          tokenOut: USDC,
          amountIn: "1000000",
        },
      ],
    });

    assert.equal(response.quotes[0]?.status, "quoted");
    assert.equal(requests[0]?.headers.get("authorization"), "Bearer unit-token");
    assert.deepEqual(await requests[0]?.json(), {
      currentBlock: 125,
      maxFreshnessBlocks: 10,
      quotes: [
        {
          poolId: "slipstream-usdc-weth-100",
          tokenIn: WETH,
          tokenOut: USDC,
          amountIn: "1000000",
        },
      ],
    });
  });

  it("parses quoted and unavailable compact entries", () => {
    const parsed = parseIndexedClQuoteResponse({
      ...quotedResponse,
      quotes: [
        quotedResponse.quotes[0],
        {
          status: "unavailable",
          requested: {
            poolId: "slipstream-usdc-weth-100",
            tokenIn: WETH,
            tokenOut: USDC,
            amountIn: "1000000",
          },
          reason: "stale-indexed-state",
          poolId: "slipstream-usdc-weth-100",
          chainId: 8453,
          poolAddress: "0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59",
          observedThroughBlock: 1,
          sourceRegistryId: "unit-registry",
          maxFreshnessBlocks: 120,
        },
      ],
    });

    assert.deepEqual(
      parsed.quotes.map((quote) => quote.status),
      ["quoted", "unavailable"],
    );
    assert.equal("initializedTicks" in parsed.quotes[0]!, false);
    assert.equal("bitmapWords" in parsed.quotes[0]!, false);
  });

  it("rejects non-OK and malformed responses without exposing credentials", async () => {
    const client = createIndexedClQuoteClient({
      endpointUrl: "https://society.example/fame/pool-quotes",
      serviceToken: "super-secret-token",
      fetchFn: async () =>
        new Response(JSON.stringify({ error: "nope" }), { status: 401 }),
    });

    await assert.rejects(
      () =>
        client.fetchQuotes({
          currentBlock: 125,
          quotes: [],
        }),
      (error) =>
        error instanceof Error &&
        /status 401/.test(error.message) &&
        !/super-secret-token/.test(error.message),
    );

    assert.throws(() => parseIndexedClQuoteResponse({ quotes: [] }));
  });

  it("rejects helper responses whose quote freshness is impossible", async () => {
    const futureClient = createIndexedClQuoteClient({
      endpointUrl: "https://society.example/fame/pool-quotes",
      serviceToken: "unit-token",
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ...quotedResponse,
            quotes: [
              {
                ...quotedResponse.quotes[0],
                observedThroughBlock: 126,
              },
            ],
          }),
        ),
    });
    const staleFreshClient = createIndexedClQuoteClient({
      endpointUrl: "https://society.example/fame/pool-quotes",
      serviceToken: "unit-token",
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ...quotedResponse,
            effectiveMaxFreshnessBlocks: 10,
            quotes: [
              {
                ...quotedResponse.quotes[0],
                observedThroughBlock: 100,
                maxFreshnessBlocks: 10,
              },
            ],
          }),
        ),
    });

    await assert.rejects(
      () =>
        futureClient.fetchQuotes({
          currentBlock: 125,
          quotes: [],
        }),
      /observedThroughBlock/,
    );
    await assert.rejects(
      () =>
        staleFreshClient.fetchQuotes({
          currentBlock: 125,
          quotes: [],
        }),
      /maxFreshnessBlocks/,
    );
  });
});

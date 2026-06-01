import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import poolQuoteFixture from "./fixtures/pool-quotes-v1.json";
import {
  createIndexedQuoteApiClient,
  parseIndexedQuoteApiResponse,
  type FameConstantProductPoolQuoteQuotedEntry,
} from "./indexedQuoteApiClient";
import { USDC, WETH } from "../../tokens";

const quotedResponse = poolQuoteFixture.response;
const POOL_QUOTES_V1_FIXTURE_SHA256 =
  "1167e7daf16ed8c90c01b053dce24bb08579aef88a24a1ae1a756b290c34237d";
const clQuoteRow = {
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
  sourceRegistryId: quotedResponse.sourceRegistryId,
  maxFreshnessBlocks: 120,
} as const;

describe("FAME indexed quote API client", () => {
  it("posts compact quote requests with service auth", async () => {
    const requests: Request[] = [];
    const client = createIndexedQuoteApiClient({
      endpointUrl: "https://society.example/fame/pool-quotes",
      serviceToken: "unit-token",
      fetchFn: async (input, init) => {
        requests.push(new Request(input, init));
        return new Response(JSON.stringify(quotedResponse));
      },
    });

    const response = await client.fetchQuotes({
      currentBlock: 125,
      maxFreshnessBlocks: 120,
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
    assert.equal(response.quotes[1]?.status, "quoted");
    assert.equal(
      requests[0]?.headers.get("authorization"),
      "Bearer unit-token",
    );
    assert.deepEqual(await requests[0]?.json(), {
      currentBlock: 125,
      maxFreshnessBlocks: 120,
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

  it("parses CL, reserve, and unavailable compact entries", () => {
    const parsed = parseIndexedQuoteApiResponse({
      ...quotedResponse,
      quotes: [
        clQuoteRow,
        quotedResponse.quotes[0],
        {
          status: "unavailable",
          requested: {
            poolId: "slipstream-usdc-weth-100",
            tokenIn: WETH,
            tokenOut: USDC,
            amountIn: "1000000",
          },
          reason: "producer-untrusted",
          poolId: "slipstream-usdc-weth-100",
          chainId: 8453,
          poolAddress: "0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59",
          observedThroughBlock: 1,
          sourceRegistryId: "unit-registry",
          maxFreshnessBlocks: 120,
          producerStatus: "trusted",
          producerReason: null,
        },
      ],
    });
    const unavailable = parsed.quotes[2];

    assert.deepEqual(
      parsed.quotes.map((quote) =>
        quote.status === "quoted" ? quote.quoteKind : quote.status,
      ),
      ["cl-quote-v1", "constant-product-quote-v1", "unavailable"],
    );
    assert.equal("initializedTicks" in parsed.quotes[0]!, false);
    assert.equal("reserve0" in parsed.quotes[1]!, false);
    assert.equal("reserve1" in parsed.quotes[1]!, false);
    assert.equal(unavailable?.status, "unavailable");
    if (unavailable?.status !== "unavailable") {
      throw new Error("Expected unavailable producer trust row.");
    }
    assert.equal(unavailable.reason, "producer-untrusted");
    assert.equal(unavailable.producerStatus, "trusted");
    assert.equal(unavailable.producerReason, null);
  });

  it("accepts the versioned reserve fixture contract", () => {
    const fixtureBytes = readFileSync(
      new URL("./fixtures/pool-quotes-v1.json", import.meta.url),
    );
    assert.equal(
      createHash("sha256").update(fixtureBytes).digest("hex"),
      POOL_QUOTES_V1_FIXTURE_SHA256,
    );

    const parsed = parseIndexedQuoteApiResponse(quotedResponse);
    const reserveRows = parsed.quotes.filter(
      (quote) =>
        quote.status === "quoted" &&
        quote.quoteKind === "constant-product-quote-v1",
    );
    const reserveRow = parsed.quotes.find(
      (quote): quote is FameConstantProductPoolQuoteQuotedEntry =>
        quote.status === "quoted" &&
        quote.quoteKind === "constant-product-quote-v1" &&
        quote.poolId === "aerodrome-v2-usdc-weth" &&
        quote.tokenIn.toLowerCase() === WETH.toLowerCase(),
    );

    assert.equal(reserveRows.length, 14);
    assert.ok(reserveRow);
    assert.equal(reserveRow.amountOut, "831");
    assert.equal(reserveRow.quoteModelVersion, 1);
    assert.equal(reserveRow.feeBps, 30);
    assert.equal(reserveRow.feeSource, "registry-fee");
    assert.equal(reserveRow.priceImpact.marketImpactBps, 3352);
    assert.equal(reserveRow.protocolEvidence.quote.value, "831");
  });

  it("documents producer-untrusted unavailable fixture examples", () => {
    const [baselineProducerUntrusted, candidateProducerUntrusted] =
      poolQuoteFixture.unavailableExamples;
    const parsed = parseIndexedQuoteApiResponse({
      ...quotedResponse,
      quotes: [baselineProducerUntrusted, candidateProducerUntrusted],
    });
    const [baselineRow, candidateRow] = parsed.quotes;

    assert.equal(baselineRow?.status, "unavailable");
    if (baselineRow?.status !== "unavailable") {
      throw new Error("Expected trusted producer-untrusted fixture example.");
    }
    assert.equal(baselineRow.reason, "producer-untrusted");
    assert.equal(baselineRow.producerStatus, "trusted");
    assert.equal(baselineRow.producerReason, null);
    assert.equal(candidateRow?.status, "unavailable");
    if (candidateRow?.status !== "unavailable") {
      throw new Error("Expected candidate producer-untrusted fixture example.");
    }
    assert.equal(candidateRow.reason, "producer-untrusted");
    assert.equal(candidateRow.poolId, "slipstream-basedflick-fame");
    assert.equal(candidateRow.producerStatus, "warming");
    assert.equal(candidateRow.producerReason, "shadow-not-promoted");
  });

  it("rejects non-OK and malformed responses without exposing credentials", async () => {
    const client = createIndexedQuoteApiClient({
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

    assert.throws(() => parseIndexedQuoteApiResponse({ quotes: [] }));
    assert.throws(
      () =>
        parseIndexedQuoteApiResponse({
          ...quotedResponse,
          quotes: [
            {
              ...quotedResponse.quotes[0],
              quoteModelVersion: 2,
            },
          ],
        }),
      /quoteModelVersion/,
    );
    assert.throws(
      () =>
        parseIndexedQuoteApiResponse({
          ...quotedResponse,
          quotes: [
            {
              ...quotedResponse.quotes[0],
              amountOut: "1.2",
            },
          ],
        }),
      /amountOut/,
    );
    assert.throws(
      () =>
        parseIndexedQuoteApiResponse({
          ...quotedResponse,
          quotes: [
            {
              status: "unavailable",
              requested: {
                poolId: "slipstream-usdc-weth-100",
                tokenIn: WETH,
                tokenOut: USDC,
                amountIn: "1000000",
              },
              reason: "operator-sad",
            },
          ],
        }),
      /reason/,
    );
    assert.throws(
      () =>
        parseIndexedQuoteApiResponse({
          ...quotedResponse,
          quotes: [
            {
              status: "unavailable",
              requested: {
                poolId: "slipstream-usdc-weth-100",
                tokenIn: WETH,
                tokenOut: USDC,
                amountIn: "1000000",
              },
              reason: "producer-untrusted",
              producerStatus: "sleepy",
            },
          ],
        }),
      /producerStatus/,
    );
  });

  it("rejects helper responses that loosen the requested freshness cap", async () => {
    const futureClient = createIndexedQuoteApiClient({
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
    const looseFreshnessClient = createIndexedQuoteApiClient({
      endpointUrl: "https://society.example/fame/pool-quotes",
      serviceToken: "unit-token",
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ...quotedResponse,
            effectiveMaxFreshnessBlocks: 120,
            quotes: [
              {
                ...quotedResponse.quotes[0],
                observedThroughBlock: 100,
                maxFreshnessBlocks: 120,
              },
            ],
          }),
        ),
    });
    const staleRowClient = createIndexedQuoteApiClient({
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
                maxFreshnessBlocks: 120,
              },
            ],
          }),
        ),
    });
    const currentBlockMismatchClient = createIndexedQuoteApiClient({
      endpointUrl: "https://society.example/fame/pool-quotes",
      serviceToken: "unit-token",
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            ...quotedResponse,
            currentBlock: 126,
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
        looseFreshnessClient.fetchQuotes({
          currentBlock: 125,
          maxFreshnessBlocks: 10,
          quotes: [],
        }),
      /effectiveMaxFreshnessBlocks/,
    );
    await assert.rejects(
      () =>
        staleRowClient.fetchQuotes({
          currentBlock: 125,
          maxFreshnessBlocks: 10,
          quotes: [],
        }),
      /maxFreshnessBlocks/,
    );
    await assert.rejects(
      () =>
        currentBlockMismatchClient.fetchQuotes({
          currentBlock: 125,
          quotes: [],
        }),
      /currentBlock/,
    );
  });

  it("aborts quote API requests at the configured timeout", async () => {
    const client = createIndexedQuoteApiClient({
      endpointUrl: "https://society.example/fame/pool-quotes",
      serviceToken: "unit-token",
      timeoutMs: 1,
      fetchFn: async (_input, init) =>
        await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    });

    await assert.rejects(
      () =>
        client.fetchQuotes({
          currentBlock: 125,
          quotes: [],
        }),
      (error) => error instanceof Error && error.name === "AbortError",
    );
  });
});

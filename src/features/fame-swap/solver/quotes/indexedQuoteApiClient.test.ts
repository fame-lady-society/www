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
import {
  FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE,
  FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
} from "../poolStateRegistry";

const quotedResponse = poolQuoteFixture.response;
const POOL_QUOTES_V1_FIXTURE_SHA256 =
  "e994c740c00f179d16492d9c68db4ca63024d3df9d74fd4165b08a6fdcbbc952";
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
const v4QuoteRow = {
  status: "quoted",
  quoteKind: "cl-quote-v1",
  poolId: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId,
  chainId: 8453,
  poolAddress: null,
  poolKey: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey,
  poolManager: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolManager,
  stateViewAddress: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.stateViewAddress,
  token0: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency0,
  token1: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency1,
  tokenIn: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency0,
  tokenOut: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency1,
  venueFamily: "UniswapV4",
  tickSpacing: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.tickSpacing,
  amountIn: "1000000",
  amountOut: "969999",
  sqrtPriceX96: "79228162514264337593543950336",
  sqrtPriceX96After: "79228162514110420726332444185",
  tick: 0,
  liquidity: "1000000000000000000",
  fee: "30000",
  lpFee: "30000",
  protocolFee: "0",
  protocolFeeStatus: "zero",
  staticFee: "30000",
  feeSource: "v4-slot0",
  observedThroughBlock: 120,
  blockHash:
    "0x4444444444444444444444444444444444444444444444444444444444444444",
  parentHash:
    "0x5555555555555555555555555555555555555555555555555555555555555555",
  snapshotId: "unit-v4-cl-quote",
  stateHash:
    "0x6666666666666666666666666666666666666666666666666666666666666666",
  source: "uniswap-v4-state-view",
  sourceRegistryId: quotedResponse.sourceRegistryId,
  maxFreshnessBlocks: 120,
  hookAddress: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.hooks,
  hookData: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.hookData,
  hookDataStatus: "empty",
  reviewedPoolEvidence: {
    status: "verified",
    source: "reviewed-v4-manifest",
    kind: "zora-protocol-pool",
    manifestVersion: 1,
    poolId: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId,
    poolKey: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey,
    staticFee: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.fee.toString(),
    hookAddress: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.hooks,
    hookData: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.hookData,
    protocolFeeStatus: "zero",
  },
  zoraProvenance: {
    status: "verified",
    source: "zora-factory-event",
    chainId: 8453,
    factoryAddress: "0x0000000000000000000000000000000000000003",
    coinAddress: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency1,
    poolKey: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey,
    poolId: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey,
    transactionHash:
      "0x7777777777777777777777777777777777777777777777777777777777777777",
    eventName: "CoinCreatedV4",
  },
} as const;
const zoraEthV4QuoteRow = {
  status: "quoted",
  quoteKind: "cl-quote-v1",
  poolId: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.poolId,
  chainId: 8453,
  poolAddress: null,
  poolKey: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.poolKey,
  poolManager: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.poolManager,
  stateViewAddress: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.stateViewAddress,
  token0: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency0,
  token1: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency1,
  tokenIn: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency0,
  tokenOut: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.currency1,
  venueFamily: "UniswapV4",
  tickSpacing: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.tickSpacing,
  amountIn: "1000000",
  amountOut: "969999",
  sqrtPriceX96: "79228162514264337593543950336",
  sqrtPriceX96After: "79228162514110420726332444185",
  tick: 0,
  liquidity: "1000000000000000000",
  fee: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.fee.toString(),
  lpFee: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.fee.toString(),
  protocolFee: "0",
  protocolFeeStatus: "zero",
  staticFee: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.fee.toString(),
  feeSource: "v4-slot0",
  observedThroughBlock: 120,
  blockHash:
    "0x4444444444444444444444444444444444444444444444444444444444444444",
  parentHash:
    "0x5555555555555555555555555555555555555555555555555555555555555555",
  snapshotId: "unit-v4-zora-eth-quote",
  stateHash:
    "0x6666666666666666666666666666666666666666666666666666666666666666",
  source: "uniswap-v4-state-view",
  sourceRegistryId: quotedResponse.sourceRegistryId,
  maxFreshnessBlocks: 120,
  hookAddress: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.hooks,
  hookData: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.hookData,
  hookDataStatus: "empty",
  reviewedPoolEvidence: {
    status: "verified",
    source: "reviewed-v4-manifest",
    kind: "zero-hook-static-fee",
    manifestVersion: 1,
    poolId: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.poolId,
    poolKey: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.poolKey,
    staticFee: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.fee.toString(),
    hookAddress: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.hooks,
    hookData: FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.hookData,
    protocolFeeStatus: "zero",
  },
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

  it("parses CL, V4 CL, reserve, and unavailable compact entries", () => {
    const parsed = parseIndexedQuoteApiResponse({
      ...quotedResponse,
      quotes: [
        clQuoteRow,
        v4QuoteRow,
        quotedResponse.quotes[0],
        {
          status: "unavailable",
          requested: {
            poolId: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId,
            tokenIn: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency0,
            tokenOut: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency1,
            amountIn: "1000000",
          },
          reason: "fee-model-mismatch",
          poolId: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId,
          chainId: 8453,
          poolAddress: null,
          poolKey: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey,
          stateViewAddress: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.stateViewAddress,
          observedThroughBlock: 1,
          sourceRegistryId: "unit-registry",
          maxFreshnessBlocks: 120,
          producerStatus: "trusted",
          producerReason: null,
        },
      ],
    });
    const unavailable = parsed.quotes[3];

    assert.deepEqual(
      parsed.quotes.map((quote) =>
        quote.status === "quoted" ? quote.quoteKind : quote.status,
      ),
      [
        "cl-quote-v1",
        "cl-quote-v1",
        "constant-product-quote-v1",
        "unavailable",
      ],
    );
    assert.equal("initializedTicks" in parsed.quotes[0]!, false);
    const v4Row = parsed.quotes[1];
    assert.equal(v4Row?.status, "quoted");
    assert.equal(v4Row?.quoteKind, "cl-quote-v1");
    assert.equal(v4Row.source, "uniswap-v4-state-view");
    assert.equal(v4Row.poolAddress, null);
    assert.equal(v4Row.poolKey, FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey);
    assert.equal(v4Row.reviewedPoolEvidence.kind, "zora-protocol-pool");
    assert.equal(
      v4Row.reviewedPoolEvidence.poolKey,
      FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey,
    );
    assert.ok(v4Row.zoraProvenance);
    assert.equal(v4Row.zoraProvenance.poolKey, v4Row.poolKey);
    assert.equal("initializedTicks" in v4Row, false);
    assert.equal("reserve0" in parsed.quotes[2]!, false);
    assert.equal("reserve1" in parsed.quotes[2]!, false);
    assert.equal(parsed.quotes[3]?.status, "unavailable");
    assert.equal(parsed.quotes[3]?.reason, "fee-model-mismatch");
    assert.equal(
      parsed.quotes[3]?.poolKey,
      FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey,
    );
    assert.equal(unavailable?.status, "unavailable");
    if (unavailable?.status !== "unavailable") {
      throw new Error("Expected unavailable V4 fee-model row.");
    }
    assert.equal(unavailable.reason, "fee-model-mismatch");
    assert.equal(unavailable.producerStatus, "trusted");
    assert.equal(unavailable.producerReason, null);
  });

  it("parses no-hook ZORA/ETH V4 compact rows without provenance", () => {
    const parsed = parseIndexedQuoteApiResponse({
      ...quotedResponse,
      quotes: [zoraEthV4QuoteRow],
    });
    const row = parsed.quotes[0];

    assert.equal(row?.status, "quoted");
    if (
      row?.status !== "quoted" ||
      row.quoteKind !== "cl-quote-v1" ||
      !("poolKey" in row)
    ) {
      throw new Error("Expected quoted V4 CL row.");
    }
    assert.equal(row.poolId, FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.poolId);
    assert.equal(row.poolKey, FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.poolKey);
    assert.equal(row.zoraProvenance, undefined);
    assert.equal(row.reviewedPoolEvidence.kind, "zero-hook-static-fee");
    assert.equal(
      row.reviewedPoolEvidence.staticFee,
      FAME_V4_ZORA_ETH_REVIEWED_POOL_SHAPE.fee.toString(),
    );
  });

  it("parses producer trust unavailable compact entries", () => {
    const parsed = parseIndexedQuoteApiResponse({
      ...quotedResponse,
      quotes: [
        {
          status: "unavailable",
          requested: {
            poolId: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId,
            tokenIn: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency0,
            tokenOut: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.currency1,
            amountIn: "1000000",
          },
          reason: "producer-untrusted",
          poolId: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId,
          chainId: 8453,
          poolAddress: null,
          poolKey: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey,
          stateViewAddress: FAME_V4_ZORA_REVIEWED_POOL_SHAPE.stateViewAddress,
          observedThroughBlock: 1,
          sourceRegistryId: "unit-registry",
          maxFreshnessBlocks: 120,
          producerStatus: "trusted",
          producerReason: null,
        },
      ],
    });
    const unavailable = parsed.quotes[0];
    assert.equal(unavailable?.status, "unavailable");
    if (unavailable?.status !== "unavailable") {
      throw new Error("Expected unavailable producer trust row.");
    }
    assert.equal(unavailable.reason, "producer-untrusted");
    assert.equal(unavailable.producerStatus, "trusted");
    assert.equal(unavailable.producerReason, null);
  });

  it("rejects ambiguous V4 compact CL rows without required V4 evidence", () => {
    assert.throws(() =>
      parseIndexedQuoteApiResponse({
        ...quotedResponse,
        quotes: [{ ...v4QuoteRow, poolKey: undefined }],
      }),
    );

    assert.throws(
      () =>
        parseIndexedQuoteApiResponse({
          ...quotedResponse,
          quotes: [{ ...v4QuoteRow, reviewedPoolEvidence: undefined }],
        }),
      /reviewedPoolEvidence/,
    );

    assert.throws(() =>
      parseIndexedQuoteApiResponse({
        ...quotedResponse,
        quotes: [{ ...v4QuoteRow, protocolFee: "1" }],
      }),
    );

    assert.throws(() =>
      parseIndexedQuoteApiResponse({
        ...quotedResponse,
        quotes: [{ ...v4QuoteRow, staticFee: "100" }],
      }),
    );

    assert.throws(() =>
      parseIndexedQuoteApiResponse({
        ...quotedResponse,
        quotes: [{ ...v4QuoteRow, hookData: "0x01" }],
      }),
    );
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

  it("leaves row-scoped freshness to the quote adapter", async () => {
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

    const futureResponse = await futureClient.fetchQuotes({
      currentBlock: 125,
      quotes: [],
    });
    const futureRow = futureResponse.quotes[0];
    assert.equal(futureRow?.status, "quoted");
    assert.equal(
      futureRow && "observedThroughBlock" in futureRow
        ? futureRow.observedThroughBlock
        : null,
      126,
    );

    const staleResponse = await staleRowClient.fetchQuotes({
      currentBlock: 125,
      maxFreshnessBlocks: 10,
      quotes: [],
    });
    const staleRow = staleResponse.quotes[0];
    assert.equal(staleRow?.status, "quoted");
    assert.equal(
      staleRow && "observedThroughBlock" in staleRow
        ? staleRow.observedThroughBlock
        : null,
      100,
    );
  });

  it("rejects helper responses that loosen the requested freshness cap", async () => {
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
        looseFreshnessClient.fetchQuotes({
          currentBlock: 125,
          maxFreshnessBlocks: 10,
          quotes: [],
        }),
      /effectiveMaxFreshnessBlocks/,
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

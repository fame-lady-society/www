import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { USDC, WETH } from "../../tokens";
import { famePoolEdgesForPair } from "../poolUniverse";
import type {
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FameQuoteAdapter,
} from "./adapters";
import {
  createIndexedQuoteApiAdapter,
  createQuoteApiDiagnosticsRecorder,
  type FameQuoteApiFallbackReason,
} from "./indexedQuoteApiAdapter";
import type {
  FameClPoolQuoteQuotedEntry,
  FameConstantProductPoolQuoteQuotedEntry,
  FamePoolQuoteBatchRequest,
  FamePoolQuoteBatchResponse,
  FamePoolQuoteClient,
} from "./indexedQuoteApiClient";

const Q96 = 79_228_162_514_264_337_593_543_950_336n;

function edgeFor(poolId: string) {
  const edge = famePoolEdgesForPair(WETH, USDC).find(
    (candidate) => candidate.poolId === poolId,
  );
  assert.ok(edge);
  return edge;
}

function clRow(
  quoteRequest: FamePoolQuoteBatchRequest["quotes"][number],
  overrides: Partial<FameClPoolQuoteQuotedEntry> = {},
): FameClPoolQuoteQuotedEntry {
  return {
    status: "quoted",
    quoteKind: "cl-quote-v1",
    poolId: "slipstream-usdc-weth-100",
    chainId: 8453,
    poolAddress: "0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59",
    token0: WETH,
    token1: USDC,
    tokenIn: quoteRequest.tokenIn,
    tokenOut: quoteRequest.tokenOut,
    venueFamily: "Slipstream",
    tickSpacing: 100,
    amountIn: quoteRequest.amountIn,
    amountOut: "999900",
    sqrtPriceX96: Q96.toString(),
    sqrtPriceX96After: (Q96 - 1n).toString(),
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
    ...overrides,
  };
}

function reserveRow(
  quoteRequest: FamePoolQuoteBatchRequest["quotes"][number],
  overrides: Partial<FameConstantProductPoolQuoteQuotedEntry> = {},
): FameConstantProductPoolQuoteQuotedEntry {
  return {
    status: "quoted",
    quoteKind: "constant-product-quote-v1",
    poolId: "uniswap-v2-usdc-weth",
    chainId: 8453,
    poolAddress: "0x88a43bbdf9d098eec7bceda4e2494615dfd9bb9c",
    token0: WETH,
    token1: USDC,
    tokenIn: quoteRequest.tokenIn,
    tokenOut: quoteRequest.tokenOut,
    venueFamily: "UniswapV2",
    amountIn: quoteRequest.amountIn,
    amountOut: "1992013",
    observedThroughBlock: 120,
    sourceRegistryId: "unit-registry",
    maxFreshnessBlocks: 120,
    quoteModel: "constant-product-reserves",
    quoteModelVersion: 1,
    feeBps: 30,
    feeSource: "registry-fee",
    source: "reserve-pool-state",
    stateSource: "sync-event",
    priceImpact: {
      preSwapPriceX18: "2000000000000000000",
      postSwapPriceX18: "1996011975024975024",
      executionPriceX18: "1992013000000000000",
      marketImpactBps: 39,
      method: "constant-product-reserves",
    },
    protocolEvidence: {
      quote: {
        status: "available",
        source: "indexed reserve quote",
        value: "1992013",
      },
      prePrice: {
        status: "available",
        source: "indexed reserve quote",
        value: "2000000000000000000",
      },
      postPrice: {
        status: "available",
        source: "indexed reserve quote",
        value: "1996011975024975024",
      },
      marketImpact: {
        status: "available",
        source: "indexed reserve quote",
        value: "39",
      },
      activeLiquidity: {
        status: "not_applicable",
        source: "indexed reserve quote",
        reason: "Constant-product reserve quotes use reserves.",
      },
    },
    ...overrides,
  };
}

function quotedResponse(
  request: FamePoolQuoteBatchRequest,
): FamePoolQuoteBatchResponse {
  return {
    sourceRegistryId: "unit-registry",
    currentBlock: request.currentBlock,
    producerMaxFreshnessBlocks: 120,
    effectiveMaxFreshnessBlocks: 120,
    quotes: request.quotes.map((quoteRequest) =>
      quoteRequest.poolId === "slipstream-usdc-weth-100"
        ? clRow(quoteRequest)
        : reserveRow(quoteRequest),
    ),
  };
}

function quoteClient(responses: {
  requests: FamePoolQuoteBatchRequest[];
  response: (
    request: FamePoolQuoteBatchRequest,
  ) => Promise<FamePoolQuoteBatchResponse>;
}): FamePoolQuoteClient {
  return {
    async fetchQuotes(request) {
      responses.requests.push(request);
      return responses.response(request);
    },
  };
}

function fallbackAdapter(counter: { calls: number }): FameQuoteAdapter {
  return {
    quoteEdge(request: FameEdgeQuoteRequest): FameEdgeQuoteResult {
      counter.calls += 1;
      return {
        status: "quoted",
        amountIn: request.amountIn,
        amountOut: 42n,
        capacityIn: null,
        fee: request.edge.fee,
        evidence: "fallback live quote",
      };
    },
  };
}

describe("FAME indexed quote API adapter", () => {
  it("quotes Slipstream edges from compact CL rows", async () => {
    const edge = edgeFor("slipstream-usdc-weth-100");
    const fallback = { calls: 0 };
    const clientRequests: FamePoolQuoteBatchRequest[] = [];
    const adapter = createIndexedQuoteApiAdapter({
      quoteClient: quoteClient({
        requests: clientRequests,
        response: async (request) => quotedResponse(request),
      }),
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      maxFreshnessBlocks: 10,
      expectedSourceRegistryId: "unit-registry",
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 0);
    assert.equal(clientRequests.length, 1);
    assert.deepEqual(clientRequests[0], {
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
    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 999_900n);
      assert.match(quote.evidence, /indexed Slipstream CL quote/);
      assert.equal(quote.context?.source, "indexed");
      assert.equal(quote.priceImpact?.method, "quoter-price-after");
    }
  });

  it("quotes reserve edges from constant-product compact rows", async () => {
    const edge = edgeFor("uniswap-v2-usdc-weth");
    const fallback = { calls: 0 };
    const diagnostics = createQuoteApiDiagnosticsRecorder(true);
    const adapter = createIndexedQuoteApiAdapter({
      quoteClient: quoteClient({
        requests: [],
        response: async (request) => quotedResponse(request),
      }),
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
      diagnostics,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });
    const snapshot = diagnostics.snapshot();

    assert.equal(fallback.calls, 0);
    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.amountOut, 1_992_013n);
      assert.equal(quote.priceImpact?.method, "constant-product-reserves");
      assert.equal(quote.protocolEvidence?.quote.value, "1992013");
      assert.match(quote.evidence, /indexed reserve quote/);
      const context = quote.context;
      assert.ok(context);
      if (context.source !== "indexed") {
        throw new Error("Expected indexed quote context.");
      }
      assert.deepEqual(context.statusCounts, {
        fresh: 0,
        stale: 0,
        unknown: 0,
        unsupported: 0,
      });
    }
    assert.equal(snapshot.attempted, true);
    assert.equal(snapshot.usedCount, 1);
    assert.equal(snapshot.timing.batchRequestCount, 1);
    assert.equal(typeof snapshot.timing.totalBatchDurationMs, "number");
    assert.equal(typeof snapshot.timing.maxBatchDurationMs, "number");
    assert.equal(typeof snapshot.timing.lastBatchDurationMs, "number");
    assert.equal(
      snapshot.details.some((detail) => detail.outcome === "used"),
      true,
    );
  });

  it("uses compact output and live fallback in the same batch", async () => {
    const clEdge = edgeFor("slipstream-usdc-weth-100");
    const reserveEdge = edgeFor("uniswap-v2-usdc-weth");
    const fallback = { calls: 0 };
    const clientRequests: FamePoolQuoteBatchRequest[] = [];
    const diagnostics = createQuoteApiDiagnosticsRecorder(true);
    const adapter = createIndexedQuoteApiAdapter({
      quoteClient: quoteClient({
        requests: clientRequests,
        response: async (request) => ({
          sourceRegistryId: "unit-registry",
          currentBlock: request.currentBlock,
          producerMaxFreshnessBlocks: 120,
          effectiveMaxFreshnessBlocks: 120,
          quotes: request.quotes.map((quoteRequest) =>
            quoteRequest.poolId === "slipstream-usdc-weth-100"
              ? clRow(quoteRequest)
              : {
                  status: "unavailable" as const,
                  requested: quoteRequest,
                  reason: "stale-indexed-state" as const,
                  poolId: quoteRequest.poolId,
                  chainId: 8453,
                  poolAddress: "0x88a43bbdf9d098eec7bceda4e2494615dfd9bb9c",
                  observedThroughBlock: 1,
                  sourceRegistryId: "unit-registry",
                  maxFreshnessBlocks: 120,
                },
          ),
        }),
      }),
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
      diagnostics,
    });

    const [clQuote, reserveQuote] = await Promise.all([
      adapter.quoteEdge({ edge: clEdge, amountIn: 1_000_000n }),
      adapter.quoteEdge({ edge: reserveEdge, amountIn: 1_000_000n }),
    ]);

    assert.equal(clientRequests.length, 1);
    assert.equal(fallback.calls, 1);
    assert.equal(clQuote.status, "quoted");
    assert.equal(reserveQuote.status, "quoted");
    if (reserveQuote.status === "quoted") {
      assert.equal(reserveQuote.evidence, "fallback live quote");
    }
    assert.equal(
      diagnostics.snapshot().fallbackReasonCounts.unavailable_row,
      1,
    );
  });

  it("falls back when compact quote metadata does not match the local pool", async () => {
    const edge = edgeFor("uniswap-v2-usdc-weth");
    const fallback = { calls: 0 };
    const diagnostics = createQuoteApiDiagnosticsRecorder(true);
    const adapter = createIndexedQuoteApiAdapter({
      quoteClient: quoteClient({
        requests: [],
        response: async (request) => ({
          ...quotedResponse(request),
          quotes: request.quotes.map((quoteRequest) =>
            reserveRow(quoteRequest, {
              chainId: 1,
              feeBps: 99,
            }),
          ),
        }),
      }),
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
      diagnostics,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
    assert.equal(
      diagnostics.snapshot().fallbackReasonCounts.row_metadata_mismatch,
      1,
    );
  });

  for (const testCase of [
    {
      name: "response source registry mismatch",
      poolId: "uniswap-v2-usdc-weth",
      expectedReason: "source_registry_mismatch",
      response: (request: FamePoolQuoteBatchRequest) => ({
        ...quotedResponse(request),
        sourceRegistryId: "other-registry",
      }),
    },
    {
      name: "missing response row",
      poolId: "uniswap-v2-usdc-weth",
      expectedReason: "row_not_found",
      response: (request: FamePoolQuoteBatchRequest) => ({
        ...quotedResponse(request),
        quotes: [],
      }),
    },
    {
      name: "row source registry mismatch",
      poolId: "uniswap-v2-usdc-weth",
      expectedReason: "row_source_registry_mismatch",
      response: (request: FamePoolQuoteBatchRequest) => ({
        ...quotedResponse(request),
        quotes: request.quotes.map((quoteRequest) =>
          reserveRow(quoteRequest, { sourceRegistryId: "other-registry" }),
        ),
      }),
    },
    {
      name: "row kind mismatch",
      poolId: "uniswap-v2-usdc-weth",
      expectedReason: "row_kind_mismatch",
      response: (request: FamePoolQuoteBatchRequest) => ({
        ...quotedResponse(request),
        quotes: request.quotes.map((quoteRequest) =>
          clRow(quoteRequest, {
            poolId: "uniswap-v2-usdc-weth",
            poolAddress: "0x88a43bbdf9d098eec7bceda4e2494615dfd9bb9c",
            venueFamily: "UniswapV2",
          }),
        ),
      }),
    },
    {
      name: "unusable CL amount",
      poolId: "slipstream-usdc-weth-100",
      expectedReason: "row_amount_invalid",
      response: (request: FamePoolQuoteBatchRequest) => ({
        ...quotedResponse(request),
        quotes: request.quotes.map((quoteRequest) =>
          clRow(quoteRequest, { amountOut: "0" }),
        ),
      }),
    },
    {
      name: "unusable reserve price impact",
      poolId: "uniswap-v2-usdc-weth",
      expectedReason: "row_price_impact_invalid",
      response: (request: FamePoolQuoteBatchRequest) => ({
        ...quotedResponse(request),
        quotes: request.quotes.map((quoteRequest) =>
          reserveRow(quoteRequest, {
            priceImpact: {
              preSwapPriceX18: "2000000000000000000",
              postSwapPriceX18: "1996011975024975024",
              executionPriceX18: "1".repeat(79),
              marketImpactBps: 39,
              method: "constant-product-reserves",
            },
          }),
        ),
      }),
    },
  ] satisfies readonly {
    name: string;
    poolId: string;
    expectedReason: FameQuoteApiFallbackReason;
    response(request: FamePoolQuoteBatchRequest): FamePoolQuoteBatchResponse;
  }[]) {
    it(`falls back when the quote API returns ${testCase.name}`, async () => {
      const edge = edgeFor(testCase.poolId);
      const fallback = { calls: 0 };
      const diagnostics = createQuoteApiDiagnosticsRecorder(true);
      const adapter = createIndexedQuoteApiAdapter({
        quoteClient: quoteClient({
          requests: [],
          response: async (request) => testCase.response(request),
        }),
        fallback: fallbackAdapter(fallback),
        currentBlock: 125,
        expectedSourceRegistryId: "unit-registry",
        diagnostics,
      });

      const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });
      const snapshot = diagnostics.snapshot();

      assert.equal(fallback.calls, 1);
      assert.equal(quote.status, "quoted");
      assert.equal(snapshot.fallbackReasonCounts[testCase.expectedReason], 1);
    });
  }

  it("falls back every affected edge on batch failure with sanitized diagnostics", async () => {
    const edge = edgeFor("slipstream-usdc-weth-100");
    const fallback = { calls: 0 };
    const diagnostics = createQuoteApiDiagnosticsRecorder(true);
    const adapter = createIndexedQuoteApiAdapter({
      quoteClient: {
        async fetchQuotes() {
          throw new Error(
            "FAME pool quote request failed with status 503. https://unit.example/super-secret",
          );
        },
      },
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
      diagnostics,
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });
    const snapshot = diagnostics.snapshot();

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
    assert.equal(snapshot.batchFailureCount, 1);
    assert.equal(snapshot.timing.batchRequestCount, 1);
    assert.equal(snapshot.details.at(-1)?.batchFailureCategory, "http_error");
    assert.doesNotMatch(JSON.stringify(snapshot), /unit\.example|super-secret/);
  });

  it("reports one batch failure callback for a shared failed batch", async () => {
    const clEdge = edgeFor("slipstream-usdc-weth-100");
    const reserveEdge = edgeFor("uniswap-v2-usdc-weth");
    const fallback = { calls: 0 };
    let batchFailures = 0;
    const adapter = createIndexedQuoteApiAdapter({
      quoteClient: {
        async fetchQuotes() {
          throw new Error("FAME pool quote request failed with status 503.");
        },
      },
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
      onBatchFailure() {
        batchFailures += 1;
      },
    });

    const [clQuote, reserveQuote] = await Promise.all([
      adapter.quoteEdge({ edge: clEdge, amountIn: 1_000_000n }),
      adapter.quoteEdge({ edge: reserveEdge, amountIn: 1_000_000n }),
    ]);

    assert.equal(batchFailures, 1);
    assert.equal(fallback.calls, 2);
    assert.equal(clQuote.status, "quoted");
    assert.equal(reserveQuote.status, "quoted");
  });

  it("coalesces duplicate evaluated edges into one quote API request", async () => {
    const edge = edgeFor("slipstream-usdc-weth-100");
    const fallback = { calls: 0 };
    const clientRequests: FamePoolQuoteBatchRequest[] = [];
    const adapter = createIndexedQuoteApiAdapter({
      quoteClient: quoteClient({
        requests: clientRequests,
        response: async (request) => quotedResponse(request),
      }),
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
    });

    const [left, right] = await Promise.all([
      adapter.quoteEdge({ edge, amountIn: 1_000_000n }),
      adapter.quoteEdge({ edge, amountIn: 1_000_000n }),
    ]);

    assert.equal(fallback.calls, 0);
    assert.equal(left.status, "quoted");
    assert.equal(right.status, "quoted");
    assert.equal(clientRequests.length, 1);
    assert.equal(clientRequests[0]?.quotes.length, 1);
  });
});

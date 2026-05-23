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
  createIndexedClQuoteAdapter,
} from "./indexedClQuoteAdapter";
import type {
  FameIndexedClQuoteBatchRequest,
  FameIndexedClQuoteBatchResponse,
  FameIndexedClQuoteClient,
} from "./indexedClQuoteClient";

const Q96 = 79_228_162_514_264_337_593_543_950_336n;

function slipstreamEdge() {
  const edge = famePoolEdgesForPair(WETH, USDC).find(
    (candidate) => candidate.poolId === "slipstream-usdc-weth-100",
  );
  assert.ok(edge);
  return edge;
}

function quotedResponse(
  request: FameIndexedClQuoteBatchRequest,
  overrides: Partial<
    Extract<FameIndexedClQuoteBatchResponse["quotes"][number], { status: "quoted" }>
  > = {},
): FameIndexedClQuoteBatchResponse {
  return {
    sourceRegistryId: "unit-registry",
    currentBlock: request.currentBlock,
    producerMaxFreshnessBlocks: 120,
    effectiveMaxFreshnessBlocks: 120,
    quotes: request.quotes.map((quoteRequest) => ({
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
    })),
  };
}

function quoteClient(
  responses: {
    requests: FameIndexedClQuoteBatchRequest[];
    response: (
      request: FameIndexedClQuoteBatchRequest,
    ) => Promise<FameIndexedClQuoteBatchResponse>;
  },
): FameIndexedClQuoteClient {
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

describe("FAME indexed CL quote adapter", () => {
  it("quotes Slipstream edges from the backend compact quote surface", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const clientRequests: FameIndexedClQuoteBatchRequest[] = [];
    const adapter = createIndexedClQuoteAdapter({
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

  it("falls back when the compact quote is unavailable", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const adapter = createIndexedClQuoteAdapter({
      quoteClient: quoteClient({
        requests: [],
        response: async (request) => ({
          sourceRegistryId: "unit-registry",
          currentBlock: request.currentBlock,
          producerMaxFreshnessBlocks: 120,
          effectiveMaxFreshnessBlocks: 120,
          quotes: [
            {
              status: "unavailable",
              requested: request.quotes[0]!,
              reason: "stale-indexed-state",
            },
          ],
        }),
      }),
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
    if (quote.status === "quoted") {
      assert.equal(quote.evidence, "fallback live quote");
    }
  });

  it("falls back when backend provenance or request echo does not match", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const adapter = createIndexedClQuoteAdapter({
      quoteClient: quoteClient({
        requests: [],
        response: async (request) =>
          quotedResponse(request, {
            amountIn: "2",
          }),
      }),
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
  });

  it("falls back when compact quote metadata does not match the local pool", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const adapter = createIndexedClQuoteAdapter({
      quoteClient: quoteClient({
        requests: [],
        response: async (request) =>
          quotedResponse(request, {
            chainId: 1,
            token0: USDC,
            token1: WETH,
          }),
      }),
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
    });

    const quote = await adapter.quoteEdge({ edge, amountIn: 1_000_000n });

    assert.equal(fallback.calls, 1);
    assert.equal(quote.status, "quoted");
  });

  it("batches same-turn compact quote requests", async () => {
    const edge = slipstreamEdge();
    const fallback = { calls: 0 };
    const clientRequests: FameIndexedClQuoteBatchRequest[] = [];
    const adapter = createIndexedClQuoteAdapter({
      quoteClient: quoteClient({
        requests: clientRequests,
        response: async (request) => quotedResponse(request),
      }),
      fallback: fallbackAdapter(fallback),
      currentBlock: 125,
      expectedSourceRegistryId: "unit-registry",
    });

    const [small, large] = await Promise.all([
      adapter.quoteEdge({ edge, amountIn: 1_000_000n }),
      adapter.quoteEdge({ edge, amountIn: 2_000_000n }),
    ]);

    assert.equal(fallback.calls, 0);
    assert.equal(small.status, "quoted");
    assert.equal(large.status, "quoted");
    assert.equal(clientRequests.length, 1);
    assert.deepEqual(
      clientRequests[0]?.quotes.map((quote) => quote.amountIn),
      ["1000000", "2000000"],
    );
  });
});

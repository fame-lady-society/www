import { base } from "viem/chains";
import type {
  FameAsyncQuoteAdapter,
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FameQuoteAdapter,
} from "./adapters";
import { concentratedLiquidityPriceImpact } from "./routeMath";
import type {
  FameIndexedClQuoteBatchResponse,
  FameIndexedClQuoteClient,
  FameIndexedClQuoteQuotedEntry,
} from "./indexedClQuoteClient";

const MAX_UINT256 = 2n ** 256n - 1n;
const MAX_UINT256_DECIMAL_LENGTH = MAX_UINT256.toString().length;

function toAsyncQuoteAdapter(
  adapter: FameQuoteAdapter | FameAsyncQuoteAdapter,
): FameAsyncQuoteAdapter {
  return {
    quoteContext: adapter.quoteContext,
    async quoteEdge(request) {
      return adapter.quoteEdge(request);
    },
  };
}

function sameAddress(left: `0x${string}`, right: `0x${string}`): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function parsePositiveUint256Decimal(value: string): bigint | null {
  if (value.length > MAX_UINT256_DECIMAL_LENGTH) return null;
  if (!/^(0|[1-9][0-9]*)$/.test(value)) return null;
  const parsed = BigInt(value);
  return parsed > 0n && parsed <= MAX_UINT256 ? parsed : null;
}

function statusCounts(response: FameIndexedClQuoteBatchResponse) {
  return response.quotes.reduce(
    (counts, quote) => {
      if (quote.status === "quoted") {
        return { ...counts, fresh: counts.fresh + 1 };
      }
      if (quote.reason === "unsupported-pool") {
        return { ...counts, unsupported: counts.unsupported + 1 };
      }
      if (quote.reason === "stale-indexed-state") {
        return { ...counts, stale: counts.stale + 1 };
      }
      return { ...counts, unknown: counts.unknown + 1 };
    },
    {
      fresh: 0,
      stale: 0,
      unknown: 0,
      unsupported: 0,
    },
  );
}

function requestSupportedByIndexedClQuotes(
  request: FameEdgeQuoteRequest,
): boolean {
  return (
    request.edge.poolId === "slipstream-usdc-weth-100" &&
    request.edge.pool.venue === "aerodrome-slipstream" &&
    "pool" in request.edge.pool
  );
}

function quoteMatchesRequest(
  quote: FameIndexedClQuoteQuotedEntry,
  request: FameEdgeQuoteRequest,
): boolean {
  const pool = request.edge.pool;
  return (
    quote.poolId === request.edge.poolId &&
    pool.venue === "aerodrome-slipstream" &&
    quote.chainId === base.id &&
    "pool" in pool &&
    sameAddress(quote.poolAddress, pool.pool) &&
    sameAddress(quote.token0, pool.token0) &&
    sameAddress(quote.token1, pool.token1) &&
    sameAddress(quote.tokenIn, request.edge.tokenIn) &&
    sameAddress(quote.tokenOut, request.edge.tokenOut) &&
    quote.venueFamily === request.edge.venue &&
    quote.tickSpacing === pool.tickSpacing &&
    quote.feeSource === "pool-fee" &&
    quote.amountIn === request.amountIn.toString()
  );
}

function quoteResultFromIndexedClQuote(options: {
  response: FameIndexedClQuoteBatchResponse;
  quote: FameIndexedClQuoteQuotedEntry;
  request: FameEdgeQuoteRequest;
}): FameEdgeQuoteResult {
  const amountOut = parsePositiveUint256Decimal(options.quote.amountOut);
  const preSwapSqrtPriceX96 = parsePositiveUint256Decimal(
    options.quote.sqrtPriceX96,
  );
  const postSwapSqrtPriceX96 = parsePositiveUint256Decimal(
    options.quote.sqrtPriceX96After,
  );
  if (
    amountOut === null ||
    preSwapSqrtPriceX96 === null ||
    postSwapSqrtPriceX96 === null
  ) {
    return {
      status: "failed",
      reason: "no_quote_evidence",
      message: "Indexed CL quote response was not usable.",
    };
  }

  return {
    status: "quoted",
    amountIn: options.request.amountIn,
    amountOut,
    capacityIn: null,
    fee: options.request.edge.fee,
    evidence: `indexed Slipstream CL quote for ${options.quote.poolId} snapshot ${options.quote.snapshotId}`,
    context: {
      source: "indexed",
      chainId: options.quote.chainId,
      currentBlock: options.response.currentBlock,
      sourceRegistryId: options.response.sourceRegistryId,
      effectiveMaxFreshnessBlocks:
        options.response.effectiveMaxFreshnessBlocks,
      statusCounts: statusCounts(options.response),
    },
    priceImpact: concentratedLiquidityPriceImpact({
      amountIn: options.request.amountIn,
      amountOut,
      tokenIn: options.request.edge.tokenIn,
      tokenOut: options.request.edge.tokenOut,
      token0: options.quote.token0,
      token1: options.quote.token1,
      preSwapSqrtPriceX96,
      postSwapSqrtPriceX96,
    }),
  };
}

export function createIndexedClQuoteAdapter(options: {
  quoteClient: FameIndexedClQuoteClient;
  fallback: FameQuoteAdapter | FameAsyncQuoteAdapter;
  currentBlock: number;
  maxFreshnessBlocks?: number;
  expectedSourceRegistryId?: string;
}): FameAsyncQuoteAdapter {
  const fallback = toAsyncQuoteAdapter(options.fallback);
  const cache = new Map<string, Promise<FameIndexedClQuoteBatchResponse>>();
  const pending = new Map<
    string,
    {
      request: FameEdgeQuoteRequest;
      resolve(response: FameIndexedClQuoteBatchResponse): void;
      reject(error: unknown): void;
    }
  >();
  let flushScheduled = false;

  function cacheKey(request: FameEdgeQuoteRequest): string {
    return [
      request.edge.poolId,
      request.edge.tokenIn.toLowerCase(),
      request.edge.tokenOut.toLowerCase(),
      request.amountIn.toString(),
      options.currentBlock.toString(),
    ].join(":");
  }

  function requestEntry(request: FameEdgeQuoteRequest) {
    return {
      poolId: request.edge.poolId,
      tokenIn: request.edge.tokenIn,
      tokenOut: request.edge.tokenOut,
      amountIn: request.amountIn.toString(),
    };
  }

  function flushPendingQuotes(): void {
    flushScheduled = false;
    const batch = [...pending.values()];
    pending.clear();
    if (batch.length === 0) return;

    options.quoteClient
      .fetchQuotes({
        currentBlock: options.currentBlock,
        maxFreshnessBlocks: options.maxFreshnessBlocks,
        quotes: batch.map((entry) => requestEntry(entry.request)),
      })
      .then(
        (response) => {
          for (const entry of batch) entry.resolve(response);
        },
        (error: unknown) => {
          for (const entry of batch) entry.reject(error);
        },
      );
  }

  function fetchIndexedQuote(
    request: FameEdgeQuoteRequest,
  ): Promise<FameIndexedClQuoteBatchResponse> {
    const key = cacheKey(request);
    const cached = cache.get(key);
    if (cached) return cached;

    const value = new Promise<FameIndexedClQuoteBatchResponse>((resolve, reject) => {
      pending.set(key, { request, resolve, reject });
    });
    cache.set(key, value);
    if (!flushScheduled) {
      flushScheduled = true;
      void Promise.resolve().then(flushPendingQuotes);
    }
    return value;
  }

  return {
    quoteContext: fallback.quoteContext,
    async quoteEdge(request) {
      if (!requestSupportedByIndexedClQuotes(request)) {
        return fallback.quoteEdge(request);
      }

      let response: FameIndexedClQuoteBatchResponse;
      try {
        response = await fetchIndexedQuote(request);
      } catch {
        return fallback.quoteEdge(request);
      }
      if (
        options.expectedSourceRegistryId &&
        response.sourceRegistryId !== options.expectedSourceRegistryId
      ) {
        return fallback.quoteEdge(request);
      }
      const quote = response.quotes.find(
        (entry): entry is FameIndexedClQuoteQuotedEntry =>
          entry.status === "quoted" && quoteMatchesRequest(entry, request),
      );
      if (!quote || quote.sourceRegistryId !== response.sourceRegistryId) {
        return fallback.quoteEdge(request);
      }

      const result = quoteResultFromIndexedClQuote({ response, quote, request });
      return result.status === "quoted" ? result : fallback.quoteEdge(request);
    },
  };
}

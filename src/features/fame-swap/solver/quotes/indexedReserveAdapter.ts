import type {
  FameAsyncQuoteAdapter,
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FameQuoteAdapter,
} from "./adapters";
import type { FameQuoteContext } from "./quoteContext";
import {
  quoteFromReserveReplay,
  type FameReserveReplayState,
} from "./snapshotAdapter";
import type {
  FameIndexedPoolStateBatchResponse,
  FameIndexedPoolStateEntry,
} from "./indexedPoolStateClient";

type FameIndexedReservePoolState = Extract<
  FameIndexedPoolStateEntry,
  { quoteModel: "constant-product-reserves" }
>;

function isAsyncQuoteAdapter(
  adapter: FameQuoteAdapter | FameAsyncQuoteAdapter,
): adapter is FameAsyncQuoteAdapter {
  return adapter.quoteEdge.constructor.name === "AsyncFunction";
}

function toAsyncQuoteAdapter(
  adapter: FameQuoteAdapter | FameAsyncQuoteAdapter,
): FameAsyncQuoteAdapter {
  if (isAsyncQuoteAdapter(adapter)) return adapter;
  return {
    quoteContext: adapter.quoteContext,
    async quoteEdge(request) {
      return adapter.quoteEdge(request);
    },
  };
}

function statusCounts(indexedState: FameIndexedPoolStateBatchResponse) {
  return indexedState.pools.reduce(
    (counts, pool) => ({
      ...counts,
      [pool.status]: counts[pool.status] + 1,
    }),
    {
      fresh: 0,
      stale: 0,
      unknown: 0,
      unsupported: 0,
    },
  );
}

function indexedContext(
  indexedState: FameIndexedPoolStateBatchResponse,
): FameQuoteContext {
  return {
    source: "indexed",
    chainId:
      indexedState.pools.find((pool) => "chainId" in pool)?.chainId ?? 8453,
    currentBlock: indexedState.currentBlock,
    sourceRegistryId: indexedState.sourceRegistryId,
    effectiveMaxFreshnessBlocks: indexedState.effectiveMaxFreshnessBlocks,
    statusCounts: statusCounts(indexedState),
  };
}

function sameAddress(left: `0x${string}`, right: `0x${string}`): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function isDecimalInteger(value: string): boolean {
  return /^[0-9]+$/.test(value);
}

function isIndexedReservePoolState(
  state: FameIndexedPoolStateEntry | undefined,
): state is FameIndexedReservePoolState {
  return (
    state !== undefined &&
    (state.status === "fresh" || state.status === "stale") &&
    "quoteModel" in state &&
    state.quoteModel === "constant-product-reserves"
  );
}

function isFreshIndexedReservePoolState(
  state: FameIndexedPoolStateEntry | undefined,
): state is FameIndexedReservePoolState & { status: "fresh" } {
  return isIndexedReservePoolState(state) && state.status === "fresh";
}

function freshReserveState(
  state: FameIndexedPoolStateEntry | undefined,
  request: FameEdgeQuoteRequest,
): FameReserveReplayState | null {
  if (!isFreshIndexedReservePoolState(state)) return null;
  if (
    "pool" in request.edge.pool &&
    !sameAddress(state.poolAddress, request.edge.pool.pool)
  ) {
    return null;
  }
  if (!isDecimalInteger(state.reserve0) || !isDecimalInteger(state.reserve1)) {
    return null;
  }

  const directDirection =
    sameAddress(request.edge.tokenIn, state.token0) &&
    sameAddress(request.edge.tokenOut, state.token1);
  const reverseDirection =
    sameAddress(request.edge.tokenIn, state.token1) &&
    sameAddress(request.edge.tokenOut, state.token0);
  if (!directDirection && !reverseDirection) return null;

  return {
    poolId: state.poolId,
    token0: state.token0,
    token1: state.token1,
    reserve0: state.reserve0,
    reserve1: state.reserve1,
  };
}

function sourceFor(state: FameIndexedReservePoolState & { status: "fresh" }) {
  return `indexed ${state.source} reserves for ${state.poolId} observed through block ${state.observedThroughBlock.toString()}`;
}

export function createIndexedReserveQuoteAdapter(options: {
  indexedState: FameIndexedPoolStateBatchResponse;
  fallback: FameQuoteAdapter | FameAsyncQuoteAdapter;
  expectedSourceRegistryId?: string;
}): FameAsyncQuoteAdapter {
  const fallback = toAsyncQuoteAdapter(options.fallback);
  if (
    options.expectedSourceRegistryId &&
    options.indexedState.sourceRegistryId !== options.expectedSourceRegistryId
  ) {
    return fallback;
  }

  const context = indexedContext(options.indexedState);
  const indexedByPoolId = new Map<string, FameIndexedPoolStateEntry>();
  for (const state of options.indexedState.pools) {
    if ("poolId" in state) {
      indexedByPoolId.set(state.poolId, state);
    }
  }

  async function fallbackQuote(
    request: FameEdgeQuoteRequest,
  ): Promise<FameEdgeQuoteResult> {
    return fallback.quoteEdge(request);
  }

  return {
    async quoteEdge(request) {
      const state = indexedByPoolId.get(request.edge.poolId);
      const reserve = freshReserveState(state, request);
      if (!reserve || !isFreshIndexedReservePoolState(state)) {
        return fallbackQuote(request);
      }

      let quote: FameEdgeQuoteResult;
      try {
        quote = quoteFromReserveReplay({
          request,
          reserve,
          context,
          source: sourceFor(state),
        });
      } catch {
        return fallbackQuote(request);
      }
      return quote.status === "quoted" ? quote : fallbackQuote(request);
    },
  };
}

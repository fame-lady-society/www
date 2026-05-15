import type {
  FameAsyncQuoteAdapter,
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FameQuoteAdapter,
} from "../quotes/adapters";
import type { FameLiveQuoteClient } from "../quotes/liveAdapters";
import {
  consumeLogicalQuoteRequest,
  consumeStateReadRequest,
  consumeUnderlyingRpcRead,
  consumeUniqueExactQuoteRead,
  consumeUniqueStateRead,
  FameOptimizerBudgetExceededError,
  quoteContextCacheKey,
} from "./runContext";
import type { FameOptimizerRunContext } from "./types";

function quoteKey(
  run: FameOptimizerRunContext,
  adapterId: string,
  request: FameEdgeQuoteRequest,
): string {
  const contextKey = quoteContextCacheKey(
    request.context ?? run.quoteContext,
  );
  return [
    contextKey,
    adapterId,
    request.edge.venue,
    request.edge.poolId,
    request.edge.tokenIn.toLowerCase(),
    request.edge.tokenOut.toLowerCase(),
    request.amountIn.toString(),
  ].join("|");
}

function stableValue(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${key}:${stableValue(entry)}`)
      .join(",")}}`;
  }
  return String(value);
}

function stateReadKey(
  run: FameOptimizerRunContext,
  request: Parameters<FameLiveQuoteClient["readContract"]>[0],
): string {
  return [
    run.quoteContextKey,
    request.address.toLowerCase(),
    request.functionName,
    request.blockNumber?.toString() ?? "latest",
    stableValue(request.args ?? []),
  ].join("|");
}

function budgetFailure(error: unknown): FameEdgeQuoteResult | null {
  if (!(error instanceof FameOptimizerBudgetExceededError)) return null;
  return {
    status: "failed",
    reason: "no_quote_evidence",
    message: error.message,
  };
}

function isAsyncQuoteAdapter(
  adapter: FameQuoteAdapter | FameAsyncQuoteAdapter,
): adapter is FameAsyncQuoteAdapter {
  return adapter.quoteEdge.constructor.name === "AsyncFunction";
}

export function toAsyncQuoteAdapter(
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

export function createOptimizerQuoteAdapter(options: {
  adapter: FameQuoteAdapter | FameAsyncQuoteAdapter;
  run: FameOptimizerRunContext;
  adapterId?: string;
}): FameAsyncQuoteAdapter {
  const adapter = toAsyncQuoteAdapter(options.adapter);
  const adapterId = options.adapterId ?? "quote-adapter";
  const cache = new Map<string, FameEdgeQuoteResult>();
  const inFlight = new Map<string, Promise<FameEdgeQuoteResult>>();

  return {
    quoteContext: adapter.quoteContext ?? options.run.quoteContext,
    async quoteEdge(request) {
      const key = quoteKey(options.run, adapterId, request);

      try {
        consumeLogicalQuoteRequest(options.run);
      } catch (error) {
        return budgetFailure(error) ?? {
          status: "failed",
          reason: "adapter_failure",
          message: "FAME optimizer quote budget failed.",
        };
      }

      const cached = cache.get(key);
      if (cached) {
        options.run.stats.exactQuoteCacheHits += 1;
        return cached;
      }

      const existing = inFlight.get(key);
      if (existing) {
        options.run.stats.inFlightExactQuoteCoalesces += 1;
        return existing;
      }

      try {
        consumeUniqueExactQuoteRead(options.run);
      } catch (error) {
        return budgetFailure(error) ?? {
          status: "failed",
          reason: "adapter_failure",
          message: "FAME optimizer quote budget failed.",
        };
      }

      const promise = Promise.resolve(adapter.quoteEdge(request))
        .then((result) => {
          cache.set(key, result);
          inFlight.delete(key);
          return result;
        })
        .catch((error) => {
          inFlight.delete(key);
          throw error;
        });
      inFlight.set(key, promise);
      return promise;
    },
  };
}

export function createCachedLiveQuoteClient(options: {
  client: FameLiveQuoteClient;
  run: FameOptimizerRunContext;
}): FameLiveQuoteClient {
  const cache = new Map<string, unknown>();
  const inFlight = new Map<string, Promise<unknown>>();

  return {
    getBlockNumber: options.client.getBlockNumber,
    readContract(request) {
      consumeStateReadRequest(options.run);
      const key = stateReadKey(options.run, request);
      if (cache.has(key)) {
        options.run.stats.stateReadCacheHits += 1;
        return Promise.resolve(cache.get(key));
      }

      const existing = inFlight.get(key);
      if (existing) {
        options.run.stats.inFlightStateReadCoalesces += 1;
        return existing;
      }

      consumeUniqueStateRead(options.run);
      consumeUnderlyingRpcRead(options.run);
      const promise = options.client
        .readContract(request)
        .then((result) => {
          cache.set(key, result);
          inFlight.delete(key);
          return result;
        })
        .catch((error) => {
          inFlight.delete(key);
          throw error;
        });
      inFlight.set(key, promise);
      return promise;
    },
  };
}

import { base } from "viem/chains";
import {
  CL_REPLAY_CAPABLE_FAME_POOL_IDS,
  QUOTE_MODEL_CAPABLE_FAME_POOL_IDS,
  famePoolSupportsCompactQuote,
} from "../poolStateRegistry";
import type {
  FameAsyncQuoteAdapter,
  FameEdgeQuoteRequest,
  FameEdgeQuoteResult,
  FameQuoteAdapter,
} from "./adapters";
import { concentratedLiquidityPriceImpact } from "./routeMath";
import type {
  FameClPoolQuoteQuotedEntry,
  FameConstantProductPoolQuoteQuotedEntry,
  FamePoolQuoteBatchResponse,
  FamePoolQuoteClient,
  FamePoolQuoteEntry,
  FamePoolQuoteQuotedEntry,
  FamePoolQuoteRequestEntry,
  FamePoolQuoteUnavailableEntry,
  FamePoolQuoteUnavailableReason,
} from "./indexedQuoteApiClient";

const MAX_UINT256 = 2n ** 256n - 1n;
const MAX_UINT256_DECIMAL_LENGTH = MAX_UINT256.toString().length;
const MAX_DIAGNOSTIC_DETAILS = 24;

export type FameQuoteApiFallbackReason =
  | "quote_api_batch_failed"
  | "source_registry_mismatch"
  | "row_not_found"
  | "unavailable_row"
  | "row_source_registry_mismatch"
  | "row_metadata_mismatch"
  | "row_kind_mismatch"
  | "row_amount_invalid"
  | "row_price_impact_invalid";

export type FameQuoteApiBatchFailureCategory =
  | "http_error"
  | "timeout"
  | "invalid_response"
  | "request_failed";

export interface FameQuoteApiEdgeDiagnostics {
  poolId: string;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: string;
  currentBlock: number;
  outcome: "attempted" | "used" | "fallback";
  quoteKind?: FamePoolQuoteQuotedEntry["quoteKind"];
  rowStatus?: FamePoolQuoteEntry["status"];
  unavailableReason?: FamePoolQuoteUnavailableReason;
  producerMaintenanceStatus?: FamePoolQuoteUnavailableEntry["producerStatus"];
  producerReason?: string | null;
  fallbackReason?: FameQuoteApiFallbackReason;
  batchFailureCategory?: FameQuoteApiBatchFailureCategory;
  observedThroughBlock?: number;
  evidenceId?: string;
}

export interface FameQuoteApiDiagnosticsSnapshot {
  configured: boolean;
  attempted: boolean;
  currentBlock?: number;
  edgeCount: number;
  usedCount: number;
  fallbackCount: number;
  batchFailureCount: number;
  timing: {
    batchRequestCount: number;
    totalBatchDurationMs: number;
    maxBatchDurationMs: number;
    lastBatchDurationMs?: number;
  };
  statusCounts: {
    quoted: number;
    unavailable: number;
  };
  unavailableReasonCounts: Partial<
    Record<FamePoolQuoteUnavailableReason, number>
  >;
  fallbackReasonCounts: Partial<Record<FameQuoteApiFallbackReason, number>>;
  details: FameQuoteApiEdgeDiagnostics[];
  truncatedDetailCount: number;
}

export interface FameQuoteApiDiagnosticsRecorder {
  recordBatchRequest(options: { durationMs: number }): void;
  recordAttempt(request: FameEdgeQuoteRequest, currentBlock: number): void;
  recordUsed(options: {
    request: FameEdgeQuoteRequest;
    currentBlock: number;
    quote: FamePoolQuoteQuotedEntry;
    evidenceId: string;
  }): void;
  recordFallback(options: {
    request: FameEdgeQuoteRequest;
    currentBlock: number;
    reason: FameQuoteApiFallbackReason;
    row?: FamePoolQuoteEntry;
    batchFailureCategory?: FameQuoteApiBatchFailureCategory;
  }): void;
  snapshot(): FameQuoteApiDiagnosticsSnapshot;
}

function toAsyncQuoteAdapter(
  adapter: FameQuoteAdapter | FameAsyncQuoteAdapter,
): FameAsyncQuoteAdapter {
  return {
    quoteContext: adapter.quoteContext,
    async quoteEdge(request) {
      return await adapter.quoteEdge(request);
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

function parseUint256Decimal(value: string): bigint | null {
  if (value.length > MAX_UINT256_DECIMAL_LENGTH) return null;
  if (!/^(0|[1-9][0-9]*)$/.test(value)) return null;
  const parsed = BigInt(value);
  return parsed <= MAX_UINT256 ? parsed : null;
}

function increment<K extends string>(
  counts: Partial<Record<K, number>>,
  key: K,
): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function edgeDiagnosticsBase(
  request: FameEdgeQuoteRequest,
  currentBlock: number,
): Pick<
  FameQuoteApiEdgeDiagnostics,
  "poolId" | "tokenIn" | "tokenOut" | "amountIn" | "currentBlock"
> {
  return {
    poolId: request.edge.poolId,
    tokenIn: request.edge.tokenIn,
    tokenOut: request.edge.tokenOut,
    amountIn: request.amountIn.toString(),
    currentBlock,
  };
}

export function createQuoteApiDiagnosticsRecorder(
  configured: boolean,
): FameQuoteApiDiagnosticsRecorder {
  let attempted = false;
  let currentBlock: number | undefined;
  let edgeCount = 0;
  let usedCount = 0;
  let fallbackCount = 0;
  let batchFailureCount = 0;
  let batchRequestCount = 0;
  let totalBatchDurationMs = 0;
  let maxBatchDurationMs = 0;
  let lastBatchDurationMs: number | undefined;
  let truncatedDetailCount = 0;
  const statusCounts = {
    quoted: 0,
    unavailable: 0,
  };
  const fallbackReasonCounts: Partial<
    Record<FameQuoteApiFallbackReason, number>
  > = {};
  const unavailableReasonCounts: Partial<
    Record<FamePoolQuoteUnavailableReason, number>
  > = {};
  const details: FameQuoteApiEdgeDiagnostics[] = [];

  function pushDetail(detail: FameQuoteApiEdgeDiagnostics): void {
    if (details.length < MAX_DIAGNOSTIC_DETAILS) {
      details.push(detail);
    } else {
      truncatedDetailCount += 1;
    }
  }

  return {
    recordBatchRequest({ durationMs }) {
      const safeDurationMs =
        Number.isFinite(durationMs) && durationMs > 0
          ? Math.round(durationMs)
          : 0;
      batchRequestCount += 1;
      totalBatchDurationMs += safeDurationMs;
      maxBatchDurationMs = Math.max(maxBatchDurationMs, safeDurationMs);
      lastBatchDurationMs = safeDurationMs;
    },
    recordAttempt(request, block) {
      attempted = true;
      currentBlock = block;
      edgeCount += 1;
      pushDetail({
        ...edgeDiagnosticsBase(request, block),
        outcome: "attempted",
      });
    },
    recordUsed({ request, currentBlock: block, quote, evidenceId }) {
      currentBlock = block;
      usedCount += 1;
      statusCounts.quoted += 1;
      pushDetail({
        ...edgeDiagnosticsBase(request, block),
        outcome: "used",
        rowStatus: "quoted",
        quoteKind: quote.quoteKind,
        observedThroughBlock: quote.observedThroughBlock,
        evidenceId,
      });
    },
    recordFallback({
      request,
      currentBlock: block,
      reason,
      row,
      batchFailureCategory,
    }) {
      currentBlock = block;
      fallbackCount += 1;
      if (reason === "quote_api_batch_failed") batchFailureCount += 1;
      increment(fallbackReasonCounts, reason);
      if (row?.status === "quoted") statusCounts.quoted += 1;
      if (row?.status === "unavailable") {
        statusCounts.unavailable += 1;
        increment(unavailableReasonCounts, row.reason);
      }
      pushDetail({
        ...edgeDiagnosticsBase(request, block),
        outcome: "fallback",
        rowStatus: row?.status,
        quoteKind: row?.status === "quoted" ? row.quoteKind : undefined,
        unavailableReason:
          row?.status === "unavailable" ? row.reason : undefined,
        producerMaintenanceStatus:
          row?.status === "unavailable" ? row.producerStatus : undefined,
        producerReason:
          row?.status === "unavailable" ? row.producerReason : undefined,
        fallbackReason: reason,
        batchFailureCategory,
        observedThroughBlock:
          row && "observedThroughBlock" in row
            ? row.observedThroughBlock
            : undefined,
      });
    },
    snapshot() {
      return {
        configured,
        attempted,
        ...(currentBlock === undefined ? {} : { currentBlock }),
        edgeCount,
        usedCount,
        fallbackCount,
        batchFailureCount,
        timing: {
          batchRequestCount,
          totalBatchDurationMs,
          maxBatchDurationMs,
          ...(lastBatchDurationMs === undefined ? {} : { lastBatchDurationMs }),
        },
        statusCounts,
        unavailableReasonCounts,
        fallbackReasonCounts,
        details,
        truncatedDetailCount,
      };
    },
  };
}

function emptyPoolStateStatusCounts(): {
  fresh: number;
  stale: number;
  unknown: number;
  unsupported: number;
} {
  return {
    fresh: 0,
    stale: 0,
    unknown: 0,
    unsupported: 0,
  };
}

function isClQuoteCapablePool(poolId: string): boolean {
  return CL_REPLAY_CAPABLE_FAME_POOL_IDS.some((id) => id === poolId);
}

function isReserveQuoteCapablePool(poolId: string): boolean {
  return QUOTE_MODEL_CAPABLE_FAME_POOL_IDS.some((id) => id === poolId);
}

function requestSupportedByQuoteApi(request: FameEdgeQuoteRequest): boolean {
  if (!famePoolSupportsCompactQuote(request.edge.poolId)) return false;
  if (isClQuoteCapablePool(request.edge.poolId)) {
    return (
      request.edge.pool.venue === "aerodrome-slipstream" &&
      "pool" in request.edge.pool
    );
  }
  if (isReserveQuoteCapablePool(request.edge.poolId)) {
    return (
      request.edge.fee.status === "available" &&
      (request.edge.pool.venue === "uniswap-v2" ||
        (request.edge.pool.venue === "solidly" &&
          request.edge.pool.stable === false) ||
        (request.edge.pool.venue === "aerodrome-v2" &&
          request.edge.pool.stable === false)) &&
      "pool" in request.edge.pool
    );
  }
  return false;
}

function entryMatchesRequestIdentity(
  entry: FamePoolQuoteEntry,
  request: FameEdgeQuoteRequest,
): boolean {
  const requested: FamePoolQuoteRequestEntry =
    entry.status === "unavailable"
      ? entry.requested
      : {
          poolId: entry.poolId,
          tokenIn: entry.tokenIn,
          tokenOut: entry.tokenOut,
          amountIn: entry.amountIn,
        };
  return (
    requested.poolId === request.edge.poolId &&
    sameAddress(requested.tokenIn, request.edge.tokenIn) &&
    sameAddress(requested.tokenOut, request.edge.tokenOut) &&
    requested.amountIn === request.amountIn.toString()
  );
}

function quotedBaseMatchesRequest(
  quote: FamePoolQuoteQuotedEntry,
  request: FameEdgeQuoteRequest,
): boolean {
  const pool = request.edge.pool;
  return (
    quote.poolId === request.edge.poolId &&
    quote.chainId === base.id &&
    "pool" in pool &&
    sameAddress(quote.poolAddress, pool.pool) &&
    sameAddress(quote.token0, pool.token0) &&
    sameAddress(quote.token1, pool.token1) &&
    sameAddress(quote.tokenIn, request.edge.tokenIn) &&
    sameAddress(quote.tokenOut, request.edge.tokenOut) &&
    quote.venueFamily === request.edge.venue &&
    quote.amountIn === request.amountIn.toString()
  );
}

function clQuoteValidationFailure(
  quote: FameClPoolQuoteQuotedEntry,
  request: FameEdgeQuoteRequest,
): FameQuoteApiFallbackReason | null {
  if (!isClQuoteCapablePool(request.edge.poolId)) return "row_kind_mismatch";
  const pool = request.edge.pool;
  if (
    !quotedBaseMatchesRequest(quote, request) ||
    pool.venue !== "aerodrome-slipstream" ||
    !("pool" in pool) ||
    quote.tickSpacing !== pool.tickSpacing ||
    quote.feeSource !== "pool-fee"
  ) {
    return "row_metadata_mismatch";
  }
  return null;
}

function reserveQuoteValidationFailure(
  quote: FameConstantProductPoolQuoteQuotedEntry,
  request: FameEdgeQuoteRequest,
): FameQuoteApiFallbackReason | null {
  if (!isReserveQuoteCapablePool(request.edge.poolId))
    return "row_kind_mismatch";
  if (
    !quotedBaseMatchesRequest(quote, request) ||
    quote.quoteModelVersion !== 1 ||
    quote.quoteModel !== "constant-product-reserves" ||
    quote.feeSource !== "registry-fee" ||
    quote.source !== "reserve-pool-state" ||
    request.edge.fee.status !== "available" ||
    quote.feeBps !== request.edge.fee.feeBps
  ) {
    return "row_metadata_mismatch";
  }
  return null;
}

function quotedValidationFailure(
  response: FamePoolQuoteBatchResponse,
  quote: FamePoolQuoteQuotedEntry,
  request: FameEdgeQuoteRequest,
): FameQuoteApiFallbackReason | null {
  if (quote.sourceRegistryId !== response.sourceRegistryId) {
    return "row_source_registry_mismatch";
  }
  if (quote.quoteKind === "cl-quote-v1") {
    return clQuoteValidationFailure(quote, request);
  }
  return reserveQuoteValidationFailure(quote, request);
}

function quoteResultFromClQuote(options: {
  response: FamePoolQuoteBatchResponse;
  quote: FameClPoolQuoteQuotedEntry;
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
      message: "Indexed quote API CL row was not usable.",
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
      effectiveMaxFreshnessBlocks: options.response.effectiveMaxFreshnessBlocks,
      statusCounts: emptyPoolStateStatusCounts(),
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
    indexedEvidence: {
      source: "indexed",
      kind: "compact-quote",
      quoteKind: options.quote.quoteKind,
      evidenceId: options.quote.snapshotId,
      poolId: options.quote.poolId,
    },
  };
}

function quoteResultFromReserveQuote(options: {
  response: FamePoolQuoteBatchResponse;
  quote: FameConstantProductPoolQuoteQuotedEntry;
  request: FameEdgeQuoteRequest;
}): FameEdgeQuoteResult {
  const amountOut = parsePositiveUint256Decimal(options.quote.amountOut);
  const preSwapPriceX18 = parseUint256Decimal(
    options.quote.priceImpact.preSwapPriceX18,
  );
  const postSwapPriceX18 = parseUint256Decimal(
    options.quote.priceImpact.postSwapPriceX18,
  );
  const executionPriceX18 = parseUint256Decimal(
    options.quote.priceImpact.executionPriceX18,
  );
  if (
    amountOut === null ||
    preSwapPriceX18 === null ||
    postSwapPriceX18 === null ||
    executionPriceX18 === null
  ) {
    return {
      status: "failed",
      reason: "no_quote_evidence",
      message: "Indexed quote API reserve row was not usable.",
    };
  }

  return {
    status: "quoted",
    amountIn: options.request.amountIn,
    amountOut,
    capacityIn: null,
    fee: options.request.edge.fee,
    evidence: `indexed reserve quote for ${options.quote.poolId} observed through block ${options.quote.observedThroughBlock.toString()}`,
    context: {
      source: "indexed",
      chainId: options.quote.chainId,
      currentBlock: options.response.currentBlock,
      sourceRegistryId: options.response.sourceRegistryId,
      effectiveMaxFreshnessBlocks: options.response.effectiveMaxFreshnessBlocks,
      statusCounts: emptyPoolStateStatusCounts(),
    },
    priceImpact: {
      preSwapPriceX18,
      postSwapPriceX18,
      executionPriceX18,
      marketImpactBps: options.quote.priceImpact.marketImpactBps,
      method: "constant-product-reserves",
    },
    protocolEvidence: options.quote.protocolEvidence,
    indexedEvidence: {
      source: "indexed",
      kind: "compact-quote",
      quoteKind: options.quote.quoteKind,
      evidenceId: quoteEvidenceId(options.quote),
      poolId: options.quote.poolId,
    },
  };
}

function quoteResultFromQuoteApiRow(options: {
  response: FamePoolQuoteBatchResponse;
  quote: FamePoolQuoteQuotedEntry;
  request: FameEdgeQuoteRequest;
}): FameEdgeQuoteResult {
  if (options.quote.quoteKind === "cl-quote-v1") {
    return quoteResultFromClQuote({
      response: options.response,
      quote: options.quote,
      request: options.request,
    });
  }
  return quoteResultFromReserveQuote({
    response: options.response,
    quote: options.quote,
    request: options.request,
  });
}

function quoteEvidenceId(quote: FamePoolQuoteQuotedEntry): string {
  if (quote.quoteKind === "cl-quote-v1") return quote.snapshotId;
  return `${quote.poolId}:${quote.observedThroughBlock.toString()}`;
}

function batchFailureCategory(
  error: unknown,
): FameQuoteApiBatchFailureCategory {
  const message = error instanceof Error ? error.message : String(error);
  if (
    (error instanceof Error && error.name === "AbortError") ||
    /timeout|timed out|aborted/i.test(message)
  ) {
    return "timeout";
  }
  if (/status\s+\d{3}/i.test(message)) return "http_error";
  if (/response invalid|invalid at|invalid response/i.test(message)) {
    return "invalid_response";
  }
  return "request_failed";
}

export function createIndexedQuoteApiAdapter(options: {
  quoteClient: FamePoolQuoteClient;
  fallback: FameQuoteAdapter | FameAsyncQuoteAdapter;
  currentBlock: number;
  maxFreshnessBlocks?: number;
  expectedSourceRegistryId?: string;
  diagnostics?: FameQuoteApiDiagnosticsRecorder;
  onBatchFailure?: (event: {
    category: FameQuoteApiBatchFailureCategory;
    currentBlock: number;
  }) => void;
}): FameAsyncQuoteAdapter {
  const fallback = toAsyncQuoteAdapter(options.fallback);
  const cache = new Map<string, Promise<FamePoolQuoteBatchResponse>>();
  const pending = new Map<
    string,
    {
      request: FameEdgeQuoteRequest;
      resolve(response: FamePoolQuoteBatchResponse): void;
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

  function requestEntry(
    request: FameEdgeQuoteRequest,
  ): FamePoolQuoteRequestEntry {
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

    const batchStartedAtMs = Date.now();
    options.quoteClient
      .fetchQuotes({
        currentBlock: options.currentBlock,
        maxFreshnessBlocks: options.maxFreshnessBlocks,
        quotes: batch.map((entry) => requestEntry(entry.request)),
      })
      .then(
        (response) => {
          options.diagnostics?.recordBatchRequest({
            durationMs: Date.now() - batchStartedAtMs,
          });
          for (const entry of batch) entry.resolve(response);
        },
        (error: unknown) => {
          options.diagnostics?.recordBatchRequest({
            durationMs: Date.now() - batchStartedAtMs,
          });
          options.onBatchFailure?.({
            category: batchFailureCategory(error),
            currentBlock: options.currentBlock,
          });
          for (const entry of batch) entry.reject(error);
        },
      );
  }

  function fetchQuoteApiResponse(
    request: FameEdgeQuoteRequest,
  ): Promise<FamePoolQuoteBatchResponse> {
    const key = cacheKey(request);
    const cached = cache.get(key);
    if (cached) return cached;

    const value = new Promise<FamePoolQuoteBatchResponse>((resolve, reject) => {
      pending.set(key, { request, resolve, reject });
    });
    cache.set(key, value);
    if (!flushScheduled) {
      flushScheduled = true;
      void Promise.resolve().then(flushPendingQuotes);
    }
    return value;
  }

  async function fallbackQuote(optionsForFallback: {
    request: FameEdgeQuoteRequest;
    reason: FameQuoteApiFallbackReason;
    row?: FamePoolQuoteEntry;
    batchFailureCategory?: FameQuoteApiBatchFailureCategory;
  }): Promise<FameEdgeQuoteResult> {
    options.diagnostics?.recordFallback({
      request: optionsForFallback.request,
      currentBlock: options.currentBlock,
      reason: optionsForFallback.reason,
      row: optionsForFallback.row,
      batchFailureCategory: optionsForFallback.batchFailureCategory,
    });
    return fallback.quoteEdge(optionsForFallback.request);
  }

  return {
    quoteContext: fallback.quoteContext,
    async quoteEdge(request) {
      if (!requestSupportedByQuoteApi(request)) {
        return fallback.quoteEdge(request);
      }

      options.diagnostics?.recordAttempt(request, options.currentBlock);

      let response: FamePoolQuoteBatchResponse;
      try {
        response = await fetchQuoteApiResponse(request);
      } catch (error) {
        const category = batchFailureCategory(error);
        return fallbackQuote({
          request,
          reason: "quote_api_batch_failed",
          batchFailureCategory: category,
        });
      }
      if (
        options.expectedSourceRegistryId &&
        response.sourceRegistryId !== options.expectedSourceRegistryId
      ) {
        return fallbackQuote({
          request,
          reason: "source_registry_mismatch",
        });
      }

      const row = response.quotes.find((entry) =>
        entryMatchesRequestIdentity(entry, request),
      );
      if (!row) {
        return fallbackQuote({ request, reason: "row_not_found" });
      }
      if (row.status === "unavailable") {
        return fallbackQuote({
          request,
          reason: "unavailable_row",
          row,
        });
      }

      const validationFailure = quotedValidationFailure(response, row, request);
      if (validationFailure) {
        return fallbackQuote({
          request,
          reason: validationFailure,
          row,
        });
      }

      const result = quoteResultFromQuoteApiRow({
        response,
        quote: row,
        request,
      });
      if (result.status !== "quoted") {
        return fallbackQuote({
          request,
          reason:
            row.quoteKind === "constant-product-quote-v1"
              ? "row_price_impact_invalid"
              : "row_amount_invalid",
          row,
        });
      }

      options.diagnostics?.recordUsed({
        request,
        currentBlock: options.currentBlock,
        quote: row,
        evidenceId: quoteEvidenceId(row),
      });
      return result;
    },
  };
}

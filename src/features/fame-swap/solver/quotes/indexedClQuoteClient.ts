import { isAddress, isHex, type Address, type Hex } from "viem";

export interface FameIndexedClQuoteRequestEntry {
  poolId: string;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
}

export interface FameIndexedClQuoteBatchRequest {
  currentBlock: number;
  maxFreshnessBlocks?: number;
  quotes: readonly FameIndexedClQuoteRequestEntry[];
}

export type FameIndexedClQuoteUnavailableReason =
  | "missing-registry-entry"
  | "unsupported-pool"
  | "missing-indexed-state"
  | "stale-indexed-state"
  | "source-registry-mismatch"
  | "token-direction-mismatch"
  | "malformed-replay-state"
  | "outside-indexed-tick-range"
  | "replay-failed";

export interface FameIndexedClQuoteUnavailableEntry {
  status: "unavailable";
  requested: FameIndexedClQuoteRequestEntry;
  reason: FameIndexedClQuoteUnavailableReason;
  poolId?: string;
  chainId?: number;
  poolAddress?: Address | null;
  observedThroughBlock?: number;
  sourceRegistryId?: string;
  maxFreshnessBlocks?: number;
}

export interface FameIndexedClQuoteQuotedEntry {
  status: "quoted";
  quoteKind: "cl-quote-v1";
  poolId: string;
  chainId: number;
  poolAddress: Address;
  token0: Address;
  token1: Address;
  tokenIn: Address;
  tokenOut: Address;
  venueFamily: string;
  tickSpacing: number;
  amountIn: string;
  amountOut: string;
  sqrtPriceX96: string;
  sqrtPriceX96After: string;
  tick: number;
  liquidity: string;
  fee: string;
  feeSource: "pool-fee";
  observedThroughBlock: number;
  blockHash: Hex;
  parentHash: Hex;
  snapshotId: string;
  stateHash: Hex;
  source: "slipstream-pool-state";
  sourceRegistryId: string;
  maxFreshnessBlocks: number;
}

export type FameIndexedClQuoteEntry =
  | FameIndexedClQuoteQuotedEntry
  | FameIndexedClQuoteUnavailableEntry;

export interface FameIndexedClQuoteBatchResponse {
  sourceRegistryId: string;
  currentBlock: number;
  producerMaxFreshnessBlocks: number;
  effectiveMaxFreshnessBlocks: number;
  quotes: FameIndexedClQuoteEntry[];
}

export interface FameIndexedClQuoteClient {
  fetchQuotes(
    request: FameIndexedClQuoteBatchRequest,
  ): Promise<FameIndexedClQuoteBatchResponse>;
}

export interface CreateIndexedClQuoteClientOptions {
  endpointUrl: string;
  serviceToken: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`FAME indexed CL quote response invalid at ${path}.`);
  }
  return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`FAME indexed CL quote response invalid at ${key}.`);
  }
  return value;
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`FAME indexed CL quote response invalid at ${key}.`);
  }
  return value;
}

function safeIntegerField(record: Record<string, unknown>, key: string): number {
  const value = numberField(record, key);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`FAME indexed CL quote response invalid at ${key}.`);
  }
  return value;
}

function decimalStringField(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = stringField(record, key);
  if (!/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(`FAME indexed CL quote response invalid at ${key}.`);
  }
  return value;
}

function bytes32HexField(record: Record<string, unknown>, key: string): Hex {
  const value = stringField(record, key);
  if (!/^0x[0-9a-fA-F]{64}$/.test(value) || !isHex(value, { strict: true })) {
    throw new Error(`FAME indexed CL quote response invalid at ${key}.`);
  }
  return value as Hex;
}

function addressField(record: Record<string, unknown>, key: string): Address {
  const value = stringField(record, key);
  if (!isAddress(value, { strict: false })) {
    throw new Error(`FAME indexed CL quote response invalid at ${key}.`);
  }
  return value as Address;
}

function optionalAddressField(
  record: Record<string, unknown>,
  key: string,
): Address | null | undefined {
  if (record[key] === undefined) return undefined;
  if (record[key] === null) return null;
  return addressField(record, key);
}

function parseRequestEntry(
  value: unknown,
  path: string,
): FameIndexedClQuoteRequestEntry {
  const record = asRecord(value, path);
  return {
    poolId: stringField(record, "poolId"),
    tokenIn: addressField(record, "tokenIn"),
    tokenOut: addressField(record, "tokenOut"),
    amountIn: decimalStringField(record, "amountIn"),
  };
}

function parseUnavailableReason(
  record: Record<string, unknown>,
): FameIndexedClQuoteUnavailableReason {
  const reason = stringField(record, "reason");
  if (
    reason !== "missing-registry-entry" &&
    reason !== "unsupported-pool" &&
    reason !== "missing-indexed-state" &&
    reason !== "stale-indexed-state" &&
    reason !== "source-registry-mismatch" &&
    reason !== "token-direction-mismatch" &&
    reason !== "malformed-replay-state" &&
    reason !== "outside-indexed-tick-range" &&
    reason !== "replay-failed"
  ) {
    throw new Error("FAME indexed CL quote response invalid at reason.");
  }
  return reason;
}

function parseQuotedEntry(
  record: Record<string, unknown>,
): FameIndexedClQuoteQuotedEntry {
  const quoteKind = stringField(record, "quoteKind");
  if (quoteKind !== "cl-quote-v1") {
    throw new Error("FAME indexed CL quote response invalid at quoteKind.");
  }
  const feeSource = stringField(record, "feeSource");
  if (feeSource !== "pool-fee") {
    throw new Error("FAME indexed CL quote response invalid at feeSource.");
  }
  const source = stringField(record, "source");
  if (source !== "slipstream-pool-state") {
    throw new Error("FAME indexed CL quote response invalid at source.");
  }
  const tickSpacing = safeIntegerField(record, "tickSpacing");
  if (tickSpacing <= 0) {
    throw new Error("FAME indexed CL quote response invalid at tickSpacing.");
  }

  return {
    status: "quoted",
    quoteKind,
    poolId: stringField(record, "poolId"),
    chainId: safeIntegerField(record, "chainId"),
    poolAddress: addressField(record, "poolAddress"),
    token0: addressField(record, "token0"),
    token1: addressField(record, "token1"),
    tokenIn: addressField(record, "tokenIn"),
    tokenOut: addressField(record, "tokenOut"),
    venueFamily: stringField(record, "venueFamily"),
    tickSpacing,
    amountIn: decimalStringField(record, "amountIn"),
    amountOut: decimalStringField(record, "amountOut"),
    sqrtPriceX96: decimalStringField(record, "sqrtPriceX96"),
    sqrtPriceX96After: decimalStringField(record, "sqrtPriceX96After"),
    tick: safeIntegerField(record, "tick"),
    liquidity: decimalStringField(record, "liquidity"),
    fee: decimalStringField(record, "fee"),
    feeSource,
    observedThroughBlock: safeIntegerField(record, "observedThroughBlock"),
    blockHash: bytes32HexField(record, "blockHash"),
    parentHash: bytes32HexField(record, "parentHash"),
    snapshotId: stringField(record, "snapshotId"),
    stateHash: bytes32HexField(record, "stateHash"),
    source,
    sourceRegistryId: stringField(record, "sourceRegistryId"),
    maxFreshnessBlocks: safeIntegerField(record, "maxFreshnessBlocks"),
  };
}

function parseUnavailableEntry(
  record: Record<string, unknown>,
  path: string,
): FameIndexedClQuoteUnavailableEntry {
  return {
    status: "unavailable",
    requested: parseRequestEntry(record.requested, `${path}.requested`),
    reason: parseUnavailableReason(record),
    ...(record.poolId === undefined ? {} : { poolId: stringField(record, "poolId") }),
    ...(record.chainId === undefined
      ? {}
      : { chainId: safeIntegerField(record, "chainId") }),
    ...(record.poolAddress === undefined
      ? {}
      : { poolAddress: optionalAddressField(record, "poolAddress") }),
    ...(record.observedThroughBlock === undefined
      ? {}
      : {
          observedThroughBlock: safeIntegerField(
            record,
            "observedThroughBlock",
          ),
        }),
    ...(record.sourceRegistryId === undefined
      ? {}
      : { sourceRegistryId: stringField(record, "sourceRegistryId") }),
    ...(record.maxFreshnessBlocks === undefined
      ? {}
      : {
          maxFreshnessBlocks: safeIntegerField(record, "maxFreshnessBlocks"),
        }),
  };
}

function parseEntry(value: unknown, path: string): FameIndexedClQuoteEntry {
  const record = asRecord(value, path);
  const status = stringField(record, "status");
  if (status === "quoted") return parseQuotedEntry(record);
  if (status === "unavailable") return parseUnavailableEntry(record, path);
  throw new Error("FAME indexed CL quote response status is invalid.");
}

export function parseIndexedClQuoteResponse(
  value: unknown,
): FameIndexedClQuoteBatchResponse {
  const record = asRecord(value, "$");
  const quotes = record.quotes;
  if (!Array.isArray(quotes)) {
    throw new Error("FAME indexed CL quote response invalid at quotes.");
  }
  return {
    sourceRegistryId: stringField(record, "sourceRegistryId"),
    currentBlock: safeIntegerField(record, "currentBlock"),
    producerMaxFreshnessBlocks: safeIntegerField(
      record,
      "producerMaxFreshnessBlocks",
    ),
    effectiveMaxFreshnessBlocks: safeIntegerField(
      record,
      "effectiveMaxFreshnessBlocks",
    ),
    quotes: quotes.map((quote, index) =>
      parseEntry(quote, `$.quotes[${index.toString()}]`),
    ),
  };
}

function validateFreshness(
  response: FameIndexedClQuoteBatchResponse,
  request: { currentBlock: number },
): void {
  if (response.currentBlock !== request.currentBlock) {
    throw new Error("FAME indexed CL quote response invalid at currentBlock.");
  }
  for (const quote of response.quotes) {
    if (quote.status !== "quoted") continue;
    if (quote.observedThroughBlock > response.currentBlock) {
      throw new Error(
        "FAME indexed CL quote response invalid at observedThroughBlock.",
      );
    }
    const effectiveFreshness = Math.min(
      quote.maxFreshnessBlocks,
      response.effectiveMaxFreshnessBlocks,
    );
    if (response.currentBlock - quote.observedThroughBlock > effectiveFreshness) {
      throw new Error(
        "FAME indexed CL quote response invalid at maxFreshnessBlocks.",
      );
    }
  }
}

export function createIndexedClQuoteClient(
  options: CreateIndexedClQuoteClientOptions,
): FameIndexedClQuoteClient {
  const timeoutMs = options.timeoutMs ?? 750;
  const fetchFn = options.fetchFn ?? fetch;

  return {
    async fetchQuotes(request) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchFn(options.endpointUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${options.serviceToken}`,
          },
          body: JSON.stringify({
            currentBlock: request.currentBlock,
            maxFreshnessBlocks: request.maxFreshnessBlocks,
            quotes: request.quotes,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            `FAME indexed CL quote request failed with status ${response.status.toString()}.`,
          );
        }
        const parsed = parseIndexedClQuoteResponse(
          (await response.json()) as unknown,
        );
        validateFreshness(parsed, request);
        return parsed;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

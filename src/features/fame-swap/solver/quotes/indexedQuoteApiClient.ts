import { isAddress, isHex, type Address, type Hex } from "viem";
import type {
  FameProtocolEvidence,
  FameProtocolEvidenceItem,
  FameProtocolEvidenceStatus,
} from "./adapters";

export interface FamePoolQuoteRequestEntry {
  poolId: string;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
}

export interface FamePoolQuoteBatchRequest {
  currentBlock: number;
  maxFreshnessBlocks?: number;
  quotes: readonly FamePoolQuoteRequestEntry[];
}

export type FamePoolQuoteUnavailableReason =
  | "missing-registry-entry"
  | "unsupported-pool"
  | "missing-indexed-state"
  | "stale-indexed-state"
  | "source-registry-mismatch"
  | "token-direction-mismatch"
  | "malformed-reserve-state"
  | "reserve-quote-failed"
  | "malformed-replay-state"
  | "outside-indexed-tick-range"
  | "replay-failed"
  | "missing-provenance"
  | "v4-shape-mismatch"
  | "fee-model-mismatch"
  | "producer-untrusted";

export type FamePoolQuoteProducerStatus =
  | "trusted"
  | "warming"
  | "drift-failed"
  | "repairing"
  | "event-gap";

export interface FamePoolQuoteUnavailableEntry {
  status: "unavailable";
  requested: FamePoolQuoteRequestEntry;
  reason: FamePoolQuoteUnavailableReason;
  poolId?: string;
  chainId?: number;
  poolAddress?: Address | null;
  poolKey?: Hex | null;
  stateViewAddress?: Address | null;
  observedThroughBlock?: number;
  sourceRegistryId?: string;
  maxFreshnessBlocks?: number;
  producerStatus?: FamePoolQuoteProducerStatus;
  producerReason?: string | null;
}

interface FamePoolQuoteQuotedEntryBase {
  status: "quoted";
  poolId: string;
  chainId: number;
  token0: Address;
  token1: Address;
  tokenIn: Address;
  tokenOut: Address;
  venueFamily: string;
  amountIn: string;
  amountOut: string;
  observedThroughBlock: number;
  sourceRegistryId: string;
  maxFreshnessBlocks: number;
}

interface FameAddressBackedPoolQuoteQuotedEntryBase
  extends FamePoolQuoteQuotedEntryBase {
  poolAddress: Address;
}

export interface FameClPoolQuoteQuotedEntry
  extends FameAddressBackedPoolQuoteQuotedEntryBase {
  quoteKind: "cl-quote-v1";
  tickSpacing: number;
  sqrtPriceX96: string;
  sqrtPriceX96After: string;
  tick: number;
  liquidity: string;
  fee: string;
  feeSource: "pool-fee";
  blockHash: Hex;
  parentHash: Hex;
  snapshotId: string;
  stateHash: Hex;
  source: "slipstream-pool-state";
}

export interface FameV4ZoraVerifiedProvenance {
  status: "verified";
  source: "zora-factory-event" | "zora-factory-transaction-trace";
  chainId: 8453;
  factoryAddress: Address;
  coinAddress: Address;
  poolKey: Hex;
  poolId: Hex;
  transactionHash: Hex;
  eventName: string | null;
}

export interface FameV4ReviewedPoolEvidence {
  status: "verified";
  source: "reviewed-v4-manifest";
  kind: "zero-hook-static-fee" | "zora-protocol-pool";
  manifestVersion: number;
  poolId: string;
  poolKey: Hex;
  staticFee: string;
  hookAddress: Address;
  hookData: Hex;
  protocolFeeStatus: "zero";
}

export interface FameV4ClPoolQuoteQuotedEntry
  extends FamePoolQuoteQuotedEntryBase {
  quoteKind: "cl-quote-v1";
  poolAddress: null;
  poolKey: Hex;
  poolManager: Address;
  stateViewAddress: Address;
  venueFamily: "UniswapV4";
  tickSpacing: number;
  sqrtPriceX96: string;
  sqrtPriceX96After: string;
  tick: number;
  liquidity: string;
  fee: string;
  lpFee: string;
  protocolFee: string;
  protocolFeeStatus: "zero";
  staticFee: string;
  feeSource: "v4-slot0";
  blockHash: Hex;
  parentHash: Hex;
  snapshotId: string;
  stateHash: Hex;
  source: "uniswap-v4-state-view";
  hookAddress: Address;
  hookData: Hex;
  hookDataStatus: "empty";
  reviewedPoolEvidence: FameV4ReviewedPoolEvidence;
  zoraProvenance?: FameV4ZoraVerifiedProvenance;
}

export interface FameConstantProductQuotePriceImpact {
  preSwapPriceX18: string;
  postSwapPriceX18: string;
  executionPriceX18: string;
  marketImpactBps: number | null;
  method: "constant-product-reserves";
}

export interface FameConstantProductPoolQuoteQuotedEntry
  extends FameAddressBackedPoolQuoteQuotedEntryBase {
  quoteKind: "constant-product-quote-v1";
  quoteModel: "constant-product-reserves";
  quoteModelVersion: 1;
  feeBps: number;
  feeSource: "registry-fee";
  source: "reserve-pool-state";
  stateSource: "sync-event" | "getReserves";
  priceImpact: FameConstantProductQuotePriceImpact;
  protocolEvidence: FameProtocolEvidence;
}

export type FamePoolQuoteQuotedEntry =
  | FameClPoolQuoteQuotedEntry
  | FameV4ClPoolQuoteQuotedEntry
  | FameConstantProductPoolQuoteQuotedEntry;

export type FamePoolQuoteEntry =
  | FamePoolQuoteQuotedEntry
  | FamePoolQuoteUnavailableEntry;

export interface FamePoolQuoteBatchResponse {
  sourceRegistryId: string;
  currentBlock: number;
  producerMaxFreshnessBlocks: number;
  effectiveMaxFreshnessBlocks: number;
  quotes: FamePoolQuoteEntry[];
}

export interface FamePoolQuoteClient {
  fetchQuotes(
    request: FamePoolQuoteBatchRequest,
  ): Promise<FamePoolQuoteBatchResponse>;
}

export interface CreateIndexedQuoteApiClientOptions {
  endpointUrl: string;
  serviceToken: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

function responseError(path: string): Error {
  return new Error(`FAME pool quote response invalid at ${path}.`);
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw responseError(path);
  }
  return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw responseError(key);
  }
  return value;
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw responseError(key);
  }
  return value;
}

function safeIntegerField(
  record: Record<string, unknown>,
  key: string,
): number {
  const value = numberField(record, key);
  if (!Number.isSafeInteger(value)) {
    throw responseError(key);
  }
  return value;
}

function decimalStringField(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = stringField(record, key);
  if (!/^(0|[1-9][0-9]*)$/.test(value)) {
    throw responseError(key);
  }
  return value;
}

function bytes32HexField(record: Record<string, unknown>, key: string): Hex {
  const value = stringField(record, key);
  if (!/^0x[0-9a-fA-F]{64}$/.test(value) || !isHex(value, { strict: true })) {
    throw responseError(key);
  }
  return value as Hex;
}

function hexField(record: Record<string, unknown>, key: string): Hex {
  const value = stringField(record, key);
  if (!isHex(value, { strict: true })) {
    throw responseError(key);
  }
  return value as Hex;
}

function addressField(record: Record<string, unknown>, key: string): Address {
  const value = stringField(record, key);
  if (!isAddress(value, { strict: false })) {
    throw responseError(key);
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

function optionalBytes32HexField(
  record: Record<string, unknown>,
  key: string,
): Hex | null | undefined {
  if (record[key] === undefined) return undefined;
  if (record[key] === null) return null;
  return bytes32HexField(record, key);
}

function literalStringField<T extends string>(
  record: Record<string, unknown>,
  key: string,
  expected: T,
): T {
  const value = stringField(record, key);
  if (value !== expected) throw responseError(key);
  return expected;
}

function parseRequestEntry(
  value: unknown,
  path: string,
): FamePoolQuoteRequestEntry {
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
): FamePoolQuoteUnavailableReason {
  const reason = stringField(record, "reason");
  if (
    reason !== "missing-registry-entry" &&
    reason !== "unsupported-pool" &&
    reason !== "missing-indexed-state" &&
    reason !== "stale-indexed-state" &&
    reason !== "source-registry-mismatch" &&
    reason !== "token-direction-mismatch" &&
    reason !== "malformed-reserve-state" &&
    reason !== "reserve-quote-failed" &&
    reason !== "malformed-replay-state" &&
    reason !== "outside-indexed-tick-range" &&
    reason !== "replay-failed" &&
    reason !== "missing-provenance" &&
    reason !== "v4-shape-mismatch" &&
    reason !== "fee-model-mismatch" &&
    reason !== "producer-untrusted"
  ) {
    throw responseError("reason");
  }
  return reason;
}

function parseProducerStatus(
  record: Record<string, unknown>,
): FamePoolQuoteProducerStatus {
  const status = stringField(record, "producerStatus");
  if (
    status !== "trusted" &&
    status !== "warming" &&
    status !== "drift-failed" &&
    status !== "repairing" &&
    status !== "event-gap"
  ) {
    throw responseError("producerStatus");
  }
  return status;
}

function optionalNullableStringField(
  record: Record<string, unknown>,
  key: string,
): string | null {
  if (record[key] === null) return null;
  return stringField(record, key);
}

function parseQuotedBase(
  record: Record<string, unknown>,
): FamePoolQuoteQuotedEntryBase {
  return {
    status: "quoted",
    poolId: stringField(record, "poolId"),
    chainId: safeIntegerField(record, "chainId"),
    token0: addressField(record, "token0"),
    token1: addressField(record, "token1"),
    tokenIn: addressField(record, "tokenIn"),
    tokenOut: addressField(record, "tokenOut"),
    venueFamily: stringField(record, "venueFamily"),
    amountIn: decimalStringField(record, "amountIn"),
    amountOut: decimalStringField(record, "amountOut"),
    observedThroughBlock: safeIntegerField(record, "observedThroughBlock"),
    sourceRegistryId: stringField(record, "sourceRegistryId"),
    maxFreshnessBlocks: safeIntegerField(record, "maxFreshnessBlocks"),
  };
}

function parseAddressBackedQuotedBase(
  record: Record<string, unknown>,
): FameAddressBackedPoolQuoteQuotedEntryBase {
  return {
    ...parseQuotedBase(record),
    poolAddress: addressField(record, "poolAddress"),
  };
}

function parseClQuotedEntry(
  record: Record<string, unknown>,
): FameClPoolQuoteQuotedEntry {
  const tickSpacing = safeIntegerField(record, "tickSpacing");
  if (tickSpacing <= 0) throw responseError("tickSpacing");

  return {
    ...parseAddressBackedQuotedBase(record),
    quoteKind: "cl-quote-v1",
    tickSpacing,
    sqrtPriceX96: decimalStringField(record, "sqrtPriceX96"),
    sqrtPriceX96After: decimalStringField(record, "sqrtPriceX96After"),
    tick: safeIntegerField(record, "tick"),
    liquidity: decimalStringField(record, "liquidity"),
    fee: decimalStringField(record, "fee"),
    feeSource: literalStringField(record, "feeSource", "pool-fee"),
    blockHash: bytes32HexField(record, "blockHash"),
    parentHash: bytes32HexField(record, "parentHash"),
    snapshotId: stringField(record, "snapshotId"),
    stateHash: bytes32HexField(record, "stateHash"),
    source: literalStringField(record, "source", "slipstream-pool-state"),
  };
}

function parseNullableString(
  value: unknown,
  path: string,
): string | null {
  if (value === null) return null;
  if (typeof value === "string" && value.length > 0) return value;
  throw responseError(path);
}

function parseV4ZoraProvenance(
  value: unknown,
): FameV4ZoraVerifiedProvenance {
  const record = asRecord(value, "zoraProvenance");
  const source = stringField(record, "source");
  if (
    source !== "zora-factory-event" &&
    source !== "zora-factory-transaction-trace"
  ) {
    throw responseError("zoraProvenance.source");
  }
  const chainId = safeIntegerField(record, "chainId");
  if (chainId !== 8453) throw responseError("zoraProvenance.chainId");
  return {
    status: literalStringField(record, "status", "verified"),
    source,
    chainId,
    factoryAddress: addressField(record, "factoryAddress"),
    coinAddress: addressField(record, "coinAddress"),
    poolKey: bytes32HexField(record, "poolKey"),
    poolId: bytes32HexField(record, "poolId"),
    transactionHash: bytes32HexField(record, "transactionHash"),
    eventName: parseNullableString(record.eventName, "zoraProvenance.eventName"),
  };
}

function parseOptionalV4ZoraProvenance(
  value: unknown,
): FameV4ZoraVerifiedProvenance | undefined {
  if (value === undefined) return undefined;
  return parseV4ZoraProvenance(value);
}

function parseV4ReviewedPoolEvidence(
  value: unknown,
): FameV4ReviewedPoolEvidence {
  const record = asRecord(value, "reviewedPoolEvidence");
  const kind = stringField(record, "kind");
  if (kind !== "zero-hook-static-fee" && kind !== "zora-protocol-pool") {
    throw responseError("reviewedPoolEvidence.kind");
  }
  return {
    status: literalStringField(record, "status", "verified"),
    source: literalStringField(
      record,
      "source",
      "reviewed-v4-manifest",
    ),
    kind,
    manifestVersion: safeIntegerField(record, "manifestVersion"),
    poolId: stringField(record, "poolId"),
    poolKey: bytes32HexField(record, "poolKey"),
    staticFee: decimalStringField(record, "staticFee"),
    hookAddress: addressField(record, "hookAddress"),
    hookData: hexField(record, "hookData"),
    protocolFeeStatus: literalStringField(
      record,
      "protocolFeeStatus",
      "zero",
    ),
  };
}

function parseV4ClQuotedEntry(
  record: Record<string, unknown>,
): FameV4ClPoolQuoteQuotedEntry {
  if (record.poolAddress !== null) throw responseError("poolAddress");

  const fee = decimalStringField(record, "fee");
  const lpFee = decimalStringField(record, "lpFee");
  const protocolFee = decimalStringField(record, "protocolFee");
  const staticFee = decimalStringField(record, "staticFee");
  const tickSpacing = safeIntegerField(record, "tickSpacing");
  const hookData = hexField(record, "hookData");
  if (fee !== lpFee) throw responseError("fee");
  if (staticFee !== fee) throw responseError("staticFee");
  if (protocolFee !== "0") throw responseError("protocolFee");
  if (tickSpacing <= 0) throw responseError("tickSpacing");
  if (hookData.toLowerCase() !== "0x") throw responseError("hookData");

  return {
    ...parseQuotedBase(record),
    quoteKind: "cl-quote-v1",
    poolAddress: null,
    poolKey: bytes32HexField(record, "poolKey"),
    poolManager: addressField(record, "poolManager"),
    stateViewAddress: addressField(record, "stateViewAddress"),
    venueFamily: literalStringField(record, "venueFamily", "UniswapV4"),
    tickSpacing,
    sqrtPriceX96: decimalStringField(record, "sqrtPriceX96"),
    sqrtPriceX96After: decimalStringField(record, "sqrtPriceX96After"),
    tick: safeIntegerField(record, "tick"),
    liquidity: decimalStringField(record, "liquidity"),
    fee,
    lpFee,
    protocolFee,
    protocolFeeStatus: literalStringField(
      record,
      "protocolFeeStatus",
      "zero",
    ),
    staticFee,
    feeSource: literalStringField(record, "feeSource", "v4-slot0"),
    blockHash: bytes32HexField(record, "blockHash"),
    parentHash: bytes32HexField(record, "parentHash"),
    snapshotId: stringField(record, "snapshotId"),
    stateHash: bytes32HexField(record, "stateHash"),
    source: literalStringField(record, "source", "uniswap-v4-state-view"),
    hookAddress: addressField(record, "hookAddress"),
    hookData,
    hookDataStatus: literalStringField(record, "hookDataStatus", "empty"),
    reviewedPoolEvidence: parseV4ReviewedPoolEvidence(
      record.reviewedPoolEvidence,
    ),
    zoraProvenance: parseOptionalV4ZoraProvenance(record.zoraProvenance),
  };
}

function parseQuoteModelVersion(record: Record<string, unknown>): 1 {
  const version = safeIntegerField(record, "quoteModelVersion");
  if (version !== 1) throw responseError("quoteModelVersion");
  return 1;
}

function parseFeeBps(record: Record<string, unknown>): number {
  const feeBps = safeIntegerField(record, "feeBps");
  if (feeBps < 0 || feeBps >= 10_000) throw responseError("feeBps");
  return feeBps;
}

function parseMarketImpactBps(record: Record<string, unknown>): number | null {
  const value = record.marketImpactBps;
  if (value === null) return null;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isSafeInteger(value)
  ) {
    throw responseError("marketImpactBps");
  }
  return value;
}

function parsePriceImpact(
  value: unknown,
  path: string,
): FameConstantProductQuotePriceImpact {
  const record = asRecord(value, path);
  return {
    preSwapPriceX18: decimalStringField(record, "preSwapPriceX18"),
    postSwapPriceX18: decimalStringField(record, "postSwapPriceX18"),
    executionPriceX18: decimalStringField(record, "executionPriceX18"),
    marketImpactBps: parseMarketImpactBps(record),
    method: literalStringField(record, "method", "constant-product-reserves"),
  };
}

function parseProtocolEvidenceStatus(
  record: Record<string, unknown>,
  path: string,
): FameProtocolEvidenceStatus {
  const status = stringField(record, "status");
  if (
    status !== "available" &&
    status !== "unavailable" &&
    status !== "not_applicable" &&
    status !== "disabled"
  ) {
    throw responseError(`${path}.status`);
  }
  return status;
}

function parseProtocolEvidenceItem(
  value: unknown,
  path: string,
): FameProtocolEvidenceItem {
  const record = asRecord(value, path);
  const rawValue = record.value;
  const rawReason = record.reason;
  if (rawValue !== undefined && typeof rawValue !== "string") {
    throw responseError(`${path}.value`);
  }
  if (rawReason !== undefined && typeof rawReason !== "string") {
    throw responseError(`${path}.reason`);
  }

  return {
    status: parseProtocolEvidenceStatus(record, path),
    source: stringField(record, "source"),
    ...(rawValue === undefined ? {} : { value: rawValue }),
    ...(rawReason === undefined ? {} : { reason: rawReason }),
  };
}

function parseProtocolEvidence(value: unknown): FameProtocolEvidence {
  const record = asRecord(value, "protocolEvidence");
  return {
    quote: parseProtocolEvidenceItem(record.quote, "protocolEvidence.quote"),
    prePrice: parseProtocolEvidenceItem(
      record.prePrice,
      "protocolEvidence.prePrice",
    ),
    postPrice: parseProtocolEvidenceItem(
      record.postPrice,
      "protocolEvidence.postPrice",
    ),
    marketImpact: parseProtocolEvidenceItem(
      record.marketImpact,
      "protocolEvidence.marketImpact",
    ),
    activeLiquidity: parseProtocolEvidenceItem(
      record.activeLiquidity,
      "protocolEvidence.activeLiquidity",
    ),
  };
}

function parseStateSource(
  record: Record<string, unknown>,
): "sync-event" | "getReserves" {
  const stateSource = stringField(record, "stateSource");
  if (stateSource !== "sync-event" && stateSource !== "getReserves") {
    throw responseError("stateSource");
  }
  return stateSource;
}

function parseConstantProductQuotedEntry(
  record: Record<string, unknown>,
): FameConstantProductPoolQuoteQuotedEntry {
  return {
    ...parseAddressBackedQuotedBase(record),
    quoteKind: "constant-product-quote-v1",
    quoteModel: literalStringField(
      record,
      "quoteModel",
      "constant-product-reserves",
    ),
    quoteModelVersion: parseQuoteModelVersion(record),
    feeBps: parseFeeBps(record),
    feeSource: literalStringField(record, "feeSource", "registry-fee"),
    source: literalStringField(record, "source", "reserve-pool-state"),
    stateSource: parseStateSource(record),
    priceImpact: parsePriceImpact(record.priceImpact, "priceImpact"),
    protocolEvidence: parseProtocolEvidence(record.protocolEvidence),
  };
}

function parseQuotedEntry(
  record: Record<string, unknown>,
): FamePoolQuoteQuotedEntry {
  const quoteKind = stringField(record, "quoteKind");
  if (quoteKind === "cl-quote-v1") {
    const source = stringField(record, "source");
    if (source === "slipstream-pool-state") return parseClQuotedEntry(record);
    if (source === "uniswap-v4-state-view") return parseV4ClQuotedEntry(record);
    throw responseError("source");
  }
  if (quoteKind === "constant-product-quote-v1") {
    return parseConstantProductQuotedEntry(record);
  }
  throw responseError("quoteKind");
}

function parseUnavailableEntry(
  record: Record<string, unknown>,
  path: string,
): FamePoolQuoteUnavailableEntry {
  return {
    status: "unavailable",
    requested: parseRequestEntry(record.requested, `${path}.requested`),
    reason: parseUnavailableReason(record),
    ...(record.poolId === undefined
      ? {}
      : { poolId: stringField(record, "poolId") }),
    ...(record.chainId === undefined
      ? {}
      : { chainId: safeIntegerField(record, "chainId") }),
    ...(record.poolAddress === undefined
      ? {}
      : { poolAddress: optionalAddressField(record, "poolAddress") }),
    ...(record.poolKey === undefined
      ? {}
      : { poolKey: optionalBytes32HexField(record, "poolKey") }),
    ...(record.stateViewAddress === undefined
      ? {}
      : { stateViewAddress: optionalAddressField(record, "stateViewAddress") }),
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
    ...(record.producerStatus === undefined
      ? {}
      : { producerStatus: parseProducerStatus(record) }),
    ...(record.producerReason === undefined
      ? {}
      : { producerReason: optionalNullableStringField(record, "producerReason") }),
  };
}

function parseEntry(value: unknown, path: string): FamePoolQuoteEntry {
  const record = asRecord(value, path);
  const status = stringField(record, "status");
  if (status === "quoted") return parseQuotedEntry(record);
  if (status === "unavailable") return parseUnavailableEntry(record, path);
  throw responseError(`${path}.status`);
}

export function parseIndexedQuoteApiResponse(
  value: unknown,
): FamePoolQuoteBatchResponse {
  const record = asRecord(value, "$");
  const quotes = record.quotes;
  if (!Array.isArray(quotes)) {
    throw responseError("quotes");
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
  response: FamePoolQuoteBatchResponse,
  request: FamePoolQuoteBatchRequest,
): void {
  if (response.currentBlock !== request.currentBlock) {
    throw responseError("currentBlock");
  }
  if (
    request.maxFreshnessBlocks !== undefined &&
    response.effectiveMaxFreshnessBlocks > request.maxFreshnessBlocks
  ) {
    throw responseError("effectiveMaxFreshnessBlocks");
  }
}

export function createIndexedQuoteApiClient(
  options: CreateIndexedQuoteApiClientOptions,
): FamePoolQuoteClient {
  const timeoutMs = options.timeoutMs ?? 2_500;
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
            `FAME pool quote request failed with status ${response.status.toString()}.`,
          );
        }
        const parsed = parseIndexedQuoteApiResponse(
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

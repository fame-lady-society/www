import { isAddress, isHex, type Address, type Hex } from "viem";

export type FameIndexedPoolStateStatus =
  | "fresh"
  | "stale"
  | "unknown"
  | "unsupported";

interface FameIndexedPoolStateObservedFields {
  observedThroughBlock: number;
  maxFreshnessBlocks: number;
}

interface FameIndexedReservePoolStateEntry
  extends FameIndexedPoolStateObservedFields {
  status: "fresh" | "stale";
  poolId: string;
  chainId: number;
  poolAddress: Address;
  token0: Address;
  token1: Address;
  reserve0: string;
  reserve1: string;
  k: string;
  lastReserveChangeBlock: number;
  source: "sync-event" | "getReserves";
  quoteModel: "constant-product-reserves";
}

interface FameIndexedClReplayBaseEntry
  extends FameIndexedPoolStateObservedFields {
  status: "fresh" | "stale";
  stateKind: "cl-replay-v1";
  poolId: string;
  chainId: number;
  poolAddress: Address;
  token0: Address;
  token1: Address;
  venueFamily: string;
  tickSpacing: number;
  sqrtPriceX96: string;
  tick: number;
  liquidity: string;
  fee: string;
  feeSource: "pool-fee";
  blockHash: Hex;
  parentHash: Hex;
  snapshotId: string;
  stateHash: Hex;
  source: "slipstream-pool-state";
  sourceRegistryId: string;
  bitmapWordCount: number;
  initializedTickCount: number;
  bitmapChunkCount: number;
  tickChunkCount: number;
  minWordPosition: number | null;
  maxWordPosition: number | null;
  minTick: number | null;
  maxTick: number | null;
}

export interface FameIndexedClReplayFreshEntry
  extends FameIndexedClReplayBaseEntry {
  status: "fresh";
  bitmapWords: {
    wordPosition: number;
    bitmap: Hex;
  }[];
  initializedTicks: {
    tick: number;
    liquidityGross: string;
    liquidityNet: string;
  }[];
}

export interface FameIndexedClReplayStaleEntry
  extends FameIndexedClReplayBaseEntry {
  status: "stale";
}

export type FameIndexedPoolStateEntry =
  | FameIndexedReservePoolStateEntry
  | FameIndexedClReplayFreshEntry
  | FameIndexedClReplayStaleEntry
  | {
      status: "unsupported";
      poolId: string;
      chainId: number;
      poolAddress: Address | null;
      unsupportedReason: string;
    }
  | {
      status: "unknown";
      requested: {
        poolId?: string;
        chainId?: number;
        poolAddress?: Address;
      };
      reason: string;
    };

export interface FameIndexedPoolStateBatchResponse {
  sourceRegistryId: string;
  currentBlock: number;
  producerMaxFreshnessBlocks: number;
  effectiveMaxFreshnessBlocks: number;
  pools: FameIndexedPoolStateEntry[];
}

export interface FameIndexedPoolStateClient {
  fetchPoolStates(options: {
    currentBlock: number;
    poolIds: readonly string[];
    maxFreshnessBlocks?: number;
    stateSurfaces?: readonly ("cl-head-snapshot" | "cl-replay-v1")[];
  }): Promise<FameIndexedPoolStateBatchResponse>;
}

export interface CreateIndexedPoolStateClientOptions {
  endpointUrl: string;
  serviceToken: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`FAME indexed pool-state response invalid at ${path}.`);
  }
  return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value;
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value;
}

function safeIntegerField(record: Record<string, unknown>, key: string): number {
  const value = numberField(record, key);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value;
}

function nullableNumberField(
  record: Record<string, unknown>,
  key: string,
): number | null {
  if (record[key] === null) return null;
  return numberField(record, key);
}

function decimalStringField(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = stringField(record, key);
  if (!/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value;
}

function signedDecimalStringField(
  record: Record<string, unknown>,
  key: string,
): string {
  const value = stringField(record, key);
  if (!/^-?(0|[1-9][0-9]*)$/.test(value) || value === "-0") {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value;
}

function hexField(record: Record<string, unknown>, key: string): Hex {
  const value = stringField(record, key);
  if (!isHex(value, { strict: true })) {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value;
}

function addressField(record: Record<string, unknown>, key: string): Address {
  const value = stringField(record, key);
  if (!isAddress(value, { strict: false })) {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value as Address;
}

function nullableAddressField(
  record: Record<string, unknown>,
  key: string,
): Address | null {
  return record[key] === null ? null : addressField(record, key);
}

function parseBitmapWord(value: unknown, path: string): {
  wordPosition: number;
  bitmap: Hex;
} {
  const record = asRecord(value, path);
  const bitmap = hexField(record, "bitmap");
  if (!/^0x[0-9a-f]{64}$/.test(bitmap)) {
    throw new Error(`FAME indexed pool-state response invalid at ${path}.bitmap.`);
  }
  return {
    wordPosition: safeIntegerField(record, "wordPosition"),
    bitmap,
  };
}

function parseInitializedTick(value: unknown, path: string): {
  tick: number;
  liquidityGross: string;
  liquidityNet: string;
} {
  const record = asRecord(value, path);
  return {
    tick: safeIntegerField(record, "tick"),
    liquidityGross: decimalStringField(record, "liquidityGross"),
    liquidityNet: signedDecimalStringField(record, "liquidityNet"),
  };
}

function parseArray<T>(
  value: unknown,
  path: string,
  parser: (item: unknown, itemPath: string) => T,
): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`FAME indexed pool-state response invalid at ${path}.`);
  }
  return value.map((item, index) => parser(item, `${path}[${index}]`));
}

function parseRequestKey(value: unknown, path: string): {
  poolId?: string;
  chainId?: number;
  poolAddress?: Address;
} {
  const record = asRecord(value, path);
  if (typeof record.poolId === "string") {
    return { poolId: record.poolId };
  }
  return {
    ...(typeof record.chainId === "number"
      ? { chainId: record.chainId }
      : {}),
    ...(typeof record.poolAddress === "string" &&
    isAddress(record.poolAddress, { strict: false })
      ? { poolAddress: record.poolAddress as Address }
      : {}),
  };
}

function parseClReplayBaseEntry(
  record: Record<string, unknown>,
  status: "fresh" | "stale",
): FameIndexedClReplayBaseEntry {
  const feeSource = stringField(record, "feeSource");
  if (feeSource !== "pool-fee") {
    throw new Error("FAME indexed pool-state response invalid at feeSource.");
  }
  const source = stringField(record, "source");
  if (source !== "slipstream-pool-state") {
    throw new Error("FAME indexed pool-state response invalid at source.");
  }
  const tickSpacing = safeIntegerField(record, "tickSpacing");
  if (tickSpacing <= 0) {
    throw new Error("FAME indexed pool-state response invalid at tickSpacing.");
  }

  return {
    status,
    stateKind: "cl-replay-v1",
    poolId: stringField(record, "poolId"),
    chainId: safeIntegerField(record, "chainId"),
    poolAddress: addressField(record, "poolAddress"),
    token0: addressField(record, "token0"),
    token1: addressField(record, "token1"),
    venueFamily: stringField(record, "venueFamily"),
    tickSpacing,
    sqrtPriceX96: decimalStringField(record, "sqrtPriceX96"),
    tick: safeIntegerField(record, "tick"),
    liquidity: decimalStringField(record, "liquidity"),
    fee: decimalStringField(record, "fee"),
    feeSource,
    observedThroughBlock: safeIntegerField(record, "observedThroughBlock"),
    blockHash: hexField(record, "blockHash"),
    parentHash: hexField(record, "parentHash"),
    snapshotId: stringField(record, "snapshotId"),
    stateHash: hexField(record, "stateHash"),
    source,
    sourceRegistryId: stringField(record, "sourceRegistryId"),
    maxFreshnessBlocks: safeIntegerField(record, "maxFreshnessBlocks"),
    bitmapWordCount: safeIntegerField(record, "bitmapWordCount"),
    initializedTickCount: safeIntegerField(record, "initializedTickCount"),
    bitmapChunkCount: safeIntegerField(record, "bitmapChunkCount"),
    tickChunkCount: safeIntegerField(record, "tickChunkCount"),
    minWordPosition: nullableNumberField(record, "minWordPosition"),
    maxWordPosition: nullableNumberField(record, "maxWordPosition"),
    minTick: nullableNumberField(record, "minTick"),
    maxTick: nullableNumberField(record, "maxTick"),
  };
}

function bitmapWordPosition(tick: number, tickSpacing: number): number {
  return Math.floor(tick / tickSpacing / 256);
}

function bitmapBitPosition(tick: number, tickSpacing: number): number {
  const compressed = tick / tickSpacing;
  return ((compressed % 256) + 256) % 256;
}

function validateClReplayFreshEntry(
  entry: FameIndexedClReplayFreshEntry,
): void {
  if (entry.bitmapWords.length !== entry.bitmapWordCount) {
    throw new Error("FAME indexed pool-state response invalid at bitmapWords.");
  }
  if (entry.initializedTicks.length !== entry.initializedTickCount) {
    throw new Error(
      "FAME indexed pool-state response invalid at initializedTicks.",
    );
  }

  const ticks = entry.initializedTicks.map((tick) => tick.tick);
  if (new Set(ticks).size !== ticks.length) {
    throw new Error(
      "FAME indexed pool-state response invalid at initializedTicks.",
    );
  }
  if (ticks.length === 0) {
    if (
      entry.minTick !== null ||
      entry.maxTick !== null ||
      entry.minWordPosition !== null ||
      entry.maxWordPosition !== null
    ) {
      throw new Error(
        "FAME indexed pool-state response invalid at initialized tick bounds.",
      );
    }
    return;
  }

  const minTick = Math.min(...ticks);
  const maxTick = Math.max(...ticks);
  if (entry.minTick !== minTick || entry.maxTick !== maxTick) {
    throw new Error(
      "FAME indexed pool-state response invalid at initialized tick bounds.",
    );
  }

  const bitmapByWord = new Map(
    entry.bitmapWords.map((word) => [word.wordPosition, BigInt(word.bitmap)]),
  );
  const wordPositions = ticks.map((tick) =>
    bitmapWordPosition(tick, entry.tickSpacing),
  );
  if (
    entry.minWordPosition !== Math.min(...wordPositions) ||
    entry.maxWordPosition !== Math.max(...wordPositions)
  ) {
    throw new Error(
      "FAME indexed pool-state response invalid at bitmap word bounds.",
    );
  }

  for (const tick of ticks) {
    if (tick % entry.tickSpacing !== 0) {
      throw new Error(
        "FAME indexed pool-state response invalid at initializedTicks.",
      );
    }
    const wordPosition = bitmapWordPosition(tick, entry.tickSpacing);
    const bitPosition = bitmapBitPosition(tick, entry.tickSpacing);
    const bitmap = bitmapByWord.get(wordPosition);
    if (!bitmap || (bitmap & (1n << BigInt(bitPosition))) === 0n) {
      throw new Error(
        "FAME indexed pool-state response invalid at initialized tick bitmap.",
      );
    }
  }
}

function parseEntry(value: unknown, path: string): FameIndexedPoolStateEntry {
  const record = asRecord(value, path);
  const status = stringField(record, "status");
  if (status === "fresh" || status === "stale") {
    const stateKind = record.stateKind;
    if (stateKind === "cl-replay-v1") {
      const baseEntry = parseClReplayBaseEntry(record, status);
      if (status === "stale") {
        return {
          ...baseEntry,
          status,
        } satisfies FameIndexedClReplayStaleEntry;
      }

      const entry = {
        ...baseEntry,
        status,
        bitmapWords: parseArray(
          record.bitmapWords,
          `${path}.bitmapWords`,
          parseBitmapWord,
        ),
        initializedTicks: parseArray(
          record.initializedTicks,
          `${path}.initializedTicks`,
          parseInitializedTick,
        ),
      } satisfies FameIndexedClReplayFreshEntry;
      validateClReplayFreshEntry(entry);
      return entry;
    }
    const source = stringField(record, "source");
    if (source !== "sync-event" && source !== "getReserves") {
      throw new Error("FAME indexed pool-state response invalid at source.");
    }
    const quoteModel = stringField(record, "quoteModel");
    if (quoteModel !== "constant-product-reserves") {
      throw new Error("FAME indexed pool-state response invalid at quoteModel.");
    }
    return {
      status,
      poolId: stringField(record, "poolId"),
      chainId: safeIntegerField(record, "chainId"),
      poolAddress: addressField(record, "poolAddress"),
      token0: addressField(record, "token0"),
      token1: addressField(record, "token1"),
      reserve0: stringField(record, "reserve0"),
      reserve1: stringField(record, "reserve1"),
      k: stringField(record, "k"),
      observedThroughBlock: safeIntegerField(record, "observedThroughBlock"),
      lastReserveChangeBlock: safeIntegerField(record, "lastReserveChangeBlock"),
      source,
      quoteModel,
      maxFreshnessBlocks: safeIntegerField(record, "maxFreshnessBlocks"),
    };
  }
  if (status === "unsupported") {
    return {
      status,
      poolId: stringField(record, "poolId"),
      chainId: safeIntegerField(record, "chainId"),
      poolAddress: nullableAddressField(record, "poolAddress"),
      unsupportedReason: stringField(record, "unsupportedReason"),
    };
  }
  if (status === "unknown") {
    return {
      status,
      requested: parseRequestKey(record.requested, `${path}.requested`),
      reason: stringField(record, "reason"),
    };
  }
  throw new Error("FAME indexed pool-state response status is invalid.");
}

export function parseIndexedPoolStateResponse(
  value: unknown,
): FameIndexedPoolStateBatchResponse {
  const record = asRecord(value, "$");
  const pools = record.pools;
  if (!Array.isArray(pools)) {
    throw new Error("FAME indexed pool-state response invalid at pools.");
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
    pools: pools.map((pool, index) => parseEntry(pool, `$.pools[${index}]`)),
  };
}

function validateFreshness(
  response: FameIndexedPoolStateBatchResponse,
  request: { currentBlock: number },
): void {
  if (response.currentBlock !== request.currentBlock) {
    throw new Error("FAME indexed pool-state response invalid at currentBlock.");
  }

  for (const pool of response.pools) {
    if (pool.status !== "fresh" && pool.status !== "stale") continue;
    if (pool.observedThroughBlock > response.currentBlock) {
      throw new Error(
        "FAME indexed pool-state response invalid at observedThroughBlock.",
      );
    }
    const effectiveFreshness = Math.min(
      pool.maxFreshnessBlocks,
      response.effectiveMaxFreshnessBlocks,
    );
    if (
      pool.status === "fresh" &&
      response.currentBlock - pool.observedThroughBlock > effectiveFreshness
    ) {
      throw new Error(
        "FAME indexed pool-state response invalid at maxFreshnessBlocks.",
      );
    }
  }
}

export function createIndexedPoolStateClient(
  options: CreateIndexedPoolStateClientOptions,
): FameIndexedPoolStateClient {
  const timeoutMs = options.timeoutMs ?? 750;
  const fetchFn = options.fetchFn ?? fetch;

  return {
    async fetchPoolStates(request) {
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
            stateSurfaces: request.stateSurfaces,
            pools: request.poolIds.map((poolId) => ({ poolId })),
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            `FAME indexed pool-state request failed with status ${response.status.toString()}.`,
          );
        }
        const parsed = parseIndexedPoolStateResponse(
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

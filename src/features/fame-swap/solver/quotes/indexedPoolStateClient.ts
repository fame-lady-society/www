import { isAddress, isHex, type Address, type Hex } from "viem";

export type FameIndexedPoolStateStatus =
  | "fresh"
  | "stale"
  | "unknown"
  | "unsupported";
export type FameIndexedPoolStateRequestSurface = "cl-head-snapshot";
export type FameIndexedPoolStateVenueFamily =
  | "AerodromeV2"
  | "NativeWrap"
  | "Slipstream"
  | "Slipstream2"
  | "Solidly"
  | "UniswapV2"
  | "UniswapV3"
  | "UniswapV4";

export type FameIndexedPoolStateEntry =
  | {
      status: "fresh" | "stale";
      poolId: string;
      chainId: number;
      poolAddress: Address;
      token0: Address;
      token1: Address;
      reserve0: string;
      reserve1: string;
      k: string;
      observedThroughBlock: number;
      lastReserveChangeBlock: number;
      source: "sync-event" | "getReserves";
      quoteModel: "constant-product-reserves";
      maxFreshnessBlocks: number;
    }
  | {
      status: "fresh" | "stale";
      stateKind: "cl-head-snapshot";
      poolId: string;
      chainId: number;
      poolAddress: Address | null;
      poolKey: Hex | null;
      token0: Address;
      token1: Address;
      venueFamily: FameIndexedPoolStateVenueFamily;
      feeBps: number;
      feeLabel: string;
      tickSpacing: number;
      stateViewAddress: Address | null;
      sqrtPriceX96: string;
      tick: number;
      liquidity: string;
      observedThroughBlock: number;
      source: "pool-slot0-liquidity" | "v4-state-view";
      sourceRegistryId: string;
      maxFreshnessBlocks: number;
    }
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
    stateSurfaces?: readonly FameIndexedPoolStateRequestSurface[];
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

function integerField(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value;
}

function nonNegativeIntegerField(
  record: Record<string, unknown>,
  key: string,
): number {
  const value = integerField(record, key);
  if (value < 0) {
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

function nullableHexField(
  record: Record<string, unknown>,
  key: string,
): Hex | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== "string" || !isHex(value, { strict: true })) {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value;
}

function clHeadSourceField(
  record: Record<string, unknown>,
  key: string,
): "pool-slot0-liquidity" | "v4-state-view" {
  const value = stringField(record, key);
  if (value !== "pool-slot0-liquidity" && value !== "v4-state-view") {
    throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
  return value;
}

function venueFamilyField(
  record: Record<string, unknown>,
  key: string,
): FameIndexedPoolStateVenueFamily {
  const value = stringField(record, key);
  switch (value) {
    case "AerodromeV2":
    case "NativeWrap":
    case "Slipstream":
    case "Slipstream2":
    case "Solidly":
    case "UniswapV2":
    case "UniswapV3":
    case "UniswapV4":
      return value;
    default:
      throw new Error(`FAME indexed pool-state response invalid at ${key}.`);
  }
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
    ...(record.chainId !== undefined
      ? { chainId: nonNegativeIntegerField(record, "chainId") }
      : {}),
    ...(typeof record.poolAddress === "string" &&
    isAddress(record.poolAddress, { strict: false })
      ? { poolAddress: record.poolAddress as Address }
      : {}),
  };
}

function parseEntry(value: unknown, path: string): FameIndexedPoolStateEntry {
  const record = asRecord(value, path);
  const status = stringField(record, "status");
  if (status === "fresh" || status === "stale") {
    if (record.stateKind === "cl-head-snapshot") {
      return {
        status,
        stateKind: "cl-head-snapshot",
        poolId: stringField(record, "poolId"),
        chainId: nonNegativeIntegerField(record, "chainId"),
        poolAddress: nullableAddressField(record, "poolAddress"),
        poolKey: nullableHexField(record, "poolKey"),
        token0: addressField(record, "token0"),
        token1: addressField(record, "token1"),
        venueFamily: venueFamilyField(record, "venueFamily"),
        feeBps: numberField(record, "feeBps"),
        feeLabel: stringField(record, "feeLabel"),
        tickSpacing: nonNegativeIntegerField(record, "tickSpacing"),
        stateViewAddress: nullableAddressField(record, "stateViewAddress"),
        sqrtPriceX96: stringField(record, "sqrtPriceX96"),
        tick: integerField(record, "tick"),
        liquidity: stringField(record, "liquidity"),
        observedThroughBlock: nonNegativeIntegerField(
          record,
          "observedThroughBlock",
        ),
        source: clHeadSourceField(record, "source"),
        sourceRegistryId: stringField(record, "sourceRegistryId"),
        maxFreshnessBlocks: nonNegativeIntegerField(
          record,
          "maxFreshnessBlocks",
        ),
      };
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
      chainId: nonNegativeIntegerField(record, "chainId"),
      poolAddress: addressField(record, "poolAddress"),
      token0: addressField(record, "token0"),
      token1: addressField(record, "token1"),
      reserve0: stringField(record, "reserve0"),
      reserve1: stringField(record, "reserve1"),
      k: stringField(record, "k"),
      observedThroughBlock: nonNegativeIntegerField(
        record,
        "observedThroughBlock",
      ),
      lastReserveChangeBlock: nonNegativeIntegerField(
        record,
        "lastReserveChangeBlock",
      ),
      source,
      quoteModel,
      maxFreshnessBlocks: nonNegativeIntegerField(record, "maxFreshnessBlocks"),
    };
  }
  if (status === "unsupported") {
    return {
      status,
      poolId: stringField(record, "poolId"),
      chainId: nonNegativeIntegerField(record, "chainId"),
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
    currentBlock: nonNegativeIntegerField(record, "currentBlock"),
    producerMaxFreshnessBlocks: nonNegativeIntegerField(
      record,
      "producerMaxFreshnessBlocks",
    ),
    effectiveMaxFreshnessBlocks: nonNegativeIntegerField(
      record,
      "effectiveMaxFreshnessBlocks",
    ),
    pools: pools.map((pool, index) => parseEntry(pool, `$.pools[${index}]`)),
  };
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
        return parseIndexedPoolStateResponse((await response.json()) as unknown);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

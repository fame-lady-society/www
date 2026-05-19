import { isAddress, type Address } from "viem";

export type FameIndexedPoolStateStatus =
  | "fresh"
  | "stale"
  | "unknown"
  | "unsupported";

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

function parseEntry(value: unknown, path: string): FameIndexedPoolStateEntry {
  const record = asRecord(value, path);
  const status = stringField(record, "status");
  if (status === "fresh" || status === "stale") {
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
      chainId: numberField(record, "chainId"),
      poolAddress: addressField(record, "poolAddress"),
      token0: addressField(record, "token0"),
      token1: addressField(record, "token1"),
      reserve0: stringField(record, "reserve0"),
      reserve1: stringField(record, "reserve1"),
      k: stringField(record, "k"),
      observedThroughBlock: numberField(record, "observedThroughBlock"),
      lastReserveChangeBlock: numberField(record, "lastReserveChangeBlock"),
      source,
      quoteModel,
      maxFreshnessBlocks: numberField(record, "maxFreshnessBlocks"),
    };
  }
  if (status === "unsupported") {
    return {
      status,
      poolId: stringField(record, "poolId"),
      chainId: numberField(record, "chainId"),
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
    currentBlock: numberField(record, "currentBlock"),
    producerMaxFreshnessBlocks: numberField(
      record,
      "producerMaxFreshnessBlocks",
    ),
    effectiveMaxFreshnessBlocks: numberField(
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

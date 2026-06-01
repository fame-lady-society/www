import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";
import { FAME, USDC, WETH } from "../src/features/fame-swap/tokens";
import { famePoolEdgesForPair } from "../src/features/fame-swap/solver/poolUniverse";
import { famePoolStateRegistrySourceId } from "../src/features/fame-swap/solver/poolStateRegistry";
import {
  createIndexedPoolStateClient,
  type FameIndexedPoolStateBatchResponse,
  type FameIndexedPoolStateEntry,
} from "../src/features/fame-swap/solver/quotes/indexedPoolStateClient";
import { quoteFromIndexedSlipstreamReplay } from "../src/features/fame-swap/solver/quotes/indexedClReplayAdapter";
import { displaySafeDiagnosticMessage } from "../src/features/fame-swap/solver/diagnostics";
import { createLiveLiquidityQuoteAdapter } from "../src/features/fame-swap/solver/quotes/liveAdapters";
import type {
  FameAsyncQuoteAdapter,
  FameEdgeQuoteRequest,
} from "../src/features/fame-swap/solver/quotes/adapters";

type ReplayEntry = Extract<
  FameIndexedPoolStateEntry,
  { stateKind: "cl-replay-v1" }
>;

const DEFAULT_CL_REPLAY_PARITY_POOL_ID = "slipstream-usdc-weth-100";
const SELECTED_CL_REPLAY_PARITY_POOL_ID = "slipstream-basedflick-fame";
const BASEDFLICK =
  "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926" as const satisfies Address;

export const DEFAULT_CL_REPLAY_PARITY_AMOUNTS = {
  wethToUsdc: [10n ** 14n, 10n ** 15n, 10n ** 16n],
  usdcToWeth: [1_000_000n, 10_000_000n, 100_000_000n],
  fameToBasedflick: [10n ** 14n, 10n ** 15n, 31_597_600_141_347_829n],
  basedflickToFame: [10n ** 14n, 10n ** 15n, 10n ** 16n],
} as const;

export const DEFAULT_CL_REPLAY_PARITY_POOL_IDS = [
  DEFAULT_CL_REPLAY_PARITY_POOL_ID,
  SELECTED_CL_REPLAY_PARITY_POOL_ID,
] as const;

export interface FameClReplayParityCase {
  label: string;
  request: FameEdgeQuoteRequest;
}

export interface FameClReplayParityResult {
  label: string;
  localAmountOut: bigint;
  liveAmountOut: bigint;
  driftBps: bigint;
}

export interface FameClReplayParityReport {
  poolId: string;
  snapshotId: string;
  observedThroughBlock: number;
  stateHash: string;
  bitmapWordCount: number;
  initializedTickCount: number;
  results: FameClReplayParityResult[];
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function optionalIntegerEnv(name: string): number | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative safe integer.`);
  }
  return parsed;
}

function localOrTestPoolApiBase(url: URL): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1"
  );
}

function poolApiBaseUrlFromEnv(): URL {
  const legacyEndpoint = process.env.FAME_POOL_STATE_API_URL?.trim();
  if (legacyEndpoint) {
    throw new Error(
      "FAME_POOL_STATE_API_URL is no longer supported; set FAME_POOL_API_URL to the pool API base URL.",
    );
  }

  const baseUrl = env("FAME_POOL_API_URL");
  const url = new URL(baseUrl);
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "FAME_POOL_API_URL must not include credentials, query, or hash.",
    );
  }
  const normalizedPath = url.pathname.replace(/\/+$/u, "");
  if (
    normalizedPath.endsWith("/fame/pool-state") ||
    normalizedPath.endsWith("/fame/pool-quotes")
  ) {
    throw new Error(
      "FAME_POOL_API_URL must be a base URL, not a pool API endpoint.",
    );
  }
  if (url.protocol !== "https:" && !localOrTestPoolApiBase(url)) {
    throw new Error("FAME_POOL_API_URL must use HTTPS outside local/test.");
  }
  return url;
}

export function poolStateEndpointUrlFromEnv(): string {
  const url = poolApiBaseUrlFromEnv();
  const basePath = url.pathname.replace(/\/+$/u, "");
  url.pathname = `${basePath}/fame/pool-state`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function displaySafeErrorMessage(error: unknown): string {
  return displaySafeDiagnosticMessage(error);
}

function edge(poolId: string, tokenIn: Address, tokenOut: Address) {
  const found = famePoolEdgesForPair(tokenIn, tokenOut).find(
    (candidate) => candidate.poolId === poolId,
  );
  if (!found) throw new Error(`Missing ${poolId} edge.`);
  return found;
}

function replayEntry(
  entry: FameIndexedPoolStateEntry | undefined,
  expectedSourceRegistryId: string,
  poolId: string,
): ReplayEntry {
  if (
    !entry ||
    entry.status !== "fresh" ||
    !("stateKind" in entry) ||
    entry.stateKind !== "cl-replay-v1"
  ) {
    throw new Error(`${poolId} did not return fresh cl-replay-v1 state.`);
  }
  if (entry.sourceRegistryId !== expectedSourceRegistryId) {
    throw new Error(
      `${poolId} returned cl-replay-v1 state for registry ${entry.sourceRegistryId}, expected ${expectedSourceRegistryId}.`,
    );
  }
  return entry;
}

function parityBps(left: bigint, right: bigint): bigint {
  if (left === right) return 0n;
  const bigger = left > right ? left : right;
  const delta = left > right ? left - right : right - left;
  return (delta * 10_000n) / bigger;
}

function defaultParityCases(poolId: string): FameClReplayParityCase[] {
  if (poolId === SELECTED_CL_REPLAY_PARITY_POOL_ID) {
    return [
      ...DEFAULT_CL_REPLAY_PARITY_AMOUNTS.fameToBasedflick.map((amountIn) => ({
        label: `FAME->basedflick ${amountIn.toString()}`,
        request: { edge: edge(poolId, FAME, BASEDFLICK), amountIn },
      })),
      ...DEFAULT_CL_REPLAY_PARITY_AMOUNTS.basedflickToFame.map((amountIn) => ({
        label: `basedflick->FAME ${amountIn.toString()}`,
        request: { edge: edge(poolId, BASEDFLICK, FAME), amountIn },
      })),
    ];
  }

  return [
    ...DEFAULT_CL_REPLAY_PARITY_AMOUNTS.wethToUsdc.map((amountIn) => ({
      label: `WETH->USDC ${amountIn.toString()}`,
      request: { edge: edge(poolId, WETH, USDC), amountIn },
    })),
    ...DEFAULT_CL_REPLAY_PARITY_AMOUNTS.usdcToWeth.map((amountIn) => ({
      label: `USDC->WETH ${amountIn.toString()}`,
      request: { edge: edge(poolId, USDC, WETH), amountIn },
    })),
  ];
}

export async function runClReplayParity(options: {
  indexedState: FameIndexedPoolStateBatchResponse;
  liveAdapter: FameAsyncQuoteAdapter;
  currentBlock: number;
  cases?: readonly FameClReplayParityCase[];
  expectedSourceRegistryId?: string;
  poolId?: string;
}): Promise<FameClReplayParityReport> {
  const expectedSourceRegistryId =
    options.expectedSourceRegistryId ?? options.indexedState.sourceRegistryId;
  const poolId = options.poolId ?? DEFAULT_CL_REPLAY_PARITY_POOL_ID;
  const state = replayEntry(
    options.indexedState.pools.find(
      (pool) => "poolId" in pool && pool.poolId === poolId,
    ),
    expectedSourceRegistryId,
    poolId,
  );
  const results: FameClReplayParityResult[] = [];
  for (const item of options.cases ?? defaultParityCases(poolId)) {
    const context = {
      source: "indexed" as const,
      chainId: base.id,
      currentBlock: options.currentBlock,
      sourceRegistryId: options.indexedState.sourceRegistryId,
      effectiveMaxFreshnessBlocks:
        options.indexedState.effectiveMaxFreshnessBlocks,
      statusCounts: options.indexedState.pools.reduce(
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
      ),
    };
    const local = quoteFromIndexedSlipstreamReplay({
      indexedState: state,
      request: item.request,
      context,
      expectedSourceRegistryId,
    });
    const liveQuote = await options.liveAdapter.quoteEdge(item.request);
    if (local.status !== "quoted" || liveQuote.status !== "quoted") {
      throw new Error(
        `${item.label} failed: local=${local.status} live=${liveQuote.status}`,
      );
    }
    const driftBps = parityBps(local.amountOut, liveQuote.amountOut);
    results.push({
      label: item.label,
      localAmountOut: local.amountOut,
      liveAmountOut: liveQuote.amountOut,
      driftBps,
    });
    if (local.amountOut !== liveQuote.amountOut) {
      throw new Error(`${item.label} failed exact parity.`);
    }
  }
  return {
    poolId,
    snapshotId: state.snapshotId,
    observedThroughBlock: state.observedThroughBlock,
    stateHash: state.stateHash,
    bitmapWordCount: state.bitmapWordCount,
    initializedTickCount: state.initializedTickCount,
    results,
  };
}

async function main(): Promise<void> {
  const rpcUrl = env("BASE_RPC_URL");
  const helper = createIndexedPoolStateClient({
    endpointUrl: poolStateEndpointUrlFromEnv(),
    serviceToken: env("FAME_POOL_STATE_SERVICE_TOKEN"),
    timeoutMs: optionalIntegerEnv("FAME_POOL_STATE_TIMEOUT_MS"),
  });
  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl, {
      batch: true,
      retryCount: 0,
    }),
  });
  const currentBlock = Number(await publicClient.getBlockNumber());
  if (!Number.isSafeInteger(currentBlock)) {
    throw new Error("Current Base block exceeds Number.MAX_SAFE_INTEGER.");
  }
  const poolIds = process.env.FAME_CL_REPLAY_PARITY_POOL_ID?.split(",")
    .map((poolId) => poolId.trim())
    .filter((poolId) => poolId.length > 0) ?? [
    ...DEFAULT_CL_REPLAY_PARITY_POOL_IDS,
  ];
  const indexed = await helper.fetchPoolStates({
    currentBlock,
    maxFreshnessBlocks: optionalIntegerEnv(
      "FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS",
    ),
    stateSurfaces: ["cl-replay-v1"],
    poolIds,
  });
  const expectedSourceRegistryId = famePoolStateRegistrySourceId();
  if (indexed.sourceRegistryId !== expectedSourceRegistryId) {
    throw new Error(
      `Indexed state registry mismatch: got ${indexed.sourceRegistryId}, expected ${expectedSourceRegistryId}.`,
    );
  }

  for (const poolId of poolIds) {
    const state = replayEntry(
      indexed.pools.find((pool) => "poolId" in pool && pool.poolId === poolId),
      expectedSourceRegistryId,
      poolId,
    );
    const live = await createLiveLiquidityQuoteAdapter({
      client: {
        getBlockNumber: async () => BigInt(state.observedThroughBlock),
        readContract: (request) => publicClient.readContract(request),
      },
      chainId: base.id,
      blockNumber: BigInt(state.observedThroughBlock),
    });
    const report = await runClReplayParity({
      indexedState: indexed,
      liveAdapter: live,
      currentBlock,
      expectedSourceRegistryId,
      poolId,
    });

    console.log(
      [
        `pool=${report.poolId}`,
        `snapshot=${report.snapshotId}`,
        `block=${report.observedThroughBlock.toString()}`,
        `stateHash=${report.stateHash}`,
        `bitmapWords=${report.bitmapWordCount.toString()}`,
        `initializedTicks=${report.initializedTickCount.toString()}`,
      ].join(" "),
    );

    for (const result of report.results) {
      console.log(
        [
          result.label,
          `local=${result.localAmountOut.toString()}`,
          `live=${result.liveAmountOut.toString()}`,
          `driftBps=${result.driftBps.toString()}`,
        ].join(" "),
      );
    }
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(displaySafeErrorMessage(error));
    process.exitCode = 1;
  });
}

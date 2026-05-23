import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";
import { USDC, WETH } from "../src/features/fame-swap/tokens";
import { famePoolEdgesForPair } from "../src/features/fame-swap/solver/poolUniverse";
import { famePoolStateRegistrySourceId } from "../src/features/fame-swap/solver/poolStateRegistry";
import {
  createIndexedPoolStateClient,
  type FameIndexedPoolStateBatchResponse,
  type FameIndexedPoolStateEntry,
} from "../src/features/fame-swap/solver/quotes/indexedPoolStateClient";
import { quoteFromIndexedSlipstreamReplay } from "../src/features/fame-swap/solver/quotes/indexedClReplayAdapter";
import { createLiveLiquidityQuoteAdapter } from "../src/features/fame-swap/solver/quotes/liveAdapters";
import type {
  FameAsyncQuoteAdapter,
  FameEdgeQuoteRequest,
} from "../src/features/fame-swap/solver/quotes/adapters";

type ReplayEntry = Extract<
  FameIndexedPoolStateEntry,
  { stateKind: "cl-replay-v1" }
>;

const POOL_ID = "slipstream-usdc-weth-100";
export const DEFAULT_CL_REPLAY_PARITY_AMOUNTS = {
  wethToUsdc: [10n ** 14n, 10n ** 15n, 10n ** 16n],
  usdcToWeth: [1_000_000n, 10_000_000n, 100_000_000n],
} as const;

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

export function displaySafeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return (
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length > 0 &&
          !/\b(request body|calldata|approval|swap request|private key|signer|authorization|api[-_ ]?key)\b|(?:^|\s)secret(?:[-_ ]?(?:key|token))?\s*[:=]/i.test(
            line,
          ),
      ) ?? "FAME CL replay parity failed."
  )
    .replace(/(?:https?|wss?):\/\/\S+/g, "[redacted-url]")
    .replace(/\b(?:bearer|token)\s+[a-z0-9._~+/=-]+/gi, "[redacted-secret]")
    .replace(/0x[a-fA-F0-9]{64,}/g, "[redacted-hex]");
}

function edge(tokenIn: Address, tokenOut: Address) {
  const found = famePoolEdgesForPair(tokenIn, tokenOut).find(
    (candidate) => candidate.poolId === POOL_ID,
  );
  if (!found) throw new Error(`Missing ${POOL_ID} edge.`);
  return found;
}

function replayEntry(
  entry: FameIndexedPoolStateEntry | undefined,
  expectedSourceRegistryId: string,
): ReplayEntry {
  if (
    !entry ||
    entry.status !== "fresh" ||
    !("stateKind" in entry) ||
    entry.stateKind !== "cl-replay-v1"
  ) {
    throw new Error(`${POOL_ID} did not return fresh cl-replay-v1 state.`);
  }
  if (entry.sourceRegistryId !== expectedSourceRegistryId) {
    throw new Error(
      `${POOL_ID} returned cl-replay-v1 state for registry ${entry.sourceRegistryId}, expected ${expectedSourceRegistryId}.`,
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

function defaultParityCases(): FameClReplayParityCase[] {
  return [
    ...DEFAULT_CL_REPLAY_PARITY_AMOUNTS.wethToUsdc.map((amountIn) => ({
      label: `WETH->USDC ${amountIn.toString()}`,
      request: { edge: edge(WETH, USDC), amountIn },
    })),
    ...DEFAULT_CL_REPLAY_PARITY_AMOUNTS.usdcToWeth.map((amountIn) => ({
      label: `USDC->WETH ${amountIn.toString()}`,
      request: { edge: edge(USDC, WETH), amountIn },
    })),
  ];
}

export async function runClReplayParity(options: {
  indexedState: FameIndexedPoolStateBatchResponse;
  liveAdapter: FameAsyncQuoteAdapter;
  currentBlock: number;
  cases?: readonly FameClReplayParityCase[];
  expectedSourceRegistryId?: string;
}): Promise<FameClReplayParityReport> {
  const expectedSourceRegistryId =
    options.expectedSourceRegistryId ?? options.indexedState.sourceRegistryId;
  const state = replayEntry(
    options.indexedState.pools.find(
      (pool) => "poolId" in pool && pool.poolId === POOL_ID,
    ),
    expectedSourceRegistryId,
  );
  const results: FameClReplayParityResult[] = [];
  for (const item of options.cases ?? defaultParityCases()) {
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
    endpointUrl: env("FAME_POOL_STATE_API_URL"),
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
  const indexed = await helper.fetchPoolStates({
    currentBlock,
    maxFreshnessBlocks: optionalIntegerEnv("FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS"),
    stateSurfaces: ["cl-replay-v1"],
    poolIds: [POOL_ID],
  });
  const expectedSourceRegistryId = famePoolStateRegistrySourceId();
  if (indexed.sourceRegistryId !== expectedSourceRegistryId) {
    throw new Error(
      `Indexed state registry mismatch: got ${indexed.sourceRegistryId}, expected ${expectedSourceRegistryId}.`,
    );
  }
  const state = replayEntry(indexed.pools[0], expectedSourceRegistryId);
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
  });

  console.log(
    [
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

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(displaySafeErrorMessage(error));
    process.exitCode = 1;
  });
}

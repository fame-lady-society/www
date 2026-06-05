import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";
import { FAME, USDC, WETH } from "../src/features/fame-swap/tokens";
import { famePoolEdgesForPair } from "../src/features/fame-swap/solver/poolUniverse";
import {
  FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
  famePoolStateRegistrySourceId,
} from "../src/features/fame-swap/solver/poolStateRegistry";
import {
  createIndexedPoolStateClient,
  type FameIndexedPoolStateBatchResponse,
  type FameIndexedPoolStateEntry,
} from "../src/features/fame-swap/solver/quotes/indexedPoolStateClient";
import {
  createIndexedQuoteApiClient,
  type FamePoolQuoteBatchResponse,
  type FamePoolQuoteClient,
  type FamePoolQuoteQuotedEntry,
  type FameV4ClPoolQuoteQuotedEntry,
} from "../src/features/fame-swap/solver/quotes/indexedQuoteApiClient";
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
type ParitySurface = "cl-replay-v1" | "compact-quote-v1";

const DEFAULT_POOL_ID = "slipstream-usdc-weth-100";
const SELECTED_CL_REPLAY_PARITY_POOL_ID = "slipstream-basedflick-fame";
const BASEDFLICK =
  "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926" as const satisfies Address;
export const DEFAULT_CL_REPLAY_PARITY_AMOUNTS = {
  wethToUsdc: [10n ** 14n, 10n ** 15n, 10n ** 16n],
  usdcToWeth: [1_000_000n, 10_000_000n, 100_000_000n],
  fameToBasedflick: [10n ** 14n, 10n ** 15n, 31_597_600_141_347_829n],
  basedflickToFame: [10n ** 14n, 10n ** 15n, 10n ** 16n],
} as const;

export interface FameClReplayParityTarget {
  poolId: string;
  tokenIn: Address;
  tokenOut: Address;
  amounts: readonly bigint[];
}

export interface FameClReplayParityCase {
  label: string;
  request: FameEdgeQuoteRequest;
}

export interface FameClReplayParityResult {
  label: string;
  localAmountOut: bigint;
  liveAmountOut: bigint;
  driftBps: bigint;
  evidenceId?: string;
}

export interface FameClReplayParityReport {
  poolId: string;
  surface: ParitySurface;
  sourceRegistryId: string;
  currentBlock: number;
  snapshotId: string;
  observedThroughBlock: number;
  blockHash: string;
  parentHash: string;
  stateHash: string;
  evidenceId: string;
  bitmapWordCount?: number;
  initializedTickCount?: number;
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

function cliValue(args: readonly string[], name: string): string | undefined {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function cliAddress(
  args: readonly string[],
  name: string,
): Address | undefined {
  const value = cliValue(args, name);
  if (value === undefined) return undefined;
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`${name} must be an address.`);
  }
  return value as Address;
}

function cliAmounts(args: readonly string[]): bigint[] | undefined {
  const rawValues = args
    .flatMap((arg, index) => {
      if (arg === "--amount") return [args[index + 1] ?? ""];
      if (arg.startsWith("--amount=")) return [arg.slice("--amount=".length)];
      return [];
    })
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (rawValues.length === 0) return undefined;
  return rawValues.map((value) => {
    if (!/^[1-9][0-9]*$/.test(value)) {
      throw new Error("--amount values must be positive integer decimals.");
    }
    return BigInt(value);
  });
}

function parityTargetsFromCliArgs(
  args: readonly string[],
): FameClReplayParityTarget[] | undefined {
  const poolId = cliValue(args, "--pool");
  const tokenIn = cliAddress(args, "--token-in");
  const tokenOut = cliAddress(args, "--token-out");
  const amounts = cliAmounts(args);
  if (!poolId && !tokenIn && !tokenOut && !amounts) return undefined;
  if (!poolId || !tokenIn || !tokenOut || !amounts) {
    throw new Error(
      "Targeted parity requires --pool, --token-in, --token-out, and --amount.",
    );
  }
  return [{ poolId, tokenIn, tokenOut, amounts }];
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

export function poolQuoteEndpointUrlFromEnv(): string {
  const url = poolApiBaseUrlFromEnv();
  const basePath = url.pathname.replace(/\/+$/u, "");
  url.pathname = `${basePath}/fame/pool-quotes`;
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
  if (!found) {
    throw new Error(
      `Missing ${poolId} edge for ${tokenIn.toLowerCase()} -> ${tokenOut.toLowerCase()}.`,
    );
  }
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

function parityTargetsForPool(poolId: string): FameClReplayParityTarget[] {
  if (poolId === SELECTED_CL_REPLAY_PARITY_POOL_ID) {
    return [
      {
        poolId,
        tokenIn: FAME,
        tokenOut: BASEDFLICK,
        amounts: DEFAULT_CL_REPLAY_PARITY_AMOUNTS.fameToBasedflick,
      },
      {
        poolId,
        tokenIn: BASEDFLICK,
        tokenOut: FAME,
        amounts: DEFAULT_CL_REPLAY_PARITY_AMOUNTS.basedflickToFame,
      },
    ];
  }

  return [
    {
      poolId,
      tokenIn: WETH,
      tokenOut: USDC,
      amounts: DEFAULT_CL_REPLAY_PARITY_AMOUNTS.wethToUsdc,
    },
    {
      poolId,
      tokenIn: USDC,
      tokenOut: WETH,
      amounts: DEFAULT_CL_REPLAY_PARITY_AMOUNTS.usdcToWeth,
    },
  ];
}

function defaultParityTargets(): FameClReplayParityTarget[] {
  return parityTargetsForPool(DEFAULT_POOL_ID);
}

export function buildClReplayParityCases(
  targets: readonly FameClReplayParityTarget[] = defaultParityTargets(),
): FameClReplayParityCase[] {
  return targets.flatMap((target) =>
    target.amounts.map((amountIn) => ({
      label: `${target.poolId} ${target.tokenIn.toLowerCase()}->${target.tokenOut.toLowerCase()} ${amountIn.toString()}`,
      request: {
        edge: edge(target.poolId, target.tokenIn, target.tokenOut),
        amountIn,
      },
    })),
  );
}

function paritySurfaceForCases(
  cases: readonly FameClReplayParityCase[],
): ParitySurface {
  const surfaces = new Set<ParitySurface>();
  for (const item of cases) {
    if (item.request.edge.poolId === FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId) {
      surfaces.add("compact-quote-v1");
      continue;
    }
    if (item.request.edge.pool.venue === "aerodrome-slipstream") {
      surfaces.add("cl-replay-v1");
      continue;
    }
    throw new Error(
      `${item.request.edge.poolId} is not supported by the parity harness.`,
    );
  }
  if (surfaces.size !== 1) {
    throw new Error("FAME parity cases must target one quote surface.");
  }
  const [surface] = surfaces;
  if (!surface) throw new Error("FAME parity requires at least one case.");
  return surface;
}

function compactQuoteEvidenceId(quote: FamePoolQuoteQuotedEntry): string {
  if (quote.quoteKind === "cl-quote-v1") return quote.snapshotId;
  return `${quote.poolId}:${quote.observedThroughBlock.toString()}`;
}

function compactQuoteRowsForCases(options: {
  quoteResponse: FamePoolQuoteBatchResponse;
  cases: readonly FameClReplayParityCase[];
  currentBlock: number;
  expectedSourceRegistryId: string;
  maxFreshnessBlocks?: number;
}): FameV4ClPoolQuoteQuotedEntry[] {
  const {
    quoteResponse,
    cases,
    currentBlock,
    expectedSourceRegistryId,
    maxFreshnessBlocks,
  } = options;
  if (quoteResponse.sourceRegistryId !== expectedSourceRegistryId) {
    throw new Error(
      `Compact quote registry mismatch: got ${quoteResponse.sourceRegistryId}, expected ${expectedSourceRegistryId}.`,
    );
  }
  if (quoteResponse.currentBlock !== currentBlock) {
    throw new Error(
      `Compact quote current block mismatch: got ${quoteResponse.currentBlock.toString()}, expected ${currentBlock.toString()}.`,
    );
  }

  return cases.map((item) => {
    const rows = quoteResponse.quotes.filter(
      (quote): quote is FamePoolQuoteQuotedEntry =>
        quote.status === "quoted" &&
        quote.poolId === item.request.edge.poolId &&
        quote.tokenIn.toLowerCase() ===
          item.request.edge.tokenIn.toLowerCase() &&
        quote.tokenOut.toLowerCase() ===
          item.request.edge.tokenOut.toLowerCase() &&
        quote.amountIn === item.request.amountIn.toString(),
    );
    if (rows.length !== 1) {
      throw new Error(
        `${item.label} expected exactly one compact quote row, got ${rows.length.toString()}.`,
      );
    }
    const row = rows[0]!;
    if (item.request.edge.poolId === FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolId) {
      if (
        row.quoteKind !== "cl-quote-v1" ||
        row.source !== "uniswap-v4-state-view"
      ) {
        throw new Error(
          `${item.label} did not return a V4 compact CL quote row.`,
        );
      }
      if (
        row.poolKey.toLowerCase() !==
          FAME_V4_ZORA_REVIEWED_POOL_SHAPE.poolKey.toLowerCase() ||
        row.hookData.toLowerCase() !==
          FAME_V4_ZORA_REVIEWED_POOL_SHAPE.hookData.toLowerCase()
      ) {
        throw new Error(
          `${item.label} did not return the reviewed V4 row shape.`,
        );
      }
      const v4Row: FameV4ClPoolQuoteQuotedEntry = row;
      if (v4Row.observedThroughBlock > currentBlock) {
        throw new Error(`${item.label} compact quote is from a future block.`);
      }
      const effectiveFreshness = Math.min(
        v4Row.maxFreshnessBlocks,
        quoteResponse.effectiveMaxFreshnessBlocks,
        maxFreshnessBlocks ?? Number.MAX_SAFE_INTEGER,
      );
      if (currentBlock - v4Row.observedThroughBlock > effectiveFreshness) {
        throw new Error(`${item.label} compact quote is stale.`);
      }
      return v4Row;
    }
    throw new Error(
      `${item.request.edge.poolId} is not supported by compact quote parity.`,
    );
  });
}

export async function runCompactQuoteParity(options: {
  quoteResponse: FamePoolQuoteBatchResponse;
  liveAdapter: FameAsyncQuoteAdapter;
  currentBlock: number;
  cases: readonly FameClReplayParityCase[];
  expectedSourceRegistryId?: string;
  maxFreshnessBlocks?: number;
}): Promise<FameClReplayParityReport> {
  const expectedSourceRegistryId =
    options.expectedSourceRegistryId ?? options.quoteResponse.sourceRegistryId;
  const rows = compactQuoteRowsForCases({
    quoteResponse: options.quoteResponse,
    cases: options.cases,
    currentBlock: options.currentBlock,
    expectedSourceRegistryId,
    maxFreshnessBlocks: options.maxFreshnessBlocks,
  });
  const observedBlocks = new Set(rows.map((row) => row.observedThroughBlock));
  if (observedBlocks.size !== 1) {
    throw new Error("Compact quote parity requires one observed block.");
  }

  const results: FameClReplayParityResult[] = [];
  for (let index = 0; index < options.cases.length; index += 1) {
    const item = options.cases[index]!;
    const row = rows[index]!;
    const liveQuote = await options.liveAdapter.quoteEdge(item.request);
    if (liveQuote.status !== "quoted") {
      throw new Error(`${item.label} failed: live=${liveQuote.status}`);
    }
    const localAmountOut = BigInt(row.amountOut);
    const driftBps = parityBps(localAmountOut, liveQuote.amountOut);
    const evidenceId = compactQuoteEvidenceId(row);
    results.push({
      label: item.label,
      localAmountOut,
      liveAmountOut: liveQuote.amountOut,
      driftBps,
      evidenceId,
    });
    if (localAmountOut !== liveQuote.amountOut) {
      throw new Error(`${item.label} failed exact compact quote parity.`);
    }
  }

  const first = rows[0]!;
  return {
    poolId: first.poolId,
    surface: "compact-quote-v1",
    sourceRegistryId: options.quoteResponse.sourceRegistryId,
    currentBlock: options.currentBlock,
    snapshotId: first.snapshotId,
    observedThroughBlock: first.observedThroughBlock,
    blockHash: first.blockHash,
    parentHash: first.parentHash,
    stateHash: first.stateHash,
    evidenceId: compactQuoteEvidenceId(first),
    results,
  };
}

export async function runClReplayParity(options: {
  indexedState: FameIndexedPoolStateBatchResponse;
  liveAdapter: FameAsyncQuoteAdapter;
  currentBlock: number;
  cases?: readonly FameClReplayParityCase[];
  poolId?: string;
  expectedSourceRegistryId?: string;
}): Promise<FameClReplayParityReport> {
  const poolId =
    options.poolId ??
    options.cases?.[0]?.request.edge.poolId ??
    DEFAULT_POOL_ID;
  const cases =
    options.cases ?? buildClReplayParityCases(parityTargetsForPool(poolId));
  if (cases.some((item) => item.request.edge.poolId !== poolId) === true) {
    throw new Error("FAME CL replay parity cases must target one pool id.");
  }
  if (paritySurfaceForCases(cases) !== "cl-replay-v1") {
    throw new Error(
      "runClReplayParity only supports cl-replay-v1 cases; use compact quote parity for V4 targets.",
    );
  }
  const expectedSourceRegistryId =
    options.expectedSourceRegistryId ?? options.indexedState.sourceRegistryId;
  const state = replayEntry(
    options.indexedState.pools.find(
      (pool) => "poolId" in pool && pool.poolId === poolId,
    ),
    expectedSourceRegistryId,
    poolId,
  );
  const results: FameClReplayParityResult[] = [];
  for (const item of cases) {
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
      evidenceId: state.snapshotId,
    });
    if (local.amountOut !== liveQuote.amountOut) {
      throw new Error(`${item.label} failed exact parity.`);
    }
  }
  return {
    poolId,
    surface: "cl-replay-v1",
    sourceRegistryId: options.indexedState.sourceRegistryId,
    currentBlock: options.currentBlock,
    snapshotId: state.snapshotId,
    observedThroughBlock: state.observedThroughBlock,
    blockHash: state.blockHash,
    parentHash: state.parentHash,
    stateHash: state.stateHash,
    evidenceId: state.snapshotId,
    bitmapWordCount: state.bitmapWordCount,
    initializedTickCount: state.initializedTickCount,
    results,
  };
}

async function main(): Promise<void> {
  const targets = parityTargetsFromCliArgs(process.argv.slice(2));
  const cases = buildClReplayParityCases(targets);
  const poolIds = [...new Set(cases.map((item) => item.request.edge.poolId))];
  if (poolIds.length !== 1) {
    throw new Error("FAME CL replay parity CLI targets must resolve to one pool.");
  }
  const surface = paritySurfaceForCases(cases);
  const rpcUrl = env("BASE_RPC_URL");
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
  const expectedSourceRegistryId = famePoolStateRegistrySourceId();
  let report: FameClReplayParityReport;

  if (surface === "compact-quote-v1") {
    const maxFreshnessBlocks = optionalIntegerEnv(
      "FAME_POOL_QUOTE_MAX_FRESHNESS_BLOCKS",
    );
    const quoteClient: FamePoolQuoteClient = createIndexedQuoteApiClient({
      endpointUrl: poolQuoteEndpointUrlFromEnv(),
      serviceToken: env("FAME_POOL_STATE_SERVICE_TOKEN"),
      timeoutMs: optionalIntegerEnv("FAME_POOL_QUOTE_TIMEOUT_MS"),
    });
    const quoteResponse = await quoteClient.fetchQuotes({
      currentBlock,
      maxFreshnessBlocks,
      quotes: cases.map((item) => ({
        poolId: item.request.edge.poolId,
        tokenIn: item.request.edge.tokenIn,
        tokenOut: item.request.edge.tokenOut,
        amountIn: item.request.amountIn.toString(),
      })),
    });
    const rows = compactQuoteRowsForCases({
      quoteResponse,
      cases,
      currentBlock,
      expectedSourceRegistryId,
      maxFreshnessBlocks,
    });
    const observedBlocks = [
      ...new Set(rows.map((row) => row.observedThroughBlock)),
    ];
    if (observedBlocks.length !== 1) {
      throw new Error("Compact quote parity requires one observed block.");
    }
    const [observedThroughBlock] = observedBlocks;
    if (observedThroughBlock === undefined) {
      throw new Error("Compact quote parity returned no quoted rows.");
    }
    const live = await createLiveLiquidityQuoteAdapter({
      client: {
        getBlockNumber: async () => BigInt(observedThroughBlock),
        readContract: (request) => publicClient.readContract(request),
      },
      chainId: base.id,
      blockNumber: BigInt(observedThroughBlock),
    });
    report = await runCompactQuoteParity({
      quoteResponse,
      liveAdapter: live,
      currentBlock,
      cases,
      expectedSourceRegistryId,
      maxFreshnessBlocks,
    });
  } else {
    const helper = createIndexedPoolStateClient({
      endpointUrl: poolStateEndpointUrlFromEnv(),
      serviceToken: env("FAME_POOL_STATE_SERVICE_TOKEN"),
      timeoutMs: optionalIntegerEnv("FAME_POOL_STATE_TIMEOUT_MS"),
    });
    const indexed = await helper.fetchPoolStates({
      currentBlock,
      maxFreshnessBlocks: optionalIntegerEnv(
        "FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS",
      ),
      stateSurfaces: ["cl-replay-v1"],
      poolIds,
    });
    if (indexed.sourceRegistryId !== expectedSourceRegistryId) {
      throw new Error(
        `Indexed state registry mismatch: got ${indexed.sourceRegistryId}, expected ${expectedSourceRegistryId}.`,
      );
    }
    const state = replayEntry(
      indexed.pools[0],
      expectedSourceRegistryId,
      poolIds[0],
    );
    const live = await createLiveLiquidityQuoteAdapter({
      client: {
        getBlockNumber: async () => BigInt(state.observedThroughBlock),
        readContract: (request) => publicClient.readContract(request),
      },
      chainId: base.id,
      blockNumber: BigInt(state.observedThroughBlock),
    });
    report = await runClReplayParity({
      indexedState: indexed,
      liveAdapter: live,
      currentBlock,
      cases,
      poolId: poolIds[0],
      expectedSourceRegistryId,
    });
  }

  console.log(
    [
      `pool=${report.poolId}`,
      `surface=${report.surface}`,
      `registry=${report.sourceRegistryId}`,
      `snapshot=${report.snapshotId}`,
      `currentBlock=${report.currentBlock.toString()}`,
      `block=${report.observedThroughBlock.toString()}`,
      `blockHash=${report.blockHash}`,
      `parentHash=${report.parentHash}`,
      `stateHash=${report.stateHash}`,
      `evidence=${report.evidenceId}`,
      report.bitmapWordCount === undefined
        ? null
        : `bitmapWords=${report.bitmapWordCount.toString()}`,
      report.initializedTickCount === undefined
        ? null
        : `initializedTicks=${report.initializedTickCount.toString()}`,
    ]
      .filter((part): part is string => part !== null)
      .join(" "),
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

import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import { getFameSwapConfig, type FameSwapConfig } from "../config";
import { routeCandidatesForPair } from "../solver/graph/candidates";
import {
  FAME_SWAP_PREVIEW_RECIPIENT,
  quoteFameSwap,
  quoteFameSwapAsync,
} from "../solver/quote";
import {
  solveFameTargetOutput,
  type FameTargetOutputSolverResult,
} from "../solver/targetOutput";
import type { FameAsyncQuoteAdapter } from "../solver/quotes/adapters";
import type { FameLegQuote } from "../solver/quotes/adapters";
import type { FameQuoteContext } from "../solver/quotes/quoteContext";
import {
  createIndexedQuoteApiAdapter,
  createQuoteApiDiagnosticsRecorder,
  type FameQuoteApiDiagnosticsSnapshot,
} from "../solver/quotes/indexedQuoteApiAdapter";
import {
  createIndexedQuoteApiClient,
  type FamePoolQuoteClient,
} from "../solver/quotes/indexedQuoteApiClient";
import {
  createLiveLiquidityQuoteAdapter,
  unavailableLiveAsyncQuoteAdapter,
} from "../solver/quotes/liveAdapters";
import {
  famePoolStateRegistryPoolIdsForPair,
  famePoolStateRegistrySourceId,
  famePoolSupportsCompactQuote,
} from "../solver/poolStateRegistry";
import {
  FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
} from "../solver/poolActivationLedger";
import {
  liveReadiness,
  routerPolicyTargetKey,
  staticReadiness,
  type RouterPolicyReader,
  type RouterPolicySnapshot,
} from "../solver/readiness";
import { displaySafeDiagnosticMessage } from "../solver/diagnostics";
import type {
  FameSwapQuote,
  FameSwapQuoteRequest,
  FameSwapReadiness,
} from "../solver/types";
import type { FameSwapToken } from "../tokens";
import { baseServerRpcUrl, fameForkModeEnabled } from "@/viem/baseRpcUrls";
import { fameRouterAbi } from "../router/abi";

const QUOTE_RPC_TIMEOUT_MS = 8_000;
const QUOTE_API_DEFAULT_TIMEOUT_MS = 2_500;
const QUOTE_API_MAX_TIMEOUT_MS = 4_000;
const QUOTE_API_MIN_TIMEOUT_MS = 250;
const QUOTE_API_LIVE_FALLBACK_RESERVE_MS = 6_000;
const READINESS_CACHE_TTL_MS = 5_000;
const DEFAULT_QUOTE_REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_QUOTE_RESPONSE_CUSHION_MS = 1_500;

const readinessCache = new Map<
  string,
  { expiresAt: number; value: Promise<FameSwapReadiness> | FameSwapReadiness }
>();

/**
 * The non-HTTP execution boundary for FAME quotes.  HTTP concerns (body
 * parsing, rate limiting, and debug serialization) intentionally stay in the
 * route handler; callers cannot provide server credentials here.
 */
export interface FameExactInputQuoteRequest {
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  amountIn: bigint;
  recipient: Address | null;
  deadlineSeconds?: bigint;
  requestedRouteId?: string;
  config?: FameSwapConfig;
  optimizerBudgets?: FameSwapQuoteRequest["optimizerBudgets"];
}

export interface FameExactInputQuoteDependencies {
  readinessForQuote: (
    routerAddress: Address | null,
  ) => FameSwapReadiness | Promise<FameSwapReadiness>;
  createAdapter?: (
    request: FameSwapQuoteRequest & { readiness: FameSwapReadiness },
  ) => FameAsyncQuoteAdapter | Promise<FameAsyncQuoteAdapter>;
  quoteForRequest?: (
    request: FameSwapQuoteRequest & { readiness: FameSwapReadiness },
  ) => FameSwapQuote | Promise<FameSwapQuote>;
}

type QuoteApiHelperReason =
  | "not_configured"
  | "invalid_config"
  | "adapter_context_unavailable"
  | "unsupported_adapter_context"
  | "unsafe_block_number"
  | "no_registered_pools"
  | "wrapped";

export interface FameQuoteApiHelperDebug
  extends FameQuoteApiDiagnosticsSnapshot {
  reason: QuoteApiHelperReason;
  poolCount?: number;
  selectedRoute?: FameQuoteApiSelectedRouteDebug;
}

interface QuoteApiClientConfig {
  client: FamePoolQuoteClient | null;
  configured: boolean;
  reason: Extract<QuoteApiHelperReason, "not_configured" | "invalid_config">;
  maxFreshnessBlocks?: number;
}

interface QuoteApiSelectedRouteLegDebug {
  poolId: string;
  source:
    | "compact_quote"
    | "raw_replay"
    | "live"
    | "fork"
    | "snapshot"
    | "other";
  quoteContextSource?: string;
  evidenceId?: string;
  currentBlock?: number;
  sourceRegistryId?: string;
  effectiveMaxFreshnessBlocks?: number;
}

interface QuoteApiSelectedRouteActivationDebug {
  selectedPoolId: typeof FAME_SELECTED_CL_ACTIVATION_CANDIDATE;
  liveDependencyPoolId: typeof FAME_SELECTED_LIVE_ROUTE_DEPENDENCY;
  selectedPoolSource: QuoteApiSelectedRouteLegDebug["source"] | "absent";
  liveDependencySource: QuoteApiSelectedRouteLegDebug["source"] | "absent";
  outcome:
    | "compact_quote_with_live_dependency"
    | "raw_replay_with_live_dependency"
    | "compact_quote_without_live_dependency"
    | "raw_replay_without_live_dependency"
    | "selected_pool_live_fallback"
    | "live_dependency_without_selected_pool";
}

export interface FameQuoteApiSelectedRouteDebug {
  compactQuoteLegs: number;
  liveLegs: number;
  otherLegs: number;
  activation?: QuoteApiSelectedRouteActivationDebug;
  legs: QuoteApiSelectedRouteLegDebug[];
}

interface QuoteApiAdapterResult {
  adapter: FameAsyncQuoteAdapter;
  debug(
    selectedRoute?: FameQuoteApiSelectedRouteDebug,
  ): FameQuoteApiHelperDebug;
}

export interface ProductionFameQuoteDependenciesOptions {
  /** The route uses these optional seams for focused HTTP tests. */
  readinessForQuote?: FameExactInputQuoteDependencies["readinessForQuote"];
  createAdapter?: FameExactInputQuoteDependencies["createAdapter"];
  quoteForRequest?: FameExactInputQuoteDependencies["quoteForRequest"];
  quoteAdapterForRequest?: FameExactInputQuoteDependencies["createAdapter"];
  quoteApiClient?: FamePoolQuoteClient | null;
  startedAtMs?: number;
  requestTimeoutMs?: number;
  responseCushionMs?: number;
}

export interface ProductionFameQuoteDependencies
  extends FameExactInputQuoteDependencies {
  quoteApiDebugForResult(
    quote: FameSwapQuote,
  ): FameQuoteApiHelperDebug | undefined;
}

function baseRpcUrl(): string | undefined {
  return baseServerRpcUrl();
}

function optionalServerEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function optionalServerNonNegativeIntegerEnv(name: string): number | undefined {
  const value = optionalServerEnv(name);
  if (!value) return undefined;
  if (!/^(0|[1-9][0-9]*)$/u.test(value)) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${name} must be a safe integer.`);
  }
  return parsed;
}

function remainingQuoteTimeMs(
  options: ProductionFameQuoteDependenciesOptions,
): number {
  const startedAtMs = options.startedAtMs ?? Date.now();
  return Math.max(
    0,
    (options.requestTimeoutMs ?? DEFAULT_QUOTE_REQUEST_TIMEOUT_MS) -
      (Date.now() - startedAtMs) -
      (options.responseCushionMs ?? DEFAULT_QUOTE_RESPONSE_CUSHION_MS),
  );
}

function readTimeoutForQuoteRequest(
  options: ProductionFameQuoteDependenciesOptions,
): number {
  return Math.max(
    250,
    Math.min(QUOTE_RPC_TIMEOUT_MS, remainingQuoteTimeMs(options)),
  );
}

function quoteApiTimeoutForQuoteRequest(
  options: ProductionFameQuoteDependenciesOptions,
): number {
  const configured =
    optionalServerNonNegativeIntegerEnv("FAME_POOL_QUOTE_TIMEOUT_MS") ??
    QUOTE_API_DEFAULT_TIMEOUT_MS;
  const configuredBudget = Math.min(configured, QUOTE_API_MAX_TIMEOUT_MS);
  const helperBudget = Math.max(
    QUOTE_API_MIN_TIMEOUT_MS,
    remainingQuoteTimeMs(options) - QUOTE_API_LIVE_FALLBACK_RESERVE_MS,
  );
  return Math.min(configuredBudget, helperBudget);
}

function localOrTestPoolApiBase(url: URL): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1"
  );
}

function quoteEndpointUrlFromPoolApiBase(rawBaseUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawBaseUrl);
  } catch {
    throw new Error("FAME pool API base URL is invalid.");
  }
  if (url.username || url.password || url.search || url.hash)
    throw new Error(
      "FAME pool API base URL must not include credentials, query, or hash.",
    );
  const basePath = url.pathname.replace(/\/+$/u, "");
  if (
    basePath.endsWith("/fame/pool-state") ||
    basePath.endsWith("/fame/pool-quotes")
  )
    throw new Error(
      "FAME_POOL_API_URL must be a base URL, not a pool API endpoint.",
    );
  if (url.protocol !== "https:" && !localOrTestPoolApiBase(url))
    throw new Error(
      "FAME pool API base URL must use HTTPS outside local/test.",
    );
  url.pathname = `${basePath}/fame/pool-quotes`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function logQuoteApiHelperUnavailable(options: {
  reason: string;
  category?: string;
  currentBlock?: number;
  poolCount?: number;
}): void {
  console.warn(
    JSON.stringify({
      event: "fame-pool-quote-api-unavailable",
      reason: options.reason,
      ...(options.category === undefined ? {} : { category: options.category }),
      ...(options.currentBlock === undefined
        ? {}
        : { currentBlock: options.currentBlock }),
      ...(options.poolCount === undefined
        ? {}
        : { poolCount: options.poolCount }),
    }),
  );
}

function quoteApiClientConfigFromEnv(
  options: ProductionFameQuoteDependenciesOptions,
): QuoteApiClientConfig {
  const baseUrl = optionalServerEnv("FAME_POOL_API_URL");
  const serviceToken = optionalServerEnv("FAME_POOL_STATE_SERVICE_TOKEN");
  if (!baseUrl || !serviceToken)
    return { client: null, configured: false, reason: "not_configured" };
  try {
    const maxFreshnessBlocks = optionalServerNonNegativeIntegerEnv(
      "FAME_POOL_QUOTE_MAX_FRESHNESS_BLOCKS",
    );
    return {
      client: createIndexedQuoteApiClient({
        endpointUrl: quoteEndpointUrlFromPoolApiBase(baseUrl),
        serviceToken,
        timeoutMs: quoteApiTimeoutForQuoteRequest(options),
      }),
      configured: true,
      reason: "not_configured",
      ...(maxFreshnessBlocks === undefined ? {} : { maxFreshnessBlocks }),
    };
  } catch {
    logQuoteApiHelperUnavailable({ reason: "invalid_config" });
    return { client: null, configured: true, reason: "invalid_config" };
  }
}

function quoteApiDebug(
  snapshot: FameQuoteApiDiagnosticsSnapshot,
  reason: QuoteApiHelperReason,
  poolCount?: number,
  selectedRoute?: FameQuoteApiSelectedRouteDebug,
): FameQuoteApiHelperDebug {
  return {
    ...snapshot,
    reason,
    ...(poolCount === undefined ? {} : { poolCount }),
    ...(selectedRoute === undefined ? {} : { selectedRoute }),
  };
}

async function maybeWrapIndexedQuoteAdapter(options: {
  adapter: FameAsyncQuoteAdapter;
  tokenIn: Address;
  tokenOut: Address;
  quoteApiClient: FamePoolQuoteClient | null;
  configured: boolean;
  unconfiguredReason: Extract<
    QuoteApiHelperReason,
    "not_configured" | "invalid_config"
  >;
  maxFreshnessBlocks?: number;
}): Promise<QuoteApiAdapterResult> {
  const diagnostics = createQuoteApiDiagnosticsRecorder(options.configured);
  const result = (
    adapter: FameAsyncQuoteAdapter,
    reason: QuoteApiHelperReason,
    poolCount?: number,
  ): QuoteApiAdapterResult => ({
    adapter,
    debug: (selectedRoute) =>
      quoteApiDebug(diagnostics.snapshot(), reason, poolCount, selectedRoute),
  });
  const context = options.adapter.quoteContext;
  if (!options.quoteApiClient)
    return result(options.adapter, options.unconfiguredReason);
  if (!context) return result(options.adapter, "adapter_context_unavailable");
  if (context.source !== "live" && context.source !== "fork")
    return result(options.adapter, "unsupported_adapter_context");
  if (context.blockNumber > BigInt(Number.MAX_SAFE_INTEGER))
    return result(options.adapter, "unsafe_block_number");
  const poolIds = famePoolStateRegistryPoolIdsForPair(
    options.tokenIn,
    options.tokenOut,
  ).filter((poolId) => famePoolSupportsCompactQuote(poolId));
  if (poolIds.length === 0)
    return result(options.adapter, "no_registered_pools", 0);
  const currentBlock = Number(context.blockNumber);
  return result(
    createIndexedQuoteApiAdapter({
      quoteClient: options.quoteApiClient,
      fallback: options.adapter,
      currentBlock,
      maxFreshnessBlocks: options.maxFreshnessBlocks,
      expectedSourceRegistryId: famePoolStateRegistrySourceId(),
      diagnostics,
      onBatchFailure: ({ category, currentBlock: failedAtBlock }) =>
        logQuoteApiHelperUnavailable({
          reason: "quote_api_batch_failed",
          category,
          currentBlock: failedAtBlock,
          poolCount: poolIds.length,
        }),
    }),
    "wrapped",
    poolIds.length,
  );
}

function quoteApiSelectedLegSource(
  leg: FameLegQuote,
): QuoteApiSelectedRouteLegDebug["source"] {
  const source = leg.quoteContext?.source;
  if (source === "indexed")
    return leg.indexedEvidence?.kind === "raw-replay"
      ? "raw_replay"
      : "compact_quote";
  if (source === "live") return "live";
  if (source === "fork") return "fork";
  if (source === "snapshot") return "snapshot";
  return "other";
}

function selectedQuoteApiEvidenceId(leg: FameLegQuote): string | undefined {
  if (leg.indexedEvidence?.evidenceId) return leg.indexedEvidence.evidenceId;
  return (
    /\bsnapshot\s+([A-Za-z0-9_.:-]+)/u.exec(leg.evidence)?.[1] ??
    /\bobserved through block\s+([0-9]+)/u.exec(leg.evidence)?.[1]
  );
}

function quoteApiSelectedRouteDebug(
  quote: FameSwapQuote,
): FameQuoteApiSelectedRouteDebug | undefined {
  if (quote.status !== "ready") return undefined;
  let compactQuoteLegs = 0;
  let liveLegs = 0;
  let otherLegs = 0;
  const legs = quote.feeBreakdown.legs.map((leg) => {
    const source = quoteApiSelectedLegSource(leg);
    if (source === "compact_quote") compactQuoteLegs += 1;
    else if (source === "live" || source === "fork") liveLegs += 1;
    else otherLegs += 1;
    return {
      poolId: leg.poolId,
      source,
      quoteContextSource: leg.quoteContext?.source,
      evidenceId:
        source === "compact_quote" || source === "raw_replay"
          ? selectedQuoteApiEvidenceId(leg)
          : undefined,
      currentBlock:
        leg.quoteContext?.source === "indexed"
          ? leg.quoteContext.currentBlock
          : undefined,
      sourceRegistryId:
        leg.quoteContext?.source === "indexed"
          ? leg.quoteContext.sourceRegistryId
          : undefined,
      effectiveMaxFreshnessBlocks:
        leg.quoteContext?.source === "indexed"
          ? leg.quoteContext.effectiveMaxFreshnessBlocks
          : undefined,
    };
  });
  const selectedPool = legs.find(
    (leg) => leg.poolId === FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  );
  const liveDependency = legs.find(
    (leg) => leg.poolId === FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
  );
  const selectedPoolSource = selectedPool?.source ?? "absent";
  const liveDependencySource = liveDependency?.source ?? "absent";
  const liveDependencyIsLive =
    liveDependencySource === "live" || liveDependencySource === "fork";
  const activation =
    !selectedPool && !liveDependency
      ? undefined
      : ({
          selectedPoolId: FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
          liveDependencyPoolId: FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
          selectedPoolSource,
          liveDependencySource,
          outcome:
            selectedPoolSource === "compact_quote" && liveDependencyIsLive
              ? "compact_quote_with_live_dependency"
              : selectedPoolSource === "raw_replay" && liveDependencyIsLive
                ? "raw_replay_with_live_dependency"
                : selectedPoolSource === "compact_quote"
                  ? "compact_quote_without_live_dependency"
                  : selectedPoolSource === "raw_replay"
                    ? "raw_replay_without_live_dependency"
                    : selectedPool
                      ? "selected_pool_live_fallback"
                      : "live_dependency_without_selected_pool",
        } satisfies QuoteApiSelectedRouteActivationDebug);
  return {
    compactQuoteLegs,
    liveLegs,
    otherLegs,
    ...(activation === undefined ? {} : { activation }),
    legs,
  };
}

async function productionReadinessForQuote(
  routerAddress: Address | null,
): Promise<FameSwapReadiness> {
  const config = { ...getFameSwapConfig(), routerAddress };
  const staticResult = staticReadiness(config);
  const rpcUrl = baseRpcUrl();
  if (staticResult.status === "not_live_ready" || !rpcUrl) return staticResult;
  const cacheKey = `${routerAddress}:${config.expectedPinnedBaseBlock}:${config.expectedSolverRoutesHash}:${config.expectedPoolsHash}`;
  const cached = readinessCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return await cached.value;
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl, {
      batch: true,
      retryCount: 0,
      timeout: QUOTE_RPC_TIMEOUT_MS,
    }),
    batch: { multicall: true },
  });
  const reader: RouterPolicyReader = {
    read: async (address): Promise<RouterPolicySnapshot> => {
      const requiredFamilyOrdinals = [
        ...new Set(
          FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(
            (target) => target.familyOrdinal,
          ),
        ),
      ];
      const [feePpm, familyResults, targetResults, hookDataResults] =
        await Promise.all([
          client.readContract({
            address,
            abi: fameRouterAbi,
            functionName: "feePpm",
          }),
          Promise.all(
            requiredFamilyOrdinals.map(
              async (familyOrdinal) =>
                [
                  familyOrdinal,
                  await client.readContract({
                    address,
                    abi: fameRouterAbi,
                    functionName: "venueFamilyEnabled",
                    args: [familyOrdinal],
                  }),
                ] as const,
            ),
          ),
          Promise.all(
            FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(
              async (target) =>
                [
                  routerPolicyTargetKey(target.familyOrdinal, target.target),
                  await client.readContract({
                    address,
                    abi: fameRouterAbi,
                    functionName: "venueTargetEnabled",
                    args: [target.familyOrdinal, target.target],
                  }),
                ] as const,
            ),
          ),
          Promise.all(
            FAME_SWAP_ARTIFACT_MANIFEST.requiredV4HookDataKeys.map(
              async (key) =>
                [
                  key.toLowerCase(),
                  await client.readContract({
                    address,
                    abi: fameRouterAbi,
                    functionName: "v4HookDataHashEnabled",
                    args: [key],
                  }),
                ] as const,
            ),
          ),
        ]);
      const venueFamilies = new Map<number, boolean>();
      for (const [ordinal, enabled] of familyResults)
        if (!venueFamilies.has(ordinal))
          venueFamilies.set(ordinal, Boolean(enabled));
      return {
        feePpm: typeof feePpm === "bigint" ? feePpm : BigInt(feePpm),
        venueFamilies,
        venueTargets: new Map(
          targetResults.map(([key, enabled]) => [key, Boolean(enabled)]),
        ),
        v4HookDataKeys: new Map(
          hookDataResults.map(([key, enabled]) => [key, Boolean(enabled)]),
        ),
      };
    },
  };
  const value = liveReadiness(config, reader);
  readinessCache.set(cacheKey, {
    expiresAt: Date.now() + READINESS_CACHE_TTL_MS,
    value,
  });
  const readiness = await value;
  readinessCache.set(cacheKey, {
    expiresAt: Date.now() + READINESS_CACHE_TTL_MS,
    value: readiness,
  });
  return readiness;
}

function publicClientForQuote() {
  const rpcUrl = baseRpcUrl();
  return rpcUrl
    ? createPublicClient({
        chain: base,
        transport: http(rpcUrl, {
          batch: true,
          retryCount: 0,
          timeout: QUOTE_RPC_TIMEOUT_MS,
        }),
        batch: { multicall: true },
      })
    : null;
}

/**
 * Server-only dependency factory shared by the route and the cached market
 * projections. The caller supplies test seams only; production callers supply
 * their readiness and adapter builders here once, rather than rebuilding quote
 * execution in each consumer.
 */
export function createProductionFameQuoteDependencies(
  options: ProductionFameQuoteDependenciesOptions = {},
): ProductionFameQuoteDependencies {
  let quoteApiDebugForResult:
    | ((quote: FameSwapQuote) => FameQuoteApiHelperDebug)
    | undefined;
  const createAdapter =
    options.createAdapter ??
    (async (request) => {
      const quoteClient = options.quoteAdapterForRequest
        ? null
        : publicClientForQuote();
      const quoteApiClientConfig = fameForkModeEnabled()
        ? { client: null, configured: false, reason: "not_configured" as const }
        : options.quoteApiClient === undefined
          ? quoteApiClientConfigFromEnv(options)
          : {
              client: options.quoteApiClient,
              configured: options.quoteApiClient !== null,
              reason: "not_configured" as const,
            };
      const adapter = options.quoteAdapterForRequest
        ? await options.quoteAdapterForRequest(request)
        : quoteClient
          ? await createLiveLiquidityQuoteAdapter({
              client: {
                getBlockNumber: () => quoteClient.getBlockNumber(),
                readContract: (adapterRequest) =>
                  quoteClient.readContract(
                    adapterRequest as Parameters<
                      typeof quoteClient.readContract
                    >[0],
                  ) as Promise<unknown>,
              },
              chainId: base.id,
              readTimeoutMs: readTimeoutForQuoteRequest(options),
            }).catch((error) =>
              unavailableLiveAsyncQuoteAdapter(
                `Live quote adapter setup failed: ${displaySafeDiagnosticMessage(error)}`,
              ),
            )
          : unavailableLiveAsyncQuoteAdapter(
              "Base RPC is not configured for live liquidity quotes.",
            );
      const indexedAdapter = await maybeWrapIndexedQuoteAdapter({
        adapter,
        tokenIn: request.tokenIn.address,
        tokenOut: request.tokenOut.address,
        quoteApiClient: quoteApiClientConfig.client,
        configured: quoteApiClientConfig.configured,
        unconfiguredReason: quoteApiClientConfig.reason,
        maxFreshnessBlocks: quoteApiClientConfig.maxFreshnessBlocks,
      });
      quoteApiDebugForResult = (quote) =>
        indexedAdapter.debug(quoteApiSelectedRouteDebug(quote));
      return indexedAdapter.adapter;
    });
  return {
    readinessForQuote: options.readinessForQuote ?? productionReadinessForQuote,
    createAdapter,
    ...(options.quoteForRequest
      ? { quoteForRequest: options.quoteForRequest }
      : {}),
    quoteApiDebugForResult: (quote) => quoteApiDebugForResult?.(quote),
  };
}

function quoteRequest(
  request: FameExactInputQuoteRequest,
  config: FameSwapConfig,
): Omit<FameSwapQuoteRequest, "readiness"> {
  return {
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    amountIn: request.amountIn,
    recipient: request.recipient,
    config,
    deadlineSeconds: request.deadlineSeconds,
    requestedRouteId: request.requestedRouteId,
  };
}

export async function quoteFameExactInput(
  request: FameExactInputQuoteRequest,
  dependencies: FameExactInputQuoteDependencies,
): Promise<FameSwapQuote> {
  const config = request.config ?? getFameSwapConfig();
  const readiness = await dependencies.readinessForQuote(config.routerAddress);
  const prepared = {
    ...quoteRequest(request, config),
    optimizerBudgets: request.optimizerBudgets,
    readiness,
  };
  if (dependencies.quoteForRequest) {
    return await dependencies.quoteForRequest(prepared);
  }
  if (readiness.status !== "ready" || !dependencies.createAdapter) {
    return quoteFameSwap(prepared);
  }
  return await quoteFameSwapAsync({
    ...prepared,
    adapter: await dependencies.createAdapter(prepared),
  });
}

export interface FameExactTargetSearchRange {
  minimumInput: bigint;
  maximumInput: bigint;
  precision: bigint;
}

export interface FameExactTargetQuoteRequest {
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  targetOutput: bigint;
  recipient: Address | null;
  range: FameExactTargetSearchRange;
  signal: AbortSignal;
  timeoutMs: number;
  maxEvaluations?: number;
  maxRpcReads?: number;
  rpcReads?: () => number;
  deadlineSeconds?: bigint;
  slippageBps?: number;
  requestedRouteId?: string;
}

export type FameExactTargetQuote = FameTargetOutputSolverResult;

export interface FameExactTargetQuoteDependencies {
  readinessForQuote: (
    routerAddress: Address | null,
  ) => FameSwapReadiness | Promise<FameSwapReadiness>;
  createAdapter: (options: {
    signal: AbortSignal;
    timeoutMs: number;
  }) => FameAsyncQuoteAdapter | Promise<FameAsyncQuoteAdapter>;
  config?: FameSwapConfig;
  now?: () => number;
}

function blockedTargetResult(message: string): FameExactTargetQuote {
  return {
    status: "route_unavailable",
    message,
    stats: {
      evaluations: 0,
      evaluationLimit: 0,
      unavailableEvaluations: 0,
      topologyAttempts: 0,
      rpcReads: 0,
      elapsedMs: 0,
      retainedWitness: false,
    },
  };
}

/**
 * Finds a bounded maximum input for an exact FAME output without creating a
 * public target-output API.  Native ETH remains the supplied token identity;
 * callers must pass NATIVE_ETH_ADDRESS rather than WETH when they want ETH.
 */
export async function quoteFameExactTarget(
  request: FameExactTargetQuoteRequest,
  dependencies: FameExactTargetQuoteDependencies,
): Promise<FameExactTargetQuote> {
  const config = dependencies.config ?? getFameSwapConfig();
  const readiness = await dependencies.readinessForQuote(config.routerAddress);
  if (readiness.status !== "ready")
    return blockedTargetResult(readiness.message);

  const candidates = routeCandidatesForPair(
    request.tokenIn.address,
    request.tokenOut.address,
  ).candidates;
  const selectedTopology = request.requestedRouteId
    ? candidates.find((candidate) => candidate.id === request.requestedRouteId)
    : candidates[0];
  if (!selectedTopology) {
    return blockedTargetResult("No safe route is available for this target.");
  }

  const adapter = await dependencies.createAdapter({
    signal: request.signal,
    timeoutMs: request.timeoutMs,
  });
  const expectedContext = adapter.quoteContext;
  if (!expectedContext || !isPinnedBaseContext(expectedContext)) {
    return blockedTargetResult("The live quote context is unavailable.");
  }
  const now = dependencies.now ?? Date.now;
  const deadline =
    BigInt(Math.floor(now() / 1_000)) + (request.deadlineSeconds ?? 600n);
  return await solveFameTargetOutput({
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    selectedTopology,
    fallbackTopologies: request.requestedRouteId ? [] : candidates.slice(1),
    targetOutput: request.targetOutput,
    minimumInput: request.range.minimumInput,
    maximumInput: request.range.maximumInput,
    precision: request.range.precision,
    routerAddress: readiness.routerAddress,
    recipient: request.recipient ?? FAME_SWAP_PREVIEW_RECIPIENT,
    deadline,
    feePpm: readiness.feePpm,
    slippageBps: request.slippageBps ?? config.defaultSlippageBps,
    adapter,
    expectedContext,
    timeoutMs: request.timeoutMs,
    maxEvaluations: request.maxEvaluations,
    maxRpcReads: request.maxRpcReads,
    rpcReads: request.rpcReads,
    signal: request.signal,
    startedAtMs: now(),
    now,
  });
}

function isPinnedBaseContext(context: FameQuoteContext): boolean {
  return (
    (context.source === "live" || context.source === "fork") &&
    context.chainId === base.id
  );
}

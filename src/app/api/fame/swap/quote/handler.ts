import { NextRequest } from "next/server";
import { createPublicClient, http, isAddress, type Address } from "viem";
import { base } from "viem/chains";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "@/features/fame-swap/artifacts/manifest";
import { getFameSwapConfig } from "@/features/fame-swap/config";
import { routeArtifactById } from "@/features/fame-swap/solver/artifacts";
import { fameRouterAbi } from "@/features/fame-swap/router/abi";
import {
  quoteFameSwap,
  quoteFameSwapAsync,
} from "@/features/fame-swap/solver/quote";
import { DEFAULT_FAME_OPTIMIZER_BUDGETS } from "@/features/fame-swap/solver/optimizer/runContext";
import {
  famePoolStateRegistryPoolIdsForPair,
  famePoolStateRegistrySourceId,
  famePoolSupportsCompactQuote,
} from "@/features/fame-swap/solver/poolStateRegistry";
import {
  FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
} from "@/features/fame-swap/solver/poolActivationLedger";
import { serializeFameSwapQuoteResponse } from "@/features/fame-swap/solver/quoteWire";
import type {
  FameAsyncQuoteAdapter,
  FameLegQuote,
} from "@/features/fame-swap/solver/quotes/adapters";
import {
  createIndexedQuoteApiClient,
  type FamePoolQuoteClient,
} from "@/features/fame-swap/solver/quotes/indexedQuoteApiClient";
import {
  createIndexedQuoteApiAdapter,
  createQuoteApiDiagnosticsRecorder,
  type FameQuoteApiDiagnosticsSnapshot,
} from "@/features/fame-swap/solver/quotes/indexedQuoteApiAdapter";
import {
  createLiveLiquidityQuoteAdapter,
  unavailableLiveAsyncQuoteAdapter,
} from "@/features/fame-swap/solver/quotes/liveAdapters";
import {
  liveReadiness,
  routerPolicyTargetKey,
  staticReadiness,
  type RouterPolicyReader,
  type RouterPolicySnapshot,
} from "@/features/fame-swap/solver/readiness";
import { normalizeSlippageBps } from "@/features/fame-swap/solver/slippage";
import { deadlineMinutesToSeconds } from "@/features/fame-swap/solver/deadline";
import { displaySafeDiagnosticMessage } from "@/features/fame-swap/solver/diagnostics";
import { tokenForAddress } from "@/features/fame-swap/tokens";
import type {
  FameSwapQuote,
  FameSwapQuoteRequest,
  FameSwapReadiness,
} from "@/features/fame-swap/solver/types";

const MAX_JSON_BODY_BYTES = 4_096;
const MAX_UINT256 = (1n << 256n) - 1n;
const QUOTE_RPC_TIMEOUT_MS = 8_000;
const QUOTE_REQUEST_TIMEOUT_MS = 15_000;
const QUOTE_RESPONSE_CUSHION_MS = 1_500;
const QUOTE_API_DEFAULT_TIMEOUT_MS = 2_500;
const QUOTE_API_MAX_TIMEOUT_MS = 4_000;
const QUOTE_API_MIN_TIMEOUT_MS = 250;
const QUOTE_API_LIVE_FALLBACK_RESERVE_MS = 6_000;
const READINESS_CACHE_TTL_MS = 5_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 90;

interface ParsedQuoteBody {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  recipient: Address | null;
  routerAddress?: Address;
  slippageBps?: number;
  deadlineMinutes?: number;
  routeId?: string;
  includeDebug: boolean;
}

interface FameSwapQuotePostDependencies {
  readinessForQuote?: (
    routerAddress: Address | null,
  ) => FameSwapReadiness | Promise<FameSwapReadiness>;
  quoteForRequest?: (
    request: FameSwapQuoteRequest & { readiness: FameSwapReadiness },
  ) => FameSwapQuote | Promise<FameSwapQuote>;
  quoteAdapterForRequest?: (
    request: FameSwapQuoteRequest & { readiness: FameSwapReadiness },
  ) => FameAsyncQuoteAdapter | Promise<FameAsyncQuoteAdapter>;
  quoteApiClient?: FamePoolQuoteClient | null;
}

type QuoteApiHelperReason =
  | "not_configured"
  | "invalid_config"
  | "adapter_context_unavailable"
  | "unsupported_adapter_context"
  | "unsafe_block_number"
  | "no_registered_pools"
  | "wrapped";

interface QuoteApiHelperDebug extends FameQuoteApiDiagnosticsSnapshot {
  reason: QuoteApiHelperReason;
  poolCount?: number;
  selectedRoute?: QuoteApiSelectedRouteDebug;
}

interface QuoteApiAdapterResult {
  adapter: FameAsyncQuoteAdapter;
  debug(selectedRoute?: QuoteApiSelectedRouteDebug): QuoteApiHelperDebug;
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

interface QuoteApiSelectedRouteDebug {
  compactQuoteLegs: number;
  liveLegs: number;
  otherLegs: number;
  activation?: QuoteApiSelectedRouteActivationDebug;
  legs: QuoteApiSelectedRouteLegDebug[];
}

const readinessCache = new Map<
  string,
  { expiresAt: number; value: Promise<FameSwapReadiness> | FameSwapReadiness }
>();
const rateLimitBuckets = new Map<string, { resetAt: number; count: number }>();

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
    {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    },
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function bodyTooLarge(request: NextRequest): boolean {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;

  const parsed = Number(contentLength);
  return Number.isFinite(parsed) && parsed > MAX_JSON_BODY_BYTES;
}

function clientRateLimitKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local"
  );
}

function rateLimited(request: NextRequest): boolean {
  const now = Date.now();
  const key = clientRateLimitKey(request);
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, {
      resetAt: now + RATE_LIMIT_WINDOW_MS,
      count: 1,
    });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function parseQuoteBody(value: unknown): ParsedQuoteBody | string {
  const body = asRecord(value);
  if (!body) return "Expected a JSON quote request object.";

  if (typeof body.tokenIn !== "string" || !isAddress(body.tokenIn)) {
    return "tokenIn must be an address.";
  }
  if (typeof body.tokenOut !== "string" || !isAddress(body.tokenOut)) {
    return "tokenOut must be an address.";
  }
  if (
    typeof body.amountIn !== "string" ||
    !/^[0-9]+$/.test(body.amountIn) ||
    body.amountIn.length > 78
  ) {
    return "amountIn must be a raw integer string.";
  }

  const amountIn = BigInt(body.amountIn);
  if (amountIn > MAX_UINT256) {
    return "amountIn must fit within uint256.";
  }

  if (body.routeId !== undefined) {
    if (
      typeof body.routeId !== "string" ||
      body.routeId.length > 160 ||
      !/^[A-Za-z0-9_.:-]+$/u.test(body.routeId) ||
      !routeArtifactById(body.routeId)
    ) {
      return "routeId must be a pinned route artifact id.";
    }
  }

  if (body.recipient !== undefined && body.recipient !== null) {
    if (typeof body.recipient !== "string" || !isAddress(body.recipient)) {
      return "recipient must be an address when provided.";
    }
  }

  if (body.routerAddress !== undefined) {
    if (
      typeof body.routerAddress !== "string" ||
      !isAddress(body.routerAddress)
    ) {
      return "routerAddress overrides are not supported.";
    }
  }

  return {
    tokenIn: body.tokenIn as Address,
    tokenOut: body.tokenOut as Address,
    amountIn,
    recipient:
      typeof body.recipient === "string" && isAddress(body.recipient)
        ? (body.recipient as Address)
        : null,
    routerAddress:
      typeof body.routerAddress === "string" && isAddress(body.routerAddress)
        ? (body.routerAddress as Address)
        : undefined,
    slippageBps:
      typeof body.slippageBps === "number" && Number.isFinite(body.slippageBps)
        ? body.slippageBps
        : undefined,
    deadlineMinutes:
      typeof body.deadlineMinutes === "number" &&
      Number.isFinite(body.deadlineMinutes)
        ? body.deadlineMinutes
        : undefined,
    routeId: typeof body.routeId === "string" ? body.routeId : undefined,
    includeDebug: body.includeDebug === true,
  };
}

function displaySafeErrorMessage(error: unknown): string {
  return displaySafeDiagnosticMessage(error);
}

function baseRpcUrl(): string | undefined {
  return process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function remainingQuoteTimeMs(startedAtMs: number): number {
  return Math.max(
    0,
    QUOTE_REQUEST_TIMEOUT_MS -
      (Date.now() - startedAtMs) -
      QUOTE_RESPONSE_CUSHION_MS,
  );
}

function optimizerBudgetsForQuoteRequest(
  startedAtMs: number,
): FameSwapQuoteRequest["optimizerBudgets"] {
  return {
    timeoutMs: Math.min(
      DEFAULT_FAME_OPTIMIZER_BUDGETS.timeoutMs,
      remainingQuoteTimeMs(startedAtMs),
    ),
  };
}

function readTimeoutForQuoteRequest(startedAtMs: number): number {
  return Math.max(
    250,
    Math.min(QUOTE_RPC_TIMEOUT_MS, remainingQuoteTimeMs(startedAtMs)),
  );
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

function quoteApiTimeoutForQuoteRequest(startedAtMs: number): number {
  const configured =
    optionalServerNonNegativeIntegerEnv("FAME_POOL_QUOTE_TIMEOUT_MS") ??
    QUOTE_API_DEFAULT_TIMEOUT_MS;
  const configuredBudget = Math.min(configured, QUOTE_API_MAX_TIMEOUT_MS);
  const helperBudget = Math.max(
    QUOTE_API_MIN_TIMEOUT_MS,
    remainingQuoteTimeMs(startedAtMs) - QUOTE_API_LIVE_FALLBACK_RESERVE_MS,
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

function assertSafePoolApiBaseUrl(rawBaseUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawBaseUrl);
  } catch {
    throw new Error("FAME pool API base URL is invalid.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "FAME pool API base URL must not include credentials, query, or hash.",
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
    throw new Error(
      "FAME pool API base URL must use HTTPS outside local/test.",
    );
  }
  return url;
}

function quoteEndpointUrlFromPoolApiBase(rawBaseUrl: string): string {
  const url = assertSafePoolApiBaseUrl(rawBaseUrl);
  const basePath = url.pathname.replace(/\/+$/u, "");
  url.pathname = `${basePath}/fame/pool-quotes`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function quoteApiClientConfigFromEnv(
  startedAtMs: number,
): QuoteApiClientConfig {
  const baseUrl = optionalServerEnv("FAME_POOL_API_URL");
  const serviceToken = optionalServerEnv("FAME_POOL_STATE_SERVICE_TOKEN");
  if (!baseUrl || !serviceToken) {
    return {
      client: null,
      configured: false,
      reason: "not_configured",
    };
  }

  try {
    const timeoutMs = quoteApiTimeoutForQuoteRequest(startedAtMs);
    const maxFreshnessBlocks = optionalServerNonNegativeIntegerEnv(
      "FAME_POOL_QUOTE_MAX_FRESHNESS_BLOCKS",
    );
    return {
      client: createIndexedQuoteApiClient({
        endpointUrl: quoteEndpointUrlFromPoolApiBase(baseUrl),
        serviceToken,
        timeoutMs,
      }),
      configured: true,
      reason: "not_configured",
      ...(maxFreshnessBlocks === undefined ? {} : { maxFreshnessBlocks }),
    };
  } catch {
    logQuoteApiHelperUnavailable({ reason: "invalid_config" });
    return {
      client: null,
      configured: true,
      reason: "invalid_config",
    };
  }
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

function quoteApiDebug(
  snapshot: FameQuoteApiDiagnosticsSnapshot,
  reason: QuoteApiHelperReason,
  poolCount?: number,
  selectedRoute?: QuoteApiSelectedRouteDebug,
): QuoteApiHelperDebug {
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
    debug(selectedRoute) {
      return quoteApiDebug(
        diagnostics.snapshot(),
        reason,
        poolCount,
        selectedRoute,
      );
    },
  });

  const context = options.adapter.quoteContext;
  if (!options.quoteApiClient) {
    return result(options.adapter, options.unconfiguredReason);
  }
  if (!context) {
    return result(options.adapter, "adapter_context_unavailable");
  }
  if (context.source !== "live" && context.source !== "fork") {
    return result(options.adapter, "unsupported_adapter_context");
  }
  if (context.blockNumber > BigInt(Number.MAX_SAFE_INTEGER)) {
    return result(options.adapter, "unsafe_block_number");
  }

  const poolIds = famePoolStateRegistryPoolIdsForPair(
    options.tokenIn,
    options.tokenOut,
  ).filter((poolId) => famePoolSupportsCompactQuote(poolId));
  if (poolIds.length === 0) {
    return result(options.adapter, "no_registered_pools", 0);
  }

  const currentBlock = Number(context.blockNumber);
  const wrappedAdapter = createIndexedQuoteApiAdapter({
    quoteClient: options.quoteApiClient,
    fallback: options.adapter,
    currentBlock,
    maxFreshnessBlocks: options.maxFreshnessBlocks,
    expectedSourceRegistryId: famePoolStateRegistrySourceId(),
    diagnostics,
    onBatchFailure: ({ category, currentBlock: failedAtBlock }) => {
      logQuoteApiHelperUnavailable({
        reason: "quote_api_batch_failed",
        category,
        currentBlock: failedAtBlock,
        poolCount: poolIds.length,
      });
    },
  });

  return result(wrappedAdapter, "wrapped", poolIds.length);
}

function quoteApiSelectedLegSource(
  leg: FameLegQuote,
): QuoteApiSelectedRouteLegDebug["source"] {
  const source = leg.quoteContext?.source;
  if (source === "indexed") {
    return leg.indexedEvidence?.kind === "raw-replay"
      ? "raw_replay"
      : "compact_quote";
  }
  if (source === "live") return "live";
  if (source === "fork") return "fork";
  if (source === "snapshot") return "snapshot";
  return "other";
}

function selectedQuoteApiEvidenceId(leg: FameLegQuote): string | undefined {
  if (leg.indexedEvidence?.evidenceId) return leg.indexedEvidence.evidenceId;
  const snapshotMatch = /\bsnapshot\s+([A-Za-z0-9_.:-]+)/u.exec(leg.evidence);
  if (snapshotMatch?.[1]) return snapshotMatch[1];
  const blockMatch = /\bobserved through block\s+([0-9]+)/u.exec(leg.evidence);
  if (blockMatch?.[1]) return blockMatch[1];
  return undefined;
}

function quoteApiSelectedRouteActivationDebug(
  legs: readonly QuoteApiSelectedRouteLegDebug[],
): QuoteApiSelectedRouteActivationDebug | undefined {
  const selectedPool = legs.find(
    (leg) => leg.poolId === FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  );
  const liveDependency = legs.find(
    (leg) => leg.poolId === FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
  );
  if (!selectedPool && !liveDependency) return undefined;

  const selectedPoolSource = selectedPool?.source ?? "absent";
  const liveDependencySource = liveDependency?.source ?? "absent";
  const liveDependencyIsLive =
    liveDependencySource === "live" || liveDependencySource === "fork";
  const outcome =
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
              : "live_dependency_without_selected_pool";

  return {
    selectedPoolId: FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
    liveDependencyPoolId: FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
    selectedPoolSource,
    liveDependencySource,
    outcome,
  };
}

function quoteApiSelectedRouteDebug(
  quote: FameSwapQuote,
): QuoteApiSelectedRouteDebug | undefined {
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
  const activation = quoteApiSelectedRouteActivationDebug(legs);

  return {
    compactQuoteLegs,
    liveLegs,
    otherLegs,
    ...(activation === undefined ? {} : { activation }),
    legs,
  };
}

async function readinessForQuote(routerAddress: Address | null) {
  const config = {
    ...getFameSwapConfig(),
    routerAddress,
  };
  const staticResult = staticReadiness(config);
  const rpcUrl = baseRpcUrl();

  if (staticResult.status === "not_live_ready" || !rpcUrl) {
    return staticResult;
  }

  const cacheKey = `${routerAddress}:${config.expectedPinnedBaseBlock}:${config.expectedSolverRoutesHash}:${config.expectedPoolsHash}`;
  const cached = readinessCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl, {
      batch: true,
      retryCount: 0,
      timeout: QUOTE_RPC_TIMEOUT_MS,
    }),
    batch: {
      multicall: true,
    },
  });
  const reader: RouterPolicyReader = {
    read: async (address): Promise<RouterPolicySnapshot> => {
      const feePpmPromise = client.readContract({
        address,
        abi: fameRouterAbi,
        functionName: "feePpm",
      });
      const requiredFamilyOrdinals = [
        ...new Set(
          FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(
            (target) => target.familyOrdinal,
          ),
        ),
      ];

      const familyResultPromises = requiredFamilyOrdinals.map(
        async (familyOrdinal) => {
          const enabled = await client.readContract({
            address,
            abi: fameRouterAbi,
            functionName: "venueFamilyEnabled",
            args: [familyOrdinal],
          });
          return [familyOrdinal, enabled] as const;
        },
      );

      const targetResultPromises =
        FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(async (target) => {
          const enabled = await client.readContract({
            address,
            abi: fameRouterAbi,
            functionName: "venueTargetEnabled",
            args: [target.familyOrdinal, target.target],
          });
          return [
            routerPolicyTargetKey(target.familyOrdinal, target.target),
            enabled,
          ] as const;
        });

      const hookDataResultPromises =
        FAME_SWAP_ARTIFACT_MANIFEST.requiredV4HookDataKeys.map(async (key) => {
          const enabled = await client.readContract({
            address,
            abi: fameRouterAbi,
            functionName: "v4HookDataHashEnabled",
            args: [key],
          });
          return [key.toLowerCase(), enabled] as const;
        });

      const [feePpm, familyResults, targetResults, hookDataResults] =
        await Promise.all([
          feePpmPromise,
          Promise.all(familyResultPromises),
          Promise.all(targetResultPromises),
          Promise.all(hookDataResultPromises),
        ]);

      const venueFamilies = new Map<number, boolean>();
      for (const [familyOrdinal, enabled] of familyResults) {
        if (!venueFamilies.has(familyOrdinal)) {
          venueFamilies.set(familyOrdinal, Boolean(enabled));
        }
      }

      const venueTargets = new Map<string, boolean>(
        targetResults.map(([key, enabled]) => [key, Boolean(enabled)]),
      );
      const v4HookDataKeys = new Map<string, boolean>(
        hookDataResults.map(([key, enabled]) => [key, Boolean(enabled)]),
      );

      return {
        feePpm: typeof feePpm === "bigint" ? feePpm : BigInt(feePpm),
        venueFamilies,
        venueTargets,
        v4HookDataKeys,
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

function localQuoteDebugAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const hostname = request.nextUrl.hostname.toLowerCase();
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function publicClientForQuote() {
  const rpcUrl = baseRpcUrl();
  if (!rpcUrl) return null;

  return createPublicClient({
    chain: base,
    transport: http(rpcUrl, {
      batch: true,
      retryCount: 0,
      timeout: QUOTE_RPC_TIMEOUT_MS,
    }),
    batch: {
      multicall: true,
    },
  });
}

export async function handleFameSwapQuotePost(
  request: NextRequest,
  deps: FameSwapQuotePostDependencies = {},
): Promise<Response> {
  const requestStartedAtMs = Date.now();
  if (bodyTooLarge(request)) {
    return json({ error: "Quote request body is too large." }, { status: 413 });
  }
  if (rateLimited(request)) {
    return json({ error: "Too many FAME quote requests." }, { status: 429 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return json({ error: "Expected a JSON quote request." }, { status: 400 });
  }

  const parsedBody = parseQuoteBody(bodyJson);
  if (typeof parsedBody === "string") {
    return json({ error: parsedBody }, { status: 400 });
  }

  const tokenIn = tokenForAddress(parsedBody.tokenIn);
  const tokenOut = tokenForAddress(parsedBody.tokenOut);
  if (!tokenIn || !tokenOut) {
    return json({ error: "Unsupported FAME swap token." }, { status: 400 });
  }

  const recipient = parsedBody.recipient;
  const configuredRouterAddress = getFameSwapConfig().routerAddress;
  if (
    parsedBody.routerAddress &&
    parsedBody.routerAddress.toLowerCase() !==
      configuredRouterAddress?.toLowerCase()
  ) {
    return json(
      { error: "routerAddress overrides are not supported." },
      { status: 400 },
    );
  }
  const routerAddress = configuredRouterAddress;
  const config = {
    ...getFameSwapConfig(),
    routerAddress,
    defaultSlippageBps: normalizeSlippageBps(
      parsedBody.slippageBps ?? getFameSwapConfig().defaultSlippageBps,
    ),
  };
  const quoteRequest: Omit<FameSwapQuoteRequest, "readiness"> = {
    tokenIn,
    tokenOut,
    amountIn: parsedBody.amountIn,
    recipient,
    config,
    deadlineSeconds:
      typeof parsedBody.deadlineMinutes === "number"
        ? deadlineMinutesToSeconds(parsedBody.deadlineMinutes)
        : undefined,
    requestedRouteId: parsedBody.routeId,
  };

  let quoteApiDebugOutput: QuoteApiHelperDebug | undefined;
  const quote = await withTimeout(
    (async (): Promise<FameSwapQuote> => {
      const resolveReadiness = deps.readinessForQuote ?? readinessForQuote;
      const readinessPromise = Promise.resolve(resolveReadiness(routerAddress));
      const quoteClient =
        deps.quoteForRequest || deps.quoteAdapterForRequest
          ? null
          : publicClientForQuote();
      const quoteApiClientConfig =
        deps.quoteApiClient === undefined
          ? quoteApiClientConfigFromEnv(requestStartedAtMs)
          : {
              client: deps.quoteApiClient,
              configured: deps.quoteApiClient !== null,
              reason: "not_configured" as const,
            };
      const adapterPromise = deps.quoteAdapterForRequest
        ? readinessPromise.then((readiness) =>
            deps.quoteAdapterForRequest!({
              ...quoteRequest,
              optimizerBudgets:
                optimizerBudgetsForQuoteRequest(requestStartedAtMs),
              readiness,
            }),
          )
        : quoteClient
          ? createLiveLiquidityQuoteAdapter({
              client: {
                getBlockNumber: () => quoteClient.getBlockNumber(),
                readContract: (quoteRequest) =>
                  quoteClient.readContract(
                    quoteRequest as Parameters<
                      typeof quoteClient.readContract
                    >[0],
                  ) as Promise<unknown>,
              },
              chainId: base.id,
              readTimeoutMs: readTimeoutForQuoteRequest(requestStartedAtMs),
            }).catch((error) =>
              unavailableLiveAsyncQuoteAdapter(
                `Live quote adapter setup failed: ${displaySafeErrorMessage(
                  error,
                )}`,
              ),
            )
          : Promise.resolve(
              unavailableLiveAsyncQuoteAdapter(
                "Base RPC is not configured for live liquidity quotes.",
              ),
            );
      const readiness = await readinessPromise;
      if (deps.quoteForRequest) {
        return await deps.quoteForRequest({
          ...quoteRequest,
          optimizerBudgets: optimizerBudgetsForQuoteRequest(requestStartedAtMs),
          readiness,
        });
      }

      if (readiness.status === "ready") {
        const indexedAdapter = await maybeWrapIndexedQuoteAdapter({
          adapter: await adapterPromise,
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          quoteApiClient: quoteApiClientConfig.client,
          configured: quoteApiClientConfig.configured,
          unconfiguredReason: quoteApiClientConfig.reason,
          maxFreshnessBlocks: quoteApiClientConfig.maxFreshnessBlocks,
        });
        const quote = await quoteFameSwapAsync({
          ...quoteRequest,
          optimizerBudgets: optimizerBudgetsForQuoteRequest(requestStartedAtMs),
          readiness,
          adapter: indexedAdapter.adapter,
        });
        quoteApiDebugOutput = indexedAdapter.debug(
          quoteApiSelectedRouteDebug(quote),
        );
        return quote;
      }

      return quoteFameSwap({
        ...quoteRequest,
        optimizerBudgets: optimizerBudgetsForQuoteRequest(requestStartedAtMs),
        readiness,
      });
    })(),
    QUOTE_REQUEST_TIMEOUT_MS,
    `FAME quote request timed out after ${QUOTE_REQUEST_TIMEOUT_MS}ms`,
  ).catch((error): FameSwapQuote => {
    const message = displaySafeErrorMessage(error);
    return {
      status: "quote_adapter_failure",
      tokenIn,
      tokenOut,
      requestedAmountIn: parsedBody.amountIn,
      rejectedCandidates: [
        {
          candidateId: "api-runner",
          reason: "adapter_failure",
          message,
        },
      ],
      message,
      diagnosticsVisibleByDefault: true,
    };
  });

  const includeLocalDebug =
    parsedBody.includeDebug && localQuoteDebugAllowed(request);

  return json({
    ...serializeFameSwapQuoteResponse(quote, {
      includeDebug: includeLocalDebug,
      debug:
        includeLocalDebug && quoteApiDebugOutput
          ? {
              quoteApi: quoteApiDebugOutput,
            }
          : undefined,
    }),
    ...(parsedBody.includeDebug && !includeLocalDebug
      ? { debugUnavailable: { reason: "local_dev_only" } }
      : {}),
  });
}

import {
  createPublicClient,
  decodeFunctionResult,
  encodeFunctionData,
  http,
  isAddress,
  type Address,
} from "viem";
import { simulateCalls } from "viem/actions";
import { base } from "viem/chains";
import { fameRouterAbi } from "../src/features/fame-swap/router/abi";
import { hashFameRoute } from "../src/features/fame-swap/router/encodeRoute";
import { erc20ApprovalAbi } from "../src/features/fame-swap/router/erc20Abi";
import { quoteFameSwapAsync } from "../src/features/fame-swap/solver/quote";
import {
  routeCandidatesForPair,
  type FameRouteCandidateBudgets,
} from "../src/features/fame-swap/solver/graph/candidates";
import type {
  FameRouteCandidateRejected,
  FameRouteCandidateSet,
} from "../src/features/fame-swap/solver/graph/routePlan";
import {
  buildFameRouteEdgeMatrix,
  buildFameRouteProtocolCoverage,
  type FameRouteEdgeMatrixRow,
  type FameRouteProtocolCoverageRow,
} from "../src/features/fame-swap/solver/graph/edgeMatrix";
import { fameSwapTransactionRequests } from "../src/features/fame-swap/transactions";
import { getFameSwapConfig } from "../src/features/fame-swap/config";
import {
  createLiveLiquidityQuoteAdapter,
  unavailableLiveAsyncQuoteAdapter,
} from "../src/features/fame-swap/solver/quotes/liveAdapters";
import { createDeterministicQuoteAdapter } from "../src/features/fame-swap/solver/quotes/deterministicAdapter";
import { createSnapshotQuoteAdapter } from "../src/features/fame-swap/solver/quotes/snapshotAdapter";
import {
  createIndexedPoolStateClient,
  type FameIndexedPoolStateClient,
  type FameIndexedPoolStateBatchResponse,
} from "../src/features/fame-swap/solver/quotes/indexedPoolStateClient";
import { createIndexedReserveQuoteAdapter } from "../src/features/fame-swap/solver/quotes/indexedReserveAdapter";
import { createIndexedClReplayQuoteAdapter } from "../src/features/fame-swap/solver/quotes/indexedClReplayAdapter";
import { toAsyncQuoteAdapter } from "../src/features/fame-swap/solver/optimizer/quoteRunAdapter";
import {
  famePoolStateRegistryPoolIdsForPair,
  famePoolStateRegistrySourceId,
  famePoolSupportsCompactQuote,
} from "../src/features/fame-swap/solver/poolStateRegistry";
import {
  FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
} from "../src/features/fame-swap/solver/poolActivationLedger";
import type { FameLegQuote } from "../src/features/fame-swap/solver/quotes/adapters";
import {
  corpusTokenLabel,
  FAME_ROUTE_CORPUS,
  type FameRouteCorpusCase,
} from "../src/features/fame-swap/solver/routeCorpus";
import { routeArtifactById } from "../src/features/fame-swap/solver/artifacts";
import type {
  FameSwapExecutableQuote,
  FameSwapQuote,
} from "../src/features/fame-swap/solver/types";
import type {
  FameAllocationTrialEvidence,
  FameOptimizerEvidence,
} from "../src/features/fame-swap/solver/optimizer/types";
import {
  applySlippageToAmount,
  DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
} from "../src/features/fame-swap/solver/slippage";
import { tokenForAddress } from "../src/features/fame-swap/tokens";
import {
  displaySafeDiagnosticMessage,
  redactSensitiveDiagnosticText,
} from "../src/features/fame-swap/solver/diagnostics";

const ROUTER_ADDRESS =
  "0x0000000000000000000000000000000000000009" as const satisfies Address;
const RECIPIENT =
  "0x0000000000000000000000000000000000000abc" as const satisfies Address;

export type FameRouteLabSelectedQuoteSourceKind =
  | "compact-indexed"
  | "raw-replay-indexed"
  | "indexed"
  | "live"
  | "fork"
  | "snapshot"
  | "deterministic-test"
  | "other";

export interface FameRouteLabSelectedQuoteSource {
  poolId: string;
  source: FameRouteLabSelectedQuoteSourceKind;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  quoteContextSource: string | null;
  evidenceId: string | null;
}

export interface FameRouteLabSelectedActivationSummary {
  selectedPoolId: typeof FAME_SELECTED_CL_ACTIVATION_CANDIDATE;
  liveDependencyPoolId: typeof FAME_SELECTED_LIVE_ROUTE_DEPENDENCY;
  selectedPoolSource: FameRouteLabSelectedQuoteSourceKind | "absent";
  liveDependencySource: FameRouteLabSelectedQuoteSourceKind | "absent";
  outcome:
    | "compact_quote_with_live_dependency"
    | "raw_replay_with_live_dependency"
    | "compact_quote_without_live_dependency"
    | "raw_replay_without_live_dependency"
    | "selected_pool_live_fallback"
    | "live_dependency_without_selected_pool";
}

export interface FameRouteLabRow {
  mode: "deterministic" | "recorded" | "indexed" | "live";
  id: string;
  pair: string;
  amountIn: string;
  expectedStatus: string;
  status: string;
  requestedRouteId: string | null;
  routeArtifactId: string | null;
  message: string;
  selectedPools: string[];
  selectedQuoteSources: FameRouteLabSelectedQuoteSource[];
  selectedActivation: FameRouteLabSelectedActivationSummary | null;
  quoteContext: string | null;
  feeBreakdown: {
    routerFeeAmount: string | null;
    routerFeePpm: string | null;
    venueFeesIncluded: boolean | null;
    maxLegMarketImpactBps: number | null;
    computablePriceImpactLegs: number | null;
  };
  rejectedCandidates: Array<{
    candidateId: string;
    reason: string;
    message: string;
  }>;
  candidateGenerationDiagnostics: Array<{
    reason: string;
    detail: string;
  }>;
  optimizer: FameRouteLabOptimizerSummary | null;
  indexedPoolState: FameRouteLabIndexedPoolStateSummary | null;
  edgeMatrix: FameRouteEdgeMatrixRow[];
  protocolCoverage: FameRouteProtocolCoverageRow[];
  simulation: FameRouteLabSimulation;
  suggestedContractTodo: string | null;
}

export interface FameRouteLabIndexedPoolStateSummary {
  sourceRegistryId: string;
  currentBlock: number;
  effectiveMaxFreshnessBlocks: number;
  statusCounts: {
    fresh: number;
    stale: number;
    unknown: number;
    unsupported: number;
  };
  clReplay: Array<{
    poolId: string;
    status: "fresh" | "stale";
    observedThroughBlock: number;
    stateHash: string;
    bitmapWordCount: number;
    initializedTickCount: number;
  }>;
}

export interface FameRouteLabOptimizerSummary {
  status: FameOptimizerEvidence["status"];
  selectedAllocationBps: number | null;
  selectedAllocationVectorBps: readonly number[] | null;
  selectedAlgorithm: FameOptimizerEvidence["selectedAlgorithm"];
  selectedStopReason: FameOptimizerEvidence["selectedStopReason"];
  selectedCandidateId: string | null;
  selectedTemplateId: string | null;
  fallbackReason: string | null;
  trialStatusCounts: Record<string, number>;
  quotePlanStats: Record<string, string | number | boolean | null>;
  allocationTrials: Array<{
    templateId: string;
    allocationBps: number | null;
    allocationVectorBps?: readonly number[];
    algorithm: string;
    stopReason?: string;
    status: string;
    reason: string;
    candidateId?: string;
    poolIds: string[];
    protectedAmountOut?: string;
    winningMarginBps?: number | null;
  }>;
  templateEligibility: Array<{
    templateId: string;
    status: string;
    reason: string;
    poolIds: string[];
  }>;
}

export type FameRouteLabSimulation =
  | {
      status: "not_requested" | "skipped";
      message: string;
    }
  | {
      status: "passed";
      account: string;
      output: string;
      protectedMinimum: string;
    }
  | {
      status: "failed";
      account: string;
      message: string;
    };

interface RouteLabClient {
  simulateContract: (request: unknown) => Promise<{ result: unknown }>;
  request: (request: unknown) => Promise<unknown>;
}

interface RouteLabOptions {
  candidateBudgets?: Partial<FameRouteCandidateBudgets>;
  requestedRouteId?: string;
}

interface IndexedRouteLabOptions extends RouteLabOptions {
  poolStateClient: FameIndexedPoolStateClient;
  fallbackAdapter?: Awaited<ReturnType<typeof createLiveLiquidityQuoteAdapter>>;
  currentBlock?: number;
  maxFreshnessBlocks?: number;
}

export async function runSnapshotRouteLab(
  corpus: readonly FameRouteCorpusCase[] = FAME_ROUTE_CORPUS,
  options: RouteLabOptions = {},
): Promise<FameRouteLabRow[]> {
  assertRouteLabRequestedRouteArtifact(options.requestedRouteId);
  const adapter = createSnapshotQuoteAdapter();
  const rows: FameRouteLabRow[] = [];
  for (const entry of corpus) {
    const candidateSet = routeCandidatesForPair(
      entry.tokenIn,
      entry.tokenOut,
      undefined,
      {
        budgets: options.candidateBudgets,
      },
    );
    const quote = await quoteFameSwapAsync({
      tokenIn: token(entry.tokenIn),
      tokenOut: token(entry.tokenOut),
      amountIn: entry.amountIn,
      recipient: RECIPIENT,
      config: {
        ...getFameSwapConfig(),
        routerAddress: ROUTER_ADDRESS,
        defaultSlippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      },
      readiness: {
        status: "ready",
        routerAddress: ROUTER_ADDRESS,
        feePpm: 2_222n,
      },
      requestedRouteId: options.requestedRouteId,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: toAsyncQuoteAdapter(adapter),
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation: FameRouteLabSimulation = {
      status: "not_requested",
      message: "Recorded quote replay does not run live route simulation.",
    };

    rows.push({
      mode: "recorded",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "recorded"),
      status: quote.status,
      requestedRouteId: options.requestedRouteId ?? null,
      routeArtifactId: quote.status === "ready" ? quote.routeArtifactId : null,
      message: displaySafeDiagnosticMessage(quote.message),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
      selectedQuoteSources: selectedQuoteSources(quote),
      selectedActivation: selectedActivationSummary(quote),
      quoteContext: quoteContextLabel(quote),
      feeBreakdown:
        quote.status === "ready"
          ? {
              routerFeeAmount: quote.routerFeeAmount.toString(),
              routerFeePpm: quote.feeBreakdown.routerFeePpm.toString(),
              venueFeesIncluded: quote.feeBreakdown.venueFeesIncluded,
              maxLegMarketImpactBps:
                quote.feeBreakdown.marketImpact.maxLegMarketImpactBps,
              computablePriceImpactLegs:
                quote.feeBreakdown.marketImpact.computableLegs,
            }
          : {
              routerFeeAmount: null,
              routerFeePpm: null,
              venueFeesIncluded: null,
              maxLegMarketImpactBps: null,
              computablePriceImpactLegs: null,
            },
      rejectedCandidates:
        "rejectedCandidates" in quote
          ? quote.rejectedCandidates.map((candidate) => ({
              candidateId: candidate.candidateId,
              reason: candidate.reason,
              message: displaySafeDiagnosticMessage(candidate.message),
            }))
          : [],
      candidateGenerationDiagnostics: candidateGenerationDiagnostics(
        candidateSet.rejected,
      ),
      optimizer: optimizerSummary(quote),
      indexedPoolState: null,
      edgeMatrix,
      protocolCoverage: routeProtocolCoverage(edgeMatrix, quote, simulation),
      simulation,
      suggestedContractTodo: suggestedTodo(entry, quote),
    });
  }
  return rows;
}

function routeLabIndexedPoolIdsForRequest(
  entry: FameRouteCorpusCase,
  requestedRouteId: string | undefined,
): string[] {
  const pairPoolIds = famePoolStateRegistryPoolIdsForPair(
    entry.tokenIn,
    entry.tokenOut,
  );
  if (!requestedRouteId) return pairPoolIds;

  const artifact = routeArtifactById(requestedRouteId);
  if (!artifact) {
    throw new Error(
      `Route lab --route requires a pinned route artifact id; received ${requestedRouteId}.`,
    );
  }
  if (
    !sameRouteAddress(entry.tokenIn, artifact.route.tokenIn) ||
    !sameRouteAddress(entry.tokenOut, artifact.route.tokenOut)
  ) {
    return [];
  }

  return artifact.poolIds.filter((poolId) =>
    famePoolSupportsCompactQuote(poolId),
  );
}

function assertRouteLabRequestedRouteArtifact(
  requestedRouteId: string | undefined,
) {
  if (!requestedRouteId) return;
  if (!routeArtifactById(requestedRouteId)) {
    throw new Error(
      `Route lab --route requires a pinned route artifact id; received ${requestedRouteId}.`,
    );
  }
}

function currentBlockForIndexedState(
  adapter: Awaited<ReturnType<typeof createLiveLiquidityQuoteAdapter>>,
): number | null {
  const context = adapter.quoteContext;
  if (
    context &&
    (context.source === "live" || context.source === "fork") &&
    context.blockNumber <= BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return Number(context.blockNumber);
  }
  return null;
}

export async function runIndexedRouteLab(
  corpus: readonly FameRouteCorpusCase[] = FAME_ROUTE_CORPUS,
  options: IndexedRouteLabOptions,
): Promise<FameRouteLabRow[]> {
  assertRouteLabRequestedRouteArtifact(options.requestedRouteId);
  const fallbackAdapter =
    options.fallbackAdapter ??
    toAsyncQuoteAdapter(createSnapshotQuoteAdapter());
  const currentBlock =
    options.currentBlock ?? currentBlockForIndexedState(fallbackAdapter);
  if (currentBlock === null) {
    throw new Error(
      "Indexed route lab requires currentBlock, FAME_POOL_STATE_CURRENT_BLOCK, or BASE_RPC_URL so freshness is checked against a live Base block.",
    );
  }
  const expectedSourceRegistryId = famePoolStateRegistrySourceId();
  const rows: FameRouteLabRow[] = [];
  for (const entry of corpus) {
    const candidateSet = routeCandidatesForPair(
      entry.tokenIn,
      entry.tokenOut,
      undefined,
      {
        budgets: options.candidateBudgets,
      },
    );
    const indexedState = await options.poolStateClient.fetchPoolStates({
      currentBlock,
      maxFreshnessBlocks: options.maxFreshnessBlocks,
      stateSurfaces: ["cl-replay-v1"],
      poolIds: routeLabIndexedPoolIdsForRequest(
        entry,
        options.requestedRouteId,
      ),
    });
    const reserveAdapter = createIndexedReserveQuoteAdapter({
      indexedState,
      fallback: fallbackAdapter,
      expectedSourceRegistryId,
    });
    const adapter = createIndexedClReplayQuoteAdapter({
      indexedState,
      fallback: reserveAdapter,
      expectedSourceRegistryId,
      mode: "local",
    });
    const quote = await quoteFameSwapAsync({
      tokenIn: token(entry.tokenIn),
      tokenOut: token(entry.tokenOut),
      amountIn: entry.amountIn,
      recipient: RECIPIENT,
      config: {
        ...getFameSwapConfig(),
        routerAddress: ROUTER_ADDRESS,
        defaultSlippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      },
      readiness: {
        status: "ready",
        routerAddress: ROUTER_ADDRESS,
        feePpm: 2_222n,
      },
      requestedRouteId: options.requestedRouteId,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter,
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation: FameRouteLabSimulation = {
      status: "not_requested",
      message: "Indexed route lab does not run live route simulation.",
    };

    rows.push({
      mode: "indexed",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "indexed"),
      status: quote.status,
      requestedRouteId: options.requestedRouteId ?? null,
      routeArtifactId: quote.status === "ready" ? quote.routeArtifactId : null,
      message: displaySafeDiagnosticMessage(quote.message),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
      selectedQuoteSources: selectedQuoteSources(quote),
      selectedActivation: selectedActivationSummary(quote),
      quoteContext: quoteContextLabel(quote),
      feeBreakdown:
        quote.status === "ready"
          ? {
              routerFeeAmount: quote.routerFeeAmount.toString(),
              routerFeePpm: quote.feeBreakdown.routerFeePpm.toString(),
              venueFeesIncluded: quote.feeBreakdown.venueFeesIncluded,
              maxLegMarketImpactBps:
                quote.feeBreakdown.marketImpact.maxLegMarketImpactBps,
              computablePriceImpactLegs:
                quote.feeBreakdown.marketImpact.computableLegs,
            }
          : {
              routerFeeAmount: null,
              routerFeePpm: null,
              venueFeesIncluded: null,
              maxLegMarketImpactBps: null,
              computablePriceImpactLegs: null,
            },
      rejectedCandidates:
        "rejectedCandidates" in quote
          ? quote.rejectedCandidates.map((candidate) => ({
              candidateId: candidate.candidateId,
              reason: candidate.reason,
              message: displaySafeDiagnosticMessage(candidate.message),
            }))
          : [],
      candidateGenerationDiagnostics: candidateGenerationDiagnostics(
        candidateSet.rejected,
      ),
      optimizer: optimizerSummary(quote),
      indexedPoolState: indexedPoolStateSummary(indexedState),
      edgeMatrix,
      protocolCoverage: routeProtocolCoverage(edgeMatrix, quote, simulation),
      simulation,
      suggestedContractTodo: suggestedTodo(entry, quote),
    });
  }
  return rows;
}

function quoteContextLabel(quote: FameSwapQuote): string | null {
  if (quote.status !== "ready" || !quote.quoteContext) return null;
  switch (quote.quoteContext.source) {
    case "live":
    case "fork":
      return `${quote.quoteContext.source}:${quote.quoteContext.chainId}:${quote.quoteContext.blockNumber.toString()}`;
    case "snapshot":
      return `recorded:${quote.quoteContext.snapshotId}:${quote.quoteContext.pinnedBaseBlock}`;
    case "indexed":
      return `indexed:${quote.quoteContext.chainId}:${quote.quoteContext.currentBlock}:fresh ${quote.quoteContext.statusCounts.fresh}, stale ${quote.quoteContext.statusCounts.stale}, unknown ${quote.quoteContext.statusCounts.unknown}, unsupported ${quote.quoteContext.statusCounts.unsupported}`;
    case "deterministic_test":
      return `deterministic-test:${quote.quoteContext.profileId}`;
  }
}

function selectedQuoteEvidenceId(leg: FameLegQuote): string | null {
  if (leg.indexedEvidence?.evidenceId) return leg.indexedEvidence.evidenceId;
  const snapshotMatch = /\bsnapshot\s+([A-Za-z0-9_.:-]+)/u.exec(leg.evidence);
  if (snapshotMatch?.[1]) return snapshotMatch[1];
  const blockMatch = /\bobserved through block\s+([0-9]+)/u.exec(leg.evidence);
  if (blockMatch?.[1]) return blockMatch[1];
  return null;
}

function selectedQuoteSourceKind(
  leg: FameLegQuote,
): FameRouteLabSelectedQuoteSourceKind {
  const source = leg.quoteContext?.source;
  if (source === "indexed") {
    if (leg.indexedEvidence?.kind === "compact-quote") return "compact-indexed";
    if (leg.indexedEvidence?.kind === "raw-replay") return "raw-replay-indexed";
    return "indexed";
  }
  if (source === "live") return "live";
  if (source === "fork") return "fork";
  if (source === "snapshot") return "snapshot";
  if (source === "deterministic_test") return "deterministic-test";
  return "other";
}

function selectedQuoteSources(
  quote: FameSwapQuote,
): FameRouteLabSelectedQuoteSource[] {
  if (quote.status !== "ready") return [];
  return quote.feeBreakdown.legs.map((leg) => ({
    poolId: leg.poolId,
    source: selectedQuoteSourceKind(leg),
    tokenIn: leg.tokenIn,
    tokenOut: leg.tokenOut,
    amountIn: leg.amountIn.toString(),
    quoteContextSource: leg.quoteContext?.source ?? null,
    evidenceId: selectedQuoteEvidenceId(leg),
  }));
}

function selectedActivationSummary(
  quote: FameSwapQuote,
): FameRouteLabSelectedActivationSummary | null {
  const sources = selectedQuoteSources(quote);
  const selectedPool = sources.find(
    (leg) => leg.poolId === FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  );
  const liveDependency = sources.find(
    (leg) => leg.poolId === FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
  );
  if (!selectedPool && !liveDependency) return null;

  const selectedPoolSource = selectedPool?.source ?? "absent";
  const liveDependencySource = liveDependency?.source ?? "absent";
  const dependencyIsLive =
    liveDependencySource === "live" || liveDependencySource === "fork";
  const outcome =
    selectedPoolSource === "compact-indexed" && dependencyIsLive
      ? "compact_quote_with_live_dependency"
      : selectedPoolSource === "raw-replay-indexed" && dependencyIsLive
        ? "raw_replay_with_live_dependency"
        : selectedPoolSource === "compact-indexed"
          ? "compact_quote_without_live_dependency"
          : selectedPoolSource === "raw-replay-indexed"
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

function routeEdgeMatrix(
  candidateSet: FameRouteCandidateSet,
  quote: FameSwapQuote,
): FameRouteEdgeMatrixRow[] {
  return buildFameRouteEdgeMatrix({
    candidateSet,
    selectedCandidateId:
      quote.status === "ready" ? quote.routeArtifactId : null,
    selectedLegQuotes:
      quote.status === "ready" ? quote.feeBreakdown.legs : undefined,
    rejectedCandidates:
      "rejectedCandidates" in quote ? quote.rejectedCandidates : [],
  });
}

function optimizerTrialSummary(trial: FameAllocationTrialEvidence) {
  return {
    templateId: trial.templateId,
    allocationBps: trial.allocationBps,
    ...(trial.allocationVectorBps
      ? { allocationVectorBps: trial.allocationVectorBps }
      : {}),
    algorithm: trial.algorithm,
    ...(trial.stopReason ? { stopReason: trial.stopReason } : {}),
    status: trial.status,
    reason: displaySafeDiagnosticMessage(trial.reason),
    ...(trial.candidateId ? { candidateId: trial.candidateId } : {}),
    poolIds: trial.poolIds,
    ...(trial.protectedAmountOut === undefined
      ? {}
      : { protectedAmountOut: trial.protectedAmountOut.toString() }),
    ...(trial.winningMarginBps === undefined
      ? {}
      : { winningMarginBps: trial.winningMarginBps }),
  };
}

function optimizerSummary(
  quote: FameSwapQuote,
): FameRouteLabOptimizerSummary | null {
  if (quote.status !== "ready" || !quote.optimizerEvidence) return null;
  const evidence = quote.optimizerEvidence;
  return {
    status: evidence.status,
    selectedAllocationBps: evidence.selectedAllocationBps,
    selectedAllocationVectorBps: evidence.selectedAllocationVectorBps,
    selectedAlgorithm: evidence.selectedAlgorithm,
    selectedStopReason: evidence.selectedStopReason,
    selectedCandidateId: evidence.selectedCandidateId,
    selectedTemplateId: evidence.selectedTemplateId,
    fallbackReason: evidence.fallbackReason,
    trialStatusCounts: evidence.trialStatusCounts,
    quotePlanStats: {
      logicalQuoteRequests: evidence.quotePlanStats.logicalQuoteRequests,
      uniqueExactQuoteReads: evidence.quotePlanStats.uniqueExactQuoteReads,
      exactQuoteCacheHits: evidence.quotePlanStats.exactQuoteCacheHits,
      stateReadRequests: evidence.quotePlanStats.stateReadRequests,
      uniqueStateReads: evidence.quotePlanStats.uniqueStateReads,
      stateReadCacheHits: evidence.quotePlanStats.stateReadCacheHits,
      underlyingRpcReads: evidence.quotePlanStats.underlyingRpcReads,
      allocationTrials: evidence.quotePlanStats.allocationTrials,
      templatesConsidered: evidence.quotePlanStats.templatesConsidered,
      budgetExhaustions: evidence.quotePlanStats.budgetExhaustions,
      timeout: evidence.quotePlanStats.timeout,
      fallbackReason: evidence.quotePlanStats.fallbackReason,
    },
    allocationTrials: evidence.allocationTrials.map(optimizerTrialSummary),
    templateEligibility: evidence.templateEligibility.map((entry) => ({
      templateId: entry.templateId,
      status: entry.status,
      reason: displaySafeDiagnosticMessage(entry.reason),
      poolIds: entry.poolIds,
    })),
  };
}

function routeProtocolCoverage(
  edgeMatrix: readonly FameRouteEdgeMatrixRow[],
  quote: FameSwapQuote,
  simulation: FameRouteLabSimulation,
): FameRouteProtocolCoverageRow[] {
  return buildFameRouteProtocolCoverage({
    edgeMatrix,
    selectedLegQuotes:
      quote.status === "ready" ? quote.feeBreakdown.legs : undefined,
    rejectedCandidates:
      "rejectedCandidates" in quote ? quote.rejectedCandidates : [],
    simulation,
  });
}

function candidateGenerationDiagnostics(
  rejected: readonly FameRouteCandidateRejected[],
) {
  return rejected.map((diagnostic) => ({
    reason: diagnostic.reason,
    detail: displaySafeDiagnosticMessage(diagnostic.detail),
  }));
}

function indexedPoolStateSummary(
  indexedState: FameIndexedPoolStateBatchResponse,
): FameRouteLabIndexedPoolStateSummary {
  const statusCounts = indexedState.pools.reduce(
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
  );
  return {
    sourceRegistryId: indexedState.sourceRegistryId,
    currentBlock: indexedState.currentBlock,
    effectiveMaxFreshnessBlocks: indexedState.effectiveMaxFreshnessBlocks,
    statusCounts,
    clReplay: indexedState.pools
      .filter(
        (
          pool,
        ): pool is Extract<
          FameIndexedPoolStateBatchResponse["pools"][number],
          { stateKind: "cl-replay-v1" }
        > =>
          (pool.status === "fresh" || pool.status === "stale") &&
          "stateKind" in pool &&
          pool.stateKind === "cl-replay-v1",
      )
      .map((pool) => ({
        poolId: pool.poolId,
        status: pool.status,
        observedThroughBlock: pool.observedThroughBlock,
        stateHash: pool.stateHash,
        bitmapWordCount: pool.bitmapWordCount,
        initializedTickCount: pool.initializedTickCount,
      })),
  };
}

function token(address: Address) {
  const result = tokenForAddress(address);
  if (!result) throw new Error(`Unsupported corpus token ${address}.`);
  return result;
}

function pairLabel(entry: FameRouteCorpusCase): string {
  return `${corpusTokenLabel(entry.tokenIn)}->${corpusTokenLabel(entry.tokenOut)}`;
}

function displaySafeAccountLabel(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function displaySafeErrorMessage(error: unknown): string {
  return displaySafeDiagnosticMessage(error, "Route simulation failed.");
}

function simulationAccount(): Address | null {
  const raw =
    process.env.FAME_SWAP_SIMULATION_ACCOUNT ??
    process.env.NEXT_PUBLIC_FAME_SWAP_SIMULATION_ACCOUNT;
  return raw && isAddress(raw) ? raw : null;
}

async function simulateQuote(
  quote: FameSwapQuote,
  client: RouteLabClient | null,
  account: Address | null,
): Promise<FameRouteLabSimulation> {
  if (quote.status !== "ready") {
    return {
      status: "skipped",
      message: `Quote status ${quote.status} is not executable.`,
    };
  }
  if (!client) {
    return {
      status: "not_requested",
      message: "Live route simulation was not requested.",
    };
  }
  if (!account) {
    return {
      status: "not_requested",
      message:
        "Live route simulation requires FAME_SWAP_SIMULATION_ACCOUNT or NEXT_PUBLIC_FAME_SWAP_SIMULATION_ACCOUNT.",
    };
  }

  try {
    const readyQuote = quote as FameSwapExecutableQuote;
    const simulationClient = client;
    const simulationAccountAddress = account;

    async function simulateRoute(
      route: FameSwapExecutableQuote["route"],
      materializedRouteHash: FameSwapExecutableQuote["materializedRouteHash"],
    ): Promise<bigint> {
      const requests = fameSwapTransactionRequests(readyQuote, {
        route,
        materializedRouteHash,
      });
      if (!requests.swap) {
        throw new Error("Ready quote did not produce a swap request.");
      }

      if (requests.approval) {
        const result = await simulateCalls(
          simulationClient as unknown as Parameters<typeof simulateCalls>[0],
          {
            account: simulationAccountAddress,
            calls: [
              {
                to: requests.approval.contract.address,
                data: encodeFunctionData({
                  abi: erc20ApprovalAbi,
                  functionName: "approve",
                  args: requests.approval.contract.args,
                }),
              },
              {
                to: requests.swap.contract.address,
                data: encodeFunctionData({
                  abi: fameRouterAbi,
                  functionName: "executeRoute",
                  args: requests.swap.contract.args,
                }),
                value: requests.swap.contract.value,
              },
            ],
          },
        );
        const swapResult = result.results[1];
        if (!swapResult || swapResult.status !== "success") {
          throw new Error("Bundled approve-then-swap simulation failed.");
        }
        const decoded = decodeFunctionResult({
          abi: fameRouterAbi,
          functionName: "executeRoute",
          data: swapResult.data,
        });
        if (typeof decoded !== "bigint") {
          throw new Error("Route simulation returned no output amount.");
        }
        return decoded;
      }

      const result = await simulationClient.simulateContract({
        account: simulationAccountAddress,
        address: requests.swap.contract.address,
        abi: fameRouterAbi,
        functionName: "executeRoute",
        args: requests.swap.contract.args,
        value: requests.swap.contract.value,
      });
      if (typeof result.result !== "bigint") {
        throw new Error("Route simulation returned no output amount.");
      }
      return result.result;
    }

    const probeOutput = await simulateRoute(
      readyQuote.route,
      readyQuote.materializedRouteHash,
    );
    const protectedMinimum = applySlippageToAmount(
      probeOutput,
      readyQuote.slippageBps,
    );
    const protectedRoute = {
      ...readyQuote.route,
      minAmountOutAfterFee: protectedMinimum,
    };
    const protectedOutput = await simulateRoute(
      protectedRoute,
      hashFameRoute(protectedRoute),
    );

    return {
      status: "passed",
      account: displaySafeAccountLabel(simulationAccountAddress),
      output: protectedOutput.toString(),
      protectedMinimum: protectedMinimum.toString(),
    };
  } catch (error) {
    return {
      status: "failed",
      account: account ? displaySafeAccountLabel(account) : "unavailable",
      message: displaySafeErrorMessage(error),
    };
  }
}

function expectedStatusFor(
  entry: FameRouteCorpusCase,
  mode: FameRouteLabRow["mode"],
): string {
  if (mode === "deterministic") {
    return entry.expectedDeterministicStatus ?? entry.expectedStatus;
  }
  if (mode === "recorded") {
    return entry.expectedSnapshotStatus ?? entry.expectedStatus;
  }
  return entry.expectedLiveStatus ?? entry.expectedStatus;
}

function suggestedTodo(
  entry: FameRouteCorpusCase,
  quote: FameSwapQuote,
): string | null {
  if (quote.status === "ready") {
    return [
      `# Prove ${pairLabel(entry)} Route For ${entry.amountIn.toString()}`,
      "",
      "## Evidence",
      `- www route-lab case: ${entry.id}`,
      `- Pair: ${pairLabel(entry)}`,
      `- Amount in: ${entry.amountIn.toString()}`,
      `- Selected pools: ${quote.poolIds.join(", ")}`,
      `- Quote context: ${quoteContextLabel(quote) ?? "unavailable"}`,
      `- Router fee amount: ${quote.routerFeeAmount.toString()}`,
      "",
      "## Acceptance Criteria",
      "- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.",
      "- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.",
    ].join("\n");
  }

  if ("rejectedCandidates" in quote && quote.rejectedCandidates.length > 0) {
    return [
      `# Add ${pairLabel(entry)} Failure Regression For ${entry.amountIn.toString()}`,
      "",
      "## Evidence",
      `- www route-lab case: ${entry.id}`,
      `- Pair: ${pairLabel(entry)}`,
      `- Amount in: ${entry.amountIn.toString()}`,
      `- Solver status: ${quote.status}`,
      `- First rejection: ${quote.rejectedCandidates[0]?.reason} - ${displaySafeDiagnosticMessage(quote.rejectedCandidates[0]?.message)}`,
      "",
      "## Acceptance Criteria",
      "- [ ] Add a contract-repo amount sweep or regression fixture for this exact failing amount.",
      "- [ ] Confirm whether the failure is expected capacity behavior or a missing route artifact opportunity.",
    ].join("\n");
  }

  return null;
}

export async function runRouteLab(
  corpus: readonly FameRouteCorpusCase[] = FAME_ROUTE_CORPUS,
  options: RouteLabOptions = {},
): Promise<FameRouteLabRow[]> {
  assertRouteLabRequestedRouteArtifact(options.requestedRouteId);
  const adapter = createDeterministicQuoteAdapter();
  const rows: FameRouteLabRow[] = [];
  for (const entry of corpus) {
    const candidateSet = routeCandidatesForPair(
      entry.tokenIn,
      entry.tokenOut,
      undefined,
      {
        budgets: options.candidateBudgets,
      },
    );
    const quote = await quoteFameSwapAsync({
      tokenIn: token(entry.tokenIn),
      tokenOut: token(entry.tokenOut),
      amountIn: entry.amountIn,
      recipient: RECIPIENT,
      config: {
        ...getFameSwapConfig(),
        routerAddress: ROUTER_ADDRESS,
        defaultSlippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      },
      readiness: {
        status: "ready",
        routerAddress: ROUTER_ADDRESS,
        feePpm: 2_222n,
      },
      optimizerMode: "disabled",
      requestedRouteId: options.requestedRouteId,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: toAsyncQuoteAdapter(adapter),
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation: FameRouteLabSimulation = {
      status: "not_requested",
      message: "Deterministic route lab does not run live route simulation.",
    };

    rows.push({
      mode: "deterministic",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "deterministic"),
      status: quote.status,
      requestedRouteId: options.requestedRouteId ?? null,
      routeArtifactId: quote.status === "ready" ? quote.routeArtifactId : null,
      message: displaySafeDiagnosticMessage(quote.message),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
      selectedQuoteSources: selectedQuoteSources(quote),
      selectedActivation: selectedActivationSummary(quote),
      quoteContext: quoteContextLabel(quote),
      feeBreakdown:
        quote.status === "ready"
          ? {
              routerFeeAmount: quote.routerFeeAmount.toString(),
              routerFeePpm: quote.feeBreakdown.routerFeePpm.toString(),
              venueFeesIncluded: quote.feeBreakdown.venueFeesIncluded,
              maxLegMarketImpactBps:
                quote.feeBreakdown.marketImpact.maxLegMarketImpactBps,
              computablePriceImpactLegs:
                quote.feeBreakdown.marketImpact.computableLegs,
            }
          : {
              routerFeeAmount: null,
              routerFeePpm: null,
              venueFeesIncluded: null,
              maxLegMarketImpactBps: null,
              computablePriceImpactLegs: null,
            },
      rejectedCandidates:
        "rejectedCandidates" in quote
          ? quote.rejectedCandidates.map((candidate) => ({
              candidateId: candidate.candidateId,
              reason: candidate.reason,
              message: displaySafeDiagnosticMessage(candidate.message),
            }))
          : [],
      candidateGenerationDiagnostics: candidateGenerationDiagnostics(
        candidateSet.rejected,
      ),
      optimizer: optimizerSummary(quote),
      indexedPoolState: null,
      edgeMatrix,
      protocolCoverage: routeProtocolCoverage(edgeMatrix, quote, simulation),
      simulation,
      suggestedContractTodo: suggestedTodo(entry, quote),
    });
  }
  return rows;
}

export async function runLiveRouteLab(
  corpus: readonly FameRouteCorpusCase[] = FAME_ROUTE_CORPUS,
  options: RouteLabOptions & { simulate?: boolean } = {},
): Promise<FameRouteLabRow[]> {
  assertRouteLabRequestedRouteArtifact(options.requestedRouteId);
  const config = getFameSwapConfig();
  const rpcUrl =
    process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
  const client = rpcUrl
    ? createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })
    : null;
  const adapter = client
    ? await createLiveLiquidityQuoteAdapter({
        client: {
          getBlockNumber: () => client.getBlockNumber(),
          readContract: (request) =>
            client.readContract(
              request as Parameters<typeof client.readContract>[0],
            ) as Promise<unknown>,
        },
        chainId: base.id,
      })
    : unavailableLiveAsyncQuoteAdapter(
        "Base RPC is not configured for live route-lab quotes.",
      );

  const routerAddress = config.routerAddress ?? ROUTER_ADDRESS;
  const account = options.simulate ? simulationAccount() : null;
  const rows: FameRouteLabRow[] = [];

  for (const entry of corpus) {
    const candidateSet = routeCandidatesForPair(
      entry.tokenIn,
      entry.tokenOut,
      undefined,
      {
        budgets: options.candidateBudgets,
      },
    );
    const quote = await quoteFameSwapAsync({
      tokenIn: token(entry.tokenIn),
      tokenOut: token(entry.tokenOut),
      amountIn: entry.amountIn,
      recipient: RECIPIENT,
      config: {
        ...config,
        routerAddress,
        defaultSlippageBps:
          config.defaultSlippageBps ?? DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      },
      readiness: {
        status: "ready",
        routerAddress,
        feePpm: 2_222n,
      },
      requestedRouteId: options.requestedRouteId,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter,
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation = await simulateQuote(
      quote,
      options.simulate ? (client as unknown as RouteLabClient | null) : null,
      account,
    );

    rows.push({
      mode: "live",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "live"),
      status: quote.status,
      requestedRouteId: options.requestedRouteId ?? null,
      routeArtifactId: quote.status === "ready" ? quote.routeArtifactId : null,
      message: displaySafeDiagnosticMessage(quote.message),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
      selectedQuoteSources: selectedQuoteSources(quote),
      selectedActivation: selectedActivationSummary(quote),
      quoteContext: quoteContextLabel(quote),
      feeBreakdown:
        quote.status === "ready"
          ? {
              routerFeeAmount: quote.routerFeeAmount.toString(),
              routerFeePpm: quote.feeBreakdown.routerFeePpm.toString(),
              venueFeesIncluded: quote.feeBreakdown.venueFeesIncluded,
              maxLegMarketImpactBps:
                quote.feeBreakdown.marketImpact.maxLegMarketImpactBps,
              computablePriceImpactLegs:
                quote.feeBreakdown.marketImpact.computableLegs,
            }
          : {
              routerFeeAmount: null,
              routerFeePpm: null,
              venueFeesIncluded: null,
              maxLegMarketImpactBps: null,
              computablePriceImpactLegs: null,
            },
      rejectedCandidates:
        "rejectedCandidates" in quote
          ? quote.rejectedCandidates.map((candidate) => ({
              candidateId: candidate.candidateId,
              reason: candidate.reason,
              message: displaySafeDiagnosticMessage(candidate.message),
            }))
          : [],
      candidateGenerationDiagnostics: candidateGenerationDiagnostics(
        candidateSet.rejected,
      ),
      optimizer: optimizerSummary(quote),
      indexedPoolState: null,
      edgeMatrix,
      protocolCoverage: routeProtocolCoverage(edgeMatrix, quote, simulation),
      simulation,
      suggestedContractTodo: suggestedTodo(entry, quote),
    });
  }

  return rows;
}

export function formatRouteLabMarkdown(
  rows: readonly FameRouteLabRow[],
): string {
  return [
    "# FAME Swap Route Lab",
    "",
    ...rows.flatMap((row) => [
      `## ${row.id}`,
      "",
      `- Mode: ${row.mode}`,
      `- Pair: ${row.pair}`,
      `- Amount in: ${row.amountIn}`,
      `- Status: ${row.status}`,
      `- Expected: ${row.expectedStatus}`,
      `- Selected pools: ${row.selectedPools.join(", ") || "none"}`,
      `- Selected quote sources: ${selectedQuoteSourcesSummary(row)}`,
      `- Selected activation: ${selectedActivationSummaryLine(row.selectedActivation)}`,
      `- Quote context: ${row.quoteContext ?? "n/a"}`,
      `- Router fee amount: ${row.feeBreakdown.routerFeeAmount ?? "n/a"}`,
      `- Venue fees included in quotes: ${String(
        row.feeBreakdown.venueFeesIncluded ?? "n/a",
      )}`,
      `- Computable price-impact legs: ${
        row.feeBreakdown.computablePriceImpactLegs ?? "n/a"
      }`,
      `- Max leg market impact bps: ${
        row.feeBreakdown.maxLegMarketImpactBps ?? "n/a"
      }`,
      `- Rejections: ${row.rejectedCandidates.length}`,
      `- Candidate generation diagnostics: ${row.candidateGenerationDiagnostics.length}`,
      `- Optimizer: ${optimizerSummaryLine(row.optimizer)}`,
      `- Indexed pool state: ${indexedPoolStateSummaryLine(row.indexedPoolState)}`,
      `- Edge matrix: ${edgeMatrixSummary(row.edgeMatrix)}`,
      `- Protocol coverage: ${protocolCoverageSummary(row.protocolCoverage)}`,
      `- Simulation: ${
        row.simulation.status === "passed"
          ? `passed, output ${row.simulation.output}, protected minimum ${row.simulation.protectedMinimum}`
          : row.simulation.status === "failed"
            ? `failed, ${displaySafeDiagnosticMessage(row.simulation.message)}`
            : displaySafeDiagnosticMessage(row.simulation.message)
      }`,
      "",
      ...formatCandidateGenerationDiagnosticsMarkdown(
        row.candidateGenerationDiagnostics,
      ),
      ...formatOptimizerMarkdown(row.optimizer),
      ...formatEdgeMatrixMarkdown(row.edgeMatrix),
      ...formatProtocolCoverageMarkdown(row.protocolCoverage),
      row.suggestedContractTodo
        ? [
            "### Suggested Contract Todo",
            "",
            redactSensitiveDiagnosticText(row.suggestedContractTodo),
            "",
          ].join("\n")
        : "",
    ]),
  ].join("\n");
}

function selectedQuoteSourcesSummary(row: FameRouteLabRow): string {
  if (row.selectedQuoteSources.length === 0) return "none";
  return row.selectedQuoteSources
    .map((entry) => `${entry.poolId} ${entry.source}`)
    .join("; ");
}

function selectedActivationSummaryLine(
  summary: FameRouteLabSelectedActivationSummary | null,
): string {
  if (!summary) return "not applicable";
  return [
    summary.outcome,
    `${summary.selectedPoolId} ${summary.selectedPoolSource}`,
    `${summary.liveDependencyPoolId} ${summary.liveDependencySource}`,
  ].join(", ");
}

function optimizerSummaryLine(optimizer: FameRouteLabRow["optimizer"]): string {
  if (!optimizer) return "not run";
  return [
    optimizer.status,
    `allocation ${optimizer.selectedAllocationBps ?? "n/a"}`,
    optimizer.selectedAlgorithm
      ? `algorithm ${optimizer.selectedAlgorithm}`
      : null,
    optimizer.selectedStopReason
      ? `stop ${optimizer.selectedStopReason}`
      : null,
    `trials ${optimizer.quotePlanStats.allocationTrials}`,
    `cache hits ${optimizer.quotePlanStats.exactQuoteCacheHits}`,
    optimizer.fallbackReason ? `fallback ${optimizer.fallbackReason}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function indexedPoolStateSummaryLine(
  indexed: FameRouteLabRow["indexedPoolState"],
): string {
  if (!indexed) return "not used";
  return [
    `fresh ${indexed.statusCounts.fresh}`,
    `stale ${indexed.statusCounts.stale}`,
    `unknown ${indexed.statusCounts.unknown}`,
    `unsupported ${indexed.statusCounts.unsupported}`,
    `max freshness ${indexed.effectiveMaxFreshnessBlocks}`,
    indexed.clReplay.length > 0
      ? `cl replay ${indexed.clReplay
          .map(
            (entry) =>
              `${entry.poolId} ${entry.status} block ${entry.observedThroughBlock.toString()} ticks ${entry.initializedTickCount.toString()} hash ${entry.stateHash.slice(0, 10)}`,
          )
          .join("; ")}`
      : null,
  ]
    .filter((part): part is string => part !== null)
    .join(", ");
}

function formatOptimizerMarkdown(
  optimizer: FameRouteLabRow["optimizer"],
): string[] {
  if (!optimizer) return [];
  const trialRows = optimizer.allocationTrials.slice(0, 12);
  return [
    "### Optimizer",
    "",
    `- Status: ${optimizer.status}`,
    `- Selected template: ${optimizer.selectedTemplateId ?? "n/a"}`,
    `- Selected allocation bps: ${optimizer.selectedAllocationBps ?? "n/a"}`,
    `- Selected allocation vector: ${
      optimizer.selectedAllocationVectorBps?.join("/") ?? "n/a"
    }`,
    `- Selected algorithm: ${optimizer.selectedAlgorithm ?? "n/a"}`,
    `- Selected stop reason: ${optimizer.selectedStopReason ?? "n/a"}`,
    `- Selected candidate: ${optimizer.selectedCandidateId ?? "n/a"}`,
    `- Fallback reason: ${optimizer.fallbackReason ?? "n/a"}`,
    `- Trial statuses: ${Object.entries(optimizer.trialStatusCounts)
      .map(([status, count]) => `${status} ${count}`)
      .join(", ")}`,
    `- Quote plan stats: logical ${optimizer.quotePlanStats.logicalQuoteRequests}, unique exact ${optimizer.quotePlanStats.uniqueExactQuoteReads}, exact cache hits ${optimizer.quotePlanStats.exactQuoteCacheHits}, unique state ${optimizer.quotePlanStats.uniqueStateReads}, state cache hits ${optimizer.quotePlanStats.stateReadCacheHits}, rpc ${optimizer.quotePlanStats.underlyingRpcReads}`,
    "",
    "| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...trialRows.map((trial) => {
      const line = [
        trial.allocationVectorBps?.join("/") ??
          (trial.allocationBps === null
            ? "n/a"
            : trial.allocationBps.toString()),
        trial.algorithm,
        trial.stopReason ?? "n/a",
        trial.status,
        trial.poolIds.join(", ") || "none",
        trial.protectedAmountOut ?? "n/a",
        displaySafeDiagnosticMessage(trial.reason),
      ]
        .map(markdownCell)
        .join(" | ");
      return `| ${line} |`;
    }),
    "",
  ];
}

function formatCandidateGenerationDiagnosticsMarkdown(
  diagnostics: FameRouteLabRow["candidateGenerationDiagnostics"],
): string[] {
  if (diagnostics.length === 0) return [];

  return [
    "### Candidate Generation Diagnostics",
    "",
    ...diagnostics.map(
      (diagnostic) =>
        `- ${diagnostic.reason}: ${displaySafeDiagnosticMessage(diagnostic.detail)}`,
    ),
    "",
  ];
}

function edgeMatrixSummary(rows: readonly FameRouteEdgeMatrixRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  return ["selected", "considered", "rejected", "disabled", "missing"]
    .map((status) => `${status} ${counts.get(status) ?? 0}`)
    .join(", ");
}

function protocolCoverageSummary(
  rows: readonly FameRouteProtocolCoverageRow[],
): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.edgeStatus, (counts.get(row.edgeStatus) ?? 0) + 1);
  }

  return ["selected", "considered", "rejected", "disabled", "missing"]
    .map((status) => `${status} ${counts.get(status) ?? 0}`)
    .join(", ");
}

function fieldLabel(field: FameRouteProtocolCoverageRow["quote"]): string {
  if (field.status === "available") {
    return field.value
      ? `available ${displaySafeDiagnosticMessage(field.value)}`
      : "available";
  }

  return field.reason
    ? `${field.status} (${displaySafeDiagnosticMessage(field.reason)})`
    : field.status;
}

function markdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatEdgeMatrixMarkdown(
  rows: readonly FameRouteEdgeMatrixRow[],
): string[] {
  if (rows.length === 0) return [];

  return [
    "### Edge Matrix",
    "",
    "| Status | Edge | Venue | Pool | Reason |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((row) => {
      const line = [
        row.status,
        `${row.tokenInSymbol}->${row.tokenOutSymbol}`,
        row.venue,
        row.poolId ?? "missing",
        displaySafeDiagnosticMessage(row.reason),
      ]
        .map(markdownCell)
        .join(" | ");
      return `| ${line} |`;
    }),
    "",
  ];
}

function formatProtocolCoverageMarkdown(
  rows: readonly FameRouteProtocolCoverageRow[],
): string[] {
  if (rows.length === 0) return [];

  return [
    "### Protocol Coverage",
    "",
    "| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) => {
      const line = [
        `${row.tokenInSymbol}->${row.tokenOutSymbol} ${row.poolId ?? "missing"}`,
        `${row.edgeStatus}/${row.attribution}`,
        fieldLabel(row.quote),
        fieldLabel(row.prePrice),
        fieldLabel(row.postPrice),
        fieldLabel(row.marketImpact),
        fieldLabel(row.activeLiquidity),
        fieldLabel(row.routeSimulation),
      ]
        .map(markdownCell)
        .join(" | ");
      return `| ${line} |`;
    }),
    "",
  ];
}

function sameRouteAddress(left: Address, right: Address): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function routeLabRequestedRouteIdFromArgs(): string | undefined {
  const routeArgIndex = process.argv.indexOf("--route");
  if (routeArgIndex >= 0) {
    const value = process.argv[routeArgIndex + 1];
    if (!value) throw new Error("--route requires a route id.");
    return value;
  }
  return process.env.FAME_SWAP_ROUTE_LAB_ROUTE_ID?.trim() || undefined;
}

function routeLabCorpusForRequestedRoute(
  corpus: readonly FameRouteCorpusCase[],
  requestedRouteId: string | undefined,
): readonly FameRouteCorpusCase[] {
  if (!requestedRouteId) return corpus;
  const artifact = routeArtifactById(requestedRouteId);
  if (!artifact) return corpus;
  const filtered = corpus.filter(
    (entry) =>
      sameRouteAddress(entry.tokenIn, artifact.route.tokenIn) &&
      sameRouteAddress(entry.tokenOut, artifact.route.tokenOut),
  );
  if (filtered.length === 0) {
    throw new Error(
      `No route-lab corpus case matches requested route ${requestedRouteId}.`,
    );
  }
  return filtered;
}

function shouldRunCli(): boolean {
  return process.argv[1]?.endsWith("fame-swap-route-lab.ts") ?? false;
}

function localOrTestPoolApiBase(url: URL): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1"
  );
}

function poolApiBaseUrlFromEnv(): URL | undefined {
  const legacyEndpoint = process.env.FAME_POOL_STATE_API_URL?.trim();
  if (legacyEndpoint) {
    throw new Error(
      "FAME_POOL_STATE_API_URL is no longer supported; set FAME_POOL_API_URL to the pool API base URL.",
    );
  }

  const baseUrl = process.env.FAME_POOL_API_URL?.trim();
  if (!baseUrl) return undefined;
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

export function poolStateEndpointUrlFromEnv(): string | undefined {
  const url = poolApiBaseUrlFromEnv();
  if (!url) return undefined;
  const basePath = url.pathname.replace(/\/+$/u, "");
  url.pathname = `${basePath}/fame/pool-state`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function routeLabIndexedPoolStateClientFromEnv(): FameIndexedPoolStateClient {
  const endpointUrl = poolStateEndpointUrlFromEnv();
  const serviceToken = process.env.FAME_POOL_STATE_SERVICE_TOKEN;
  if (!endpointUrl || !serviceToken) {
    throw new Error(
      "Indexed route lab requires FAME_POOL_API_URL and FAME_POOL_STATE_SERVICE_TOKEN.",
    );
  }
  return createIndexedPoolStateClient({
    endpointUrl,
    serviceToken,
    timeoutMs: optionalSafeIntegerEnv("FAME_POOL_STATE_TIMEOUT_MS"),
  });
}

function optionalSafeIntegerEnv(name: string): number | undefined {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

async function routeLabIndexedFallbackAdapterFromEnv(): Promise<
  IndexedRouteLabOptions["fallbackAdapter"] | undefined
> {
  const rpcUrl = process.env.BASE_RPC_URL;
  if (!rpcUrl) return undefined;
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
  return createLiveLiquidityQuoteAdapter({
    client: {
      getBlockNumber: () => client.getBlockNumber(),
      readContract: (request) =>
        client.readContract(
          request as Parameters<typeof client.readContract>[0],
        ) as Promise<unknown>,
    },
    chainId: base.id,
  });
}

async function routeLabIndexedCurrentBlockFromEnv(): Promise<number> {
  const explicitCurrentBlock = optionalSafeIntegerEnv(
    "FAME_POOL_STATE_CURRENT_BLOCK",
  );
  if (explicitCurrentBlock !== undefined) return explicitCurrentBlock;

  const rpcUrl = process.env.BASE_RPC_URL;
  if (!rpcUrl) {
    throw new Error(
      "Indexed route lab requires FAME_POOL_STATE_CURRENT_BLOCK or BASE_RPC_URL so freshness is checked against a live Base block.",
    );
  }

  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
  const blockNumber = await client.getBlockNumber();
  if (blockNumber > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      "Indexed route lab current Base block exceeds safe integer range.",
    );
  }
  return Number(blockNumber);
}

if (shouldRunCli()) {
  const run = async () => {
    const requestedRouteId = routeLabRequestedRouteIdFromArgs();
    const corpus = routeLabCorpusForRequestedRoute(
      FAME_ROUTE_CORPUS,
      requestedRouteId,
    );
    const rows = process.argv.includes("--live")
      ? await runLiveRouteLab(corpus, {
          requestedRouteId,
          simulate: process.argv.includes("--simulate"),
        })
      : process.argv.includes("--indexed")
        ? await runIndexedRouteLab(corpus, {
            requestedRouteId,
            poolStateClient: routeLabIndexedPoolStateClientFromEnv(),
            fallbackAdapter: await routeLabIndexedFallbackAdapterFromEnv(),
            currentBlock: await routeLabIndexedCurrentBlockFromEnv(),
            maxFreshnessBlocks: optionalSafeIntegerEnv(
              "FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS",
            ),
          })
        : process.argv.includes("--deterministic")
          ? await runRouteLab(corpus, { requestedRouteId })
          : await runSnapshotRouteLab(corpus, { requestedRouteId });
    if (process.argv.includes("--markdown")) {
      console.log(formatRouteLabMarkdown(rows));
    } else {
      console.log(JSON.stringify(rows, null, 2));
    }
  };
  run().catch((error) => {
    console.error(
      `FAME route lab failed: ${displaySafeDiagnosticMessage(error, "Unknown route-lab error.")}`,
    );
    process.exit(1);
  });
}

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
  FameRouteCandidate,
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
import {
  createIndexedQuoteApiClient,
  type FamePoolQuoteClient,
} from "../src/features/fame-swap/solver/quotes/indexedQuoteApiClient";
import { createIndexedReserveQuoteAdapter } from "../src/features/fame-swap/solver/quotes/indexedReserveAdapter";
import { createIndexedClReplayQuoteAdapter } from "../src/features/fame-swap/solver/quotes/indexedClReplayAdapter";
import {
  createIndexedQuoteApiAdapter,
  createQuoteApiDiagnosticsRecorder,
  type FameQuoteApiDiagnosticsSnapshot,
} from "../src/features/fame-swap/solver/quotes/indexedQuoteApiAdapter";
import { toAsyncQuoteAdapter } from "../src/features/fame-swap/solver/optimizer/quoteRunAdapter";
import {
  FAME_V4_ZORA_REVIEWED_POOL_SHAPE,
  famePoolStateRegistryPoolIdsForPair,
  famePoolStateRegistrySourceId,
  type FameV4ZoraQuoteLaneActivation,
} from "../src/features/fame-swap/solver/poolStateRegistry";
import type {
  FameAsyncQuoteAdapter,
  FameQuoteAdapter,
} from "../src/features/fame-swap/solver/quotes/adapters";
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

const ROUTER_ADDRESS =
  "0x0000000000000000000000000000000000000009" as const satisfies Address;
const RECIPIENT =
  "0x0000000000000000000000000000000000000abc" as const satisfies Address;

export interface FameRouteLabRow {
  mode: "deterministic" | "recorded" | "indexed" | "quote-api" | "live";
  id: string;
  pair: string;
  amountIn: string;
  expectedStatus: string;
  status: string;
  message: string;
  requestedRouteId: string | null;
  routeArtifactId: string | null;
  selectedCandidateId: string | null;
  materializedRouteHash: string | null;
  selectedPools: string[];
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
  quoteApi: FameRouteLabQuoteApiSummary | null;
  edgeMatrix: FameRouteEdgeMatrixRow[];
  protocolCoverage: FameRouteProtocolCoverageRow[];
  simulation: FameRouteLabSimulation;
  suggestedContractTodo: string | null;
}

export interface FameRouteLabQuoteApiSummary {
  sourceRegistryId: string;
  currentBlock: number;
  maxFreshnessBlocks: number | null;
  diagnostics: FameQuoteApiDiagnosticsSnapshot;
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
  targetFilter?: FameRouteLabTargetFilter;
}

interface IndexedRouteLabOptions extends RouteLabOptions {
  poolStateClient: FameIndexedPoolStateClient;
  fallbackAdapter?: FameAsyncQuoteAdapter | FameQuoteAdapter;
  currentBlock?: number;
  maxFreshnessBlocks?: number;
}

interface QuoteApiRouteLabOptions extends RouteLabOptions {
  quoteClient: FamePoolQuoteClient;
  fallbackAdapter?: FameAsyncQuoteAdapter | FameQuoteAdapter;
  currentBlock?: number;
  maxFreshnessBlocks?: number;
  expectedSourceRegistryId?: string;
  v4ZoraQuoteLaneActivation?: FameV4ZoraQuoteLaneActivation;
  simulate?: boolean;
}

export interface FameRouteLabTargetFilter {
  caseId?: string;
  routeId?: string;
  poolId?: string;
  tokenIn?: Address;
  tokenOut?: Address;
}

function sameAddress(left: Address, right: Address): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function hasRouteLabTargetFilter(
  filter: FameRouteLabTargetFilter | undefined,
): filter is FameRouteLabTargetFilter {
  return Boolean(
    filter &&
      (filter.caseId ||
        filter.routeId ||
        filter.poolId ||
        filter.tokenIn ||
        filter.tokenOut),
  );
}

function routeLabTargetFilterLabel(filter: FameRouteLabTargetFilter): string {
  return [
    filter.caseId ? `case ${filter.caseId}` : null,
    filter.routeId ? `route ${filter.routeId}` : null,
    filter.poolId ? `pool ${filter.poolId}` : null,
    filter.tokenIn ? `tokenIn ${filter.tokenIn}` : null,
    filter.tokenOut ? `tokenOut ${filter.tokenOut}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(", ");
}

function routeEntryMatchesRouteId(
  entry: FameRouteCorpusCase,
  routeId: string,
): boolean {
  const artifact = routeArtifactById(routeId);
  if (!artifact) throw new Error(`Unknown route-lab route id ${routeId}.`);
  return (
    sameAddress(entry.tokenIn, artifact.route.tokenIn) &&
    sameAddress(entry.tokenOut, artifact.route.tokenOut) &&
    entry.amountIn === BigInt(artifact.route.amountIn)
  );
}

function routeEntryMatchesPoolTarget(
  entry: FameRouteCorpusCase,
  filter: FameRouteLabTargetFilter,
): boolean {
  if (!filter.poolId && !filter.tokenIn && !filter.tokenOut) return true;
  const candidateSet = routeCandidatesForPair(entry.tokenIn, entry.tokenOut);
  return candidateSet.candidates.some((candidate) =>
    candidate.legs.some((leg) => {
      if (filter.poolId && leg.edge.poolId !== filter.poolId) return false;
      if (filter.tokenIn && !sameAddress(leg.edge.tokenIn, filter.tokenIn)) {
        return false;
      }
      if (filter.tokenOut && !sameAddress(leg.edge.tokenOut, filter.tokenOut)) {
        return false;
      }
      return true;
    }),
  );
}

export function filterRouteLabCorpus(
  corpus: readonly FameRouteCorpusCase[],
  filter: FameRouteLabTargetFilter | undefined,
): FameRouteCorpusCase[] {
  if (!hasRouteLabTargetFilter(filter)) return [...corpus];

  const matches = corpus.filter((entry) => {
    if (filter.caseId && entry.id !== filter.caseId) return false;
    if (filter.routeId && !routeEntryMatchesRouteId(entry, filter.routeId)) {
      return false;
    }
    return routeEntryMatchesPoolTarget(entry, filter);
  });

  if (matches.length === 0) {
    throw new Error(
      `Route-lab target filter matched no corpus cases: ${routeLabTargetFilterLabel(filter)}.`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `Route-lab target filter is ambiguous (${routeLabTargetFilterLabel(filter)}): ${matches.map((entry) => entry.id).join(", ")}. Add --case or --route to select exactly one route.`,
    );
  }
  return matches;
}

function selectedRouteArtifactId(quote: FameSwapQuote): string | null {
  return quote.status === "ready" ? quote.routeArtifactId : null;
}

function selectedQuoteMatchesRouteArtifact(
  quote: FameSwapQuote,
  routeId: string,
): boolean {
  if (quote.status !== "ready") return false;
  const artifact = routeArtifactById(routeId);
  if (!artifact) throw new Error(`Unknown route-lab route id ${routeId}.`);
  if (quote.feeBreakdown.legs.length !== artifact.route.legs.length) {
    return false;
  }
  return quote.feeBreakdown.legs.every((leg, index) => {
    const artifactLeg = artifact.route.legs[index];
    const artifactPoolId = artifact.poolIds[index];
    return (
      artifactLeg !== undefined &&
      artifactPoolId !== undefined &&
      leg.poolId === artifactPoolId &&
      sameAddress(leg.tokenIn, artifactLeg.tokenIn) &&
      sameAddress(leg.tokenOut, artifactLeg.tokenOut)
    );
  });
}

function routeArtifactIdForEvidence(
  quote: FameSwapQuote,
  filter: FameRouteLabTargetFilter | undefined,
): string | null {
  if (
    quote.status === "ready" &&
    filter?.routeId &&
    selectedQuoteMatchesRouteArtifact(quote, filter.routeId)
  ) {
    return filter.routeId;
  }
  return selectedRouteArtifactId(quote);
}

function materializedRouteHash(quote: FameSwapQuote): string | null {
  return quote.status === "ready" ? quote.materializedRouteHash : null;
}

function requestedRouteId(
  filter: FameRouteLabTargetFilter | undefined,
): string | null {
  return filter?.routeId ?? null;
}

function selectedQuoteHasTargetLeg(
  quote: FameSwapQuote,
  filter: FameRouteLabTargetFilter,
): boolean {
  if (quote.status !== "ready") return false;
  return quote.feeBreakdown.legs.some((leg) => {
    if (filter.poolId && leg.poolId !== filter.poolId) return false;
    if (filter.tokenIn && !sameAddress(leg.tokenIn, filter.tokenIn)) {
      return false;
    }
    if (filter.tokenOut && !sameAddress(leg.tokenOut, filter.tokenOut)) {
      return false;
    }
    return true;
  });
}

function validateRouteLabTargetSelection(options: {
  entry: FameRouteCorpusCase;
  quote: FameSwapQuote;
  filter: FameRouteLabTargetFilter | undefined;
  mode: FameRouteLabRow["mode"];
}): void {
  const { entry, quote, filter, mode } = options;
  if (!hasRouteLabTargetFilter(filter)) return;

  if (filter.routeId) {
    if (quote.status !== "ready") {
      throw new Error(
        `${mode} route-lab target route ${filter.routeId} did not produce a ready quote for ${entry.id}: ${quote.status}.`,
      );
    }
    if (
      quote.routeArtifactId !== filter.routeId &&
      !selectedQuoteMatchesRouteArtifact(quote, filter.routeId)
    ) {
      throw new Error(
        `${mode} route-lab selected route ${quote.routeArtifactId} for ${entry.id}, expected ${filter.routeId}.`,
      );
    }
  }

  if (filter.poolId || filter.tokenIn || filter.tokenOut) {
    if (quote.status !== "ready") {
      throw new Error(
        `${mode} route-lab target ${routeLabTargetFilterLabel(filter)} did not produce a ready quote for ${entry.id}: ${quote.status}.`,
      );
    }
    if (!selectedQuoteHasTargetLeg(quote, filter)) {
      throw new Error(
        `${mode} route-lab selected route ${quote.routeArtifactId} for ${entry.id} did not include requested target ${routeLabTargetFilterLabel(filter)}.`,
      );
    }
  }
}

function candidateMatchesRouteArtifact(
  candidate: FameRouteCandidate,
  routeId: string,
): boolean {
  const artifact = routeArtifactById(routeId);
  if (!artifact) throw new Error(`Unknown route-lab route id ${routeId}.`);
  if (candidate.legs.length !== artifact.route.legs.length) return false;
  return candidate.legs.every((leg, index) => {
    const artifactLeg = artifact.route.legs[index];
    const artifactPoolId = artifact.poolIds[index];
    return (
      artifactLeg !== undefined &&
      artifactPoolId !== undefined &&
      leg.edge.poolId === artifactPoolId &&
      sameAddress(leg.edge.tokenIn, artifactLeg.tokenIn) &&
      sameAddress(leg.edge.tokenOut, artifactLeg.tokenOut)
    );
  });
}

function candidateMatchesPoolTarget(
  candidate: FameRouteCandidate,
  filter: FameRouteLabTargetFilter,
): boolean {
  if (!filter.poolId && !filter.tokenIn && !filter.tokenOut) return true;
  return candidate.legs.some((leg) => {
    if (filter.poolId && leg.edge.poolId !== filter.poolId) return false;
    if (filter.tokenIn && !sameAddress(leg.edge.tokenIn, filter.tokenIn)) {
      return false;
    }
    if (filter.tokenOut && !sameAddress(leg.edge.tokenOut, filter.tokenOut)) {
      return false;
    }
    return true;
  });
}

function candidateFilterForRouteLabTarget(
  filter: FameRouteLabTargetFilter | undefined,
): ((candidate: FameRouteCandidate) => boolean) | undefined {
  if (!hasRouteLabTargetFilter(filter)) return undefined;
  return (candidate) => {
    if (filter.routeId && !candidateMatchesRouteArtifact(candidate, filter.routeId)) {
      return false;
    }
    return candidateMatchesPoolTarget(candidate, filter);
  };
}

function routeLabV4ZoraActivation(
  sourceRegistryId: string,
): FameV4ZoraQuoteLaneActivation {
  return {
    status: "active",
    sourceRegistryId,
    parityStatus: "passed",
    routeSimulationStatus: "passed",
    evidenceId: "route-lab-v4-zora-validation",
  };
}

function quoteApiSummary(options: {
  sourceRegistryId: string;
  currentBlock: number;
  maxFreshnessBlocks?: number;
  diagnostics: FameQuoteApiDiagnosticsSnapshot;
}): FameRouteLabQuoteApiSummary {
  return {
    sourceRegistryId: options.sourceRegistryId,
    currentBlock: options.currentBlock,
    maxFreshnessBlocks: options.maxFreshnessBlocks ?? null,
    diagnostics: options.diagnostics,
  };
}

export async function runSnapshotRouteLab(
  corpus: readonly FameRouteCorpusCase[] = FAME_ROUTE_CORPUS,
  options: RouteLabOptions = {},
): Promise<FameRouteLabRow[]> {
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
      candidateFilter: candidateFilterForRouteLabTarget(options.targetFilter),
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: toAsyncQuoteAdapter(adapter),
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation: FameRouteLabSimulation = {
      status: "not_requested",
      message: "Recorded quote replay does not run live route simulation.",
    };
    validateRouteLabTargetSelection({
      entry,
      quote,
      filter: options.targetFilter,
      mode: "recorded",
    });

    rows.push({
      mode: "recorded",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "recorded"),
      status: quote.status,
      message: displaySafeDiagnosticMessage(quote.message),
      requestedRouteId: requestedRouteId(options.targetFilter),
      routeArtifactId: routeArtifactIdForEvidence(quote, options.targetFilter),
      selectedCandidateId: selectedRouteArtifactId(quote),
      materializedRouteHash: materializedRouteHash(quote),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
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
      quoteApi: null,
      edgeMatrix,
      protocolCoverage: routeProtocolCoverage(edgeMatrix, quote, simulation),
      simulation,
      suggestedContractTodo: suggestedTodo(entry, quote),
    });
  }
  return rows;
}

function currentBlockForIndexedState(
  adapter: FameAsyncQuoteAdapter | FameQuoteAdapter,
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
      poolIds: famePoolStateRegistryPoolIdsForPair(
        entry.tokenIn,
        entry.tokenOut,
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
      mode: "shadow",
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
      candidateFilter: candidateFilterForRouteLabTarget(options.targetFilter),
      now: new Date("2026-05-13T00:00:00Z"),
      adapter,
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation: FameRouteLabSimulation = {
      status: "not_requested",
      message: "Indexed route lab does not run live route simulation.",
    };
    validateRouteLabTargetSelection({
      entry,
      quote,
      filter: options.targetFilter,
      mode: "indexed",
    });

    rows.push({
      mode: "indexed",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "indexed"),
      status: quote.status,
      message: displaySafeDiagnosticMessage(quote.message),
      requestedRouteId: requestedRouteId(options.targetFilter),
      routeArtifactId: routeArtifactIdForEvidence(quote, options.targetFilter),
      selectedCandidateId: selectedRouteArtifactId(quote),
      materializedRouteHash: materializedRouteHash(quote),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
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
      quoteApi: null,
      edgeMatrix,
      protocolCoverage: routeProtocolCoverage(edgeMatrix, quote, simulation),
      simulation,
      suggestedContractTodo: suggestedTodo(entry, quote),
    });
  }
  return rows;
}

export async function runQuoteApiRouteLab(
  corpus: readonly FameRouteCorpusCase[] = FAME_ROUTE_CORPUS,
  options: QuoteApiRouteLabOptions,
): Promise<FameRouteLabRow[]> {
  const config = getFameSwapConfig();
  const rpcUrl =
    process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
  const client = rpcUrl
    ? createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })
    : null;
  const fallbackAdapter =
    options.fallbackAdapter ??
    (client
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
          "Base RPC is not configured for quote-api route-lab fallback quotes.",
        ));
  const currentBlock =
    options.currentBlock ?? currentBlockForIndexedState(fallbackAdapter);
  if (currentBlock === null) {
    throw new Error(
      "Quote-api route lab requires currentBlock, FAME_POOL_STATE_CURRENT_BLOCK, or BASE_RPC_URL so compact quote freshness is checked against a live Base block.",
    );
  }
  const expectedSourceRegistryId =
    options.expectedSourceRegistryId ?? famePoolStateRegistrySourceId();
  const routerAddress = config.routerAddress ?? ROUTER_ADDRESS;
  const account = options.simulate ? simulationAccount() : null;
  const rows: FameRouteLabRow[] = [];

  for (const entry of corpus) {
    const diagnostics = createQuoteApiDiagnosticsRecorder(true);
    const adapter = createIndexedQuoteApiAdapter({
      quoteClient: options.quoteClient,
      fallback: fallbackAdapter,
      currentBlock,
      maxFreshnessBlocks: options.maxFreshnessBlocks,
      expectedSourceRegistryId,
      v4ZoraQuoteLaneActivation:
        options.v4ZoraQuoteLaneActivation ??
        routeLabV4ZoraActivation(expectedSourceRegistryId),
      diagnostics,
    });
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
      candidateFilter: candidateFilterForRouteLabTarget(options.targetFilter),
      now: new Date("2026-05-13T00:00:00Z"),
      adapter,
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation = await simulateQuote(
      quote,
      options.simulate ? (client as unknown as RouteLabClient | null) : null,
      account,
    );
    validateRouteLabTargetSelection({
      entry,
      quote,
      filter: options.targetFilter,
      mode: "quote-api",
    });

    rows.push({
      mode: "quote-api",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "live"),
      status: quote.status,
      message: displaySafeDiagnosticMessage(quote.message),
      requestedRouteId: requestedRouteId(options.targetFilter),
      routeArtifactId: routeArtifactIdForEvidence(quote, options.targetFilter),
      selectedCandidateId: selectedRouteArtifactId(quote),
      materializedRouteHash: materializedRouteHash(quote),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
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
      quoteApi: quoteApiSummary({
        sourceRegistryId: expectedSourceRegistryId,
        currentBlock,
        maxFreshnessBlocks: options.maxFreshnessBlocks,
        diagnostics: diagnostics.snapshot(),
      }),
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

function redactSensitiveDiagnosticText(value: string): string {
  return value
    .replace(/(?:https?|wss?):\/\/\S+/g, "[redacted-url]")
    .replace(/\b(?:bearer|token)\s+[a-z0-9._~+/=-]+/gi, "[redacted-secret]")
    .replace(/0x[a-fA-F0-9]{64,}/g, "[redacted-hex]");
}

function displaySafeAccountLabel(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function displaySafeDiagnosticMessage(
  value: unknown,
  fallback = "Route diagnostic unavailable.",
): string {
  const raw = value instanceof Error ? value.message : String(value);
  return redactSensitiveDiagnosticText(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length > 0 &&
          !/\b(request body|calldata|approval|swap request|private key|signer|authorization|api[-_ ]?key)\b|(?:^|\s)secret(?:[-_ ]?(?:key|token))?\s*[:=]/i.test(
            line,
          ),
      ) ?? fallback,
  );
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
      candidateFilter: candidateFilterForRouteLabTarget(options.targetFilter),
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: toAsyncQuoteAdapter(adapter),
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation: FameRouteLabSimulation = {
      status: "not_requested",
      message: "Deterministic route lab does not run live route simulation.",
    };
    validateRouteLabTargetSelection({
      entry,
      quote,
      filter: options.targetFilter,
      mode: "deterministic",
    });

    rows.push({
      mode: "deterministic",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "deterministic"),
      status: quote.status,
      message: displaySafeDiagnosticMessage(quote.message),
      requestedRouteId: requestedRouteId(options.targetFilter),
      routeArtifactId: routeArtifactIdForEvidence(quote, options.targetFilter),
      selectedCandidateId: selectedRouteArtifactId(quote),
      materializedRouteHash: materializedRouteHash(quote),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
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
      quoteApi: null,
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
      candidateFilter: candidateFilterForRouteLabTarget(options.targetFilter),
      now: new Date("2026-05-13T00:00:00Z"),
      adapter,
    });
    const edgeMatrix = routeEdgeMatrix(candidateSet, quote);
    const simulation = await simulateQuote(
      quote,
      options.simulate ? (client as unknown as RouteLabClient | null) : null,
      account,
    );
    validateRouteLabTargetSelection({
      entry,
      quote,
      filter: options.targetFilter,
      mode: "live",
    });

    rows.push({
      mode: "live",
      id: entry.id,
      pair: pairLabel(entry),
      amountIn: entry.amountIn.toString(),
      expectedStatus: expectedStatusFor(entry, "live"),
      status: quote.status,
      message: displaySafeDiagnosticMessage(quote.message),
      requestedRouteId: requestedRouteId(options.targetFilter),
      routeArtifactId: routeArtifactIdForEvidence(quote, options.targetFilter),
      selectedCandidateId: selectedRouteArtifactId(quote),
      materializedRouteHash: materializedRouteHash(quote),
      selectedPools: quote.status === "ready" ? quote.poolIds : [],
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
      quoteApi: null,
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
      `- Requested route: ${row.requestedRouteId ?? "n/a"}`,
      `- Selected route: ${row.routeArtifactId ?? "n/a"}`,
      `- Selected candidate: ${row.selectedCandidateId ?? "n/a"}`,
      `- Materialized route hash: ${row.materializedRouteHash ?? "n/a"}`,
      `- Selected pools: ${row.selectedPools.join(", ") || "none"}`,
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
      `- Quote API: ${quoteApiSummaryLine(row.quoteApi)}`,
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

function quoteApiSummaryLine(
  quoteApi: FameRouteLabRow["quoteApi"],
): string {
  if (!quoteApi) return "not used";
  const diagnostics = quoteApi.diagnostics;
  return [
    `registry ${quoteApi.sourceRegistryId}`,
    `block ${quoteApi.currentBlock.toString()}`,
    `used ${diagnostics.usedCount}`,
    `fallback ${diagnostics.fallbackCount}`,
    `batch failures ${diagnostics.batchFailureCount}`,
    `quoted ${diagnostics.statusCounts.quoted}`,
    `unavailable ${diagnostics.statusCounts.unavailable}`,
  ].join(", ");
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

function shouldRunCli(): boolean {
  return process.argv[1]?.endsWith("fame-swap-route-lab.ts") ?? false;
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
  if (!isAddress(value)) {
    throw new Error(`${name} must be an address.`);
  }
  return value as Address;
}

function routeLabTargetFilterFromCliArgs(
  args: readonly string[],
): FameRouteLabTargetFilter {
  return {
    caseId: cliValue(args, "--case"),
    routeId: cliValue(args, "--route"),
    poolId: cliValue(args, "--pool"),
    tokenIn: cliAddress(args, "--token-in"),
    tokenOut: cliAddress(args, "--token-out"),
  };
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

export function poolQuoteEndpointUrlFromEnv(): string | undefined {
  const url = poolApiBaseUrlFromEnv();
  if (!url) return undefined;
  const basePath = url.pathname.replace(/\/+$/u, "");
  url.pathname = `${basePath}/fame/pool-quotes`;
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

function routeLabQuoteApiClientFromEnv(): FamePoolQuoteClient {
  const endpointUrl = poolQuoteEndpointUrlFromEnv();
  const serviceToken = process.env.FAME_POOL_STATE_SERVICE_TOKEN;
  if (!endpointUrl || !serviceToken) {
    throw new Error(
      "Quote-api route lab requires FAME_POOL_API_URL and FAME_POOL_STATE_SERVICE_TOKEN.",
    );
  }
  return createIndexedQuoteApiClient({
    endpointUrl,
    serviceToken,
    timeoutMs: optionalSafeIntegerEnv("FAME_POOL_QUOTE_TIMEOUT_MS"),
  });
}

function optionalSafeIntegerEnv(name: string): number | undefined {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
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
    const args = process.argv.slice(2);
    const targetFilter = routeLabTargetFilterFromCliArgs(args);
    const corpus = filterRouteLabCorpus(FAME_ROUTE_CORPUS, targetFilter);
    const runQuoteApi =
      args.includes("--quote-api") ||
      (args.includes("--indexed") && args.includes("--simulate"));
    const rows = runQuoteApi
      ? await runQuoteApiRouteLab(corpus, {
          quoteClient: routeLabQuoteApiClientFromEnv(),
          currentBlock: await routeLabIndexedCurrentBlockFromEnv(),
          maxFreshnessBlocks: optionalSafeIntegerEnv(
            "FAME_POOL_QUOTE_MAX_FRESHNESS_BLOCKS",
          ),
          targetFilter,
          simulate: args.includes("--simulate"),
        })
      : args.includes("--live")
        ? await runLiveRouteLab(corpus, {
            simulate: args.includes("--simulate"),
            targetFilter,
          })
        : args.includes("--indexed")
        ? await runIndexedRouteLab(corpus, {
            poolStateClient: routeLabIndexedPoolStateClientFromEnv(),
            currentBlock: await routeLabIndexedCurrentBlockFromEnv(),
            maxFreshnessBlocks: optionalSafeIntegerEnv(
              "FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS",
            ),
            targetFilter,
          })
        : args.includes("--deterministic")
          ? await runRouteLab(corpus, { targetFilter })
          : await runSnapshotRouteLab(corpus, { targetFilter });
    if (args.includes("--markdown")) {
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

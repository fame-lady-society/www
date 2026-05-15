import type { Address } from "viem";
import { FAME, NATIVE_ETH, USDC, WETH } from "../../tokens";
import { buildFamePoolGraph, type FamePoolGraph } from "./buildGraph";
import { FAME_ROUTE_SPLIT_ALLOCATION_BPS } from "./split";
import {
  emptyCapabilities,
  type FameRouteCandidate,
  type FameRouteCandidateLeg,
  type FameRouteCandidateRejected,
  type FameRouteCandidateSet,
} from "./routePlan";
import { isNativeEthAddress, type FamePoolEdge } from "../poolUniverse";

export interface FameRouteCandidateBudgets {
  maxSimplePathLegs: number;
  maxCandidates: number;
  maxSplitCandidates: number;
  maxWorkUnits: number;
}

export const DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS: FameRouteCandidateBudgets = {
  maxSimplePathLegs: 3,
  maxCandidates: 96,
  maxSplitCandidates: 40,
  maxWorkUnits: 1_000,
};

interface CandidateBudgetState {
  workUnits: number;
  splitCandidates: number;
  diagnostics: Map<string, FameRouteCandidateRejected>;
}

function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

function sameAddress(left: Address, right: Address): boolean {
  return normalizedAddress(left) === normalizedAddress(right);
}

function supportedFamePair(tokenIn: Address, tokenOut: Address): boolean {
  const supportedAssets = [USDC, WETH, NATIVE_ETH];
  return (
    (sameAddress(tokenIn, FAME) &&
      supportedAssets.some((asset) => sameAddress(tokenOut, asset))) ||
    (sameAddress(tokenOut, FAME) &&
      supportedAssets.some((asset) => sameAddress(tokenIn, asset)))
  );
}

function usesWeth(legs: readonly FameRouteCandidateLeg[]): boolean {
  return legs.some(
    (leg) => sameAddress(leg.edge.tokenIn, WETH) || sameAddress(leg.edge.tokenOut, WETH),
  );
}

function usesNativeEth(legs: readonly FameRouteCandidateLeg[]): boolean {
  return legs.some(
    (leg) =>
      isNativeEthAddress(leg.edge.tokenIn) ||
      isNativeEthAddress(leg.edge.tokenOut),
  );
}

function usesNativeWrap(legs: readonly FameRouteCandidateLeg[]): boolean {
  return legs.some((leg) => leg.edge.venue === "NativeWrap");
}

function usesPermit2(legs: readonly FameRouteCandidateLeg[]): boolean {
  return legs.some(
    (leg) => leg.edge.venue === "UniswapV3" || leg.edge.venue === "UniswapV4",
  );
}

function usesV4Hooks(legs: readonly FameRouteCandidateLeg[]): boolean {
  return legs.some(
    (leg) => leg.edge.venue === "UniswapV4" && "hooks" in leg.edge.pool,
  );
}

function usesV4HookData(legs: readonly FameRouteCandidateLeg[]): boolean {
  return legs.some(
    (leg) =>
      leg.edge.venue === "UniswapV4" &&
      "hookData" in leg.edge.pool &&
      Boolean(leg.edge.pool.hookData && leg.edge.pool.hookData !== "0x"),
  );
}

function capabilitiesFor(
  legs: readonly FameRouteCandidateLeg[],
  split: boolean,
  splitThenMerge: boolean,
) {
  return emptyCapabilities({
    nativeEth: usesNativeEth(legs),
    weth: usesWeth(legs),
    nativeWrap: usesNativeWrap(legs),
    permit2UniversalRouter: usesPermit2(legs),
    v4Hooks: usesV4Hooks(legs),
    v4HookAddress: usesV4Hooks(legs),
    v4NonEmptyHookData: usesV4HookData(legs),
    split,
    splitThenMerge,
  });
}

function candidateId(
  kind: FameRouteCandidate["kind"],
  legs: readonly FameRouteCandidateLeg[],
): string {
  const poolPath = legs
    .map((leg) =>
      leg.allocationBps === null
        ? leg.edge.poolId
        : `${leg.edge.poolId}-${leg.allocationBps}bps`,
    )
    .join("--");
  return `solver-${kind}-${poolPath}`;
}

function summary(legs: readonly FameRouteCandidateLeg[]): string {
  return legs
    .map((leg) => `${leg.edge.poolId} (${leg.amountMode})`)
    .join(" -> ");
}

function buildCandidate(
  kind: FameRouteCandidate["kind"],
  tokenIn: Address,
  tokenOut: Address,
  legs: FameRouteCandidateLeg[],
): FameRouteCandidate {
  return {
    id: candidateId(kind, legs),
    kind,
    tokenIn,
    tokenOut,
    legs,
    capabilities: capabilitiesFor(legs, kind !== "single_path", kind === "split_merge"),
    summary: summary(legs),
  };
}

function normalizeBudgets(
  budgets: Partial<FameRouteCandidateBudgets> | undefined,
): FameRouteCandidateBudgets {
  return {
    maxSimplePathLegs: Math.max(
      1,
      budgets?.maxSimplePathLegs ?? DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS.maxSimplePathLegs,
    ),
    maxCandidates: Math.max(
      1,
      budgets?.maxCandidates ?? DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS.maxCandidates,
    ),
    maxSplitCandidates: Math.max(
      0,
      budgets?.maxSplitCandidates ??
        DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS.maxSplitCandidates,
    ),
    maxWorkUnits: Math.max(
      1,
      budgets?.maxWorkUnits ?? DEFAULT_FAME_ROUTE_CANDIDATE_BUDGETS.maxWorkUnits,
    ),
  };
}

function emptyBudgetState(): CandidateBudgetState {
  return {
    workUnits: 0,
    splitCandidates: 0,
    diagnostics: new Map(),
  };
}

function addBudgetDiagnostic(
  state: CandidateBudgetState,
  reason: string,
  detail: string,
) {
  if (!state.diagnostics.has(reason)) {
    state.diagnostics.set(reason, { reason, detail });
  }
}

function spendWork(
  state: CandidateBudgetState,
  budgets: FameRouteCandidateBudgets,
): boolean {
  if (state.workUnits >= budgets.maxWorkUnits) {
    addBudgetDiagnostic(
      state,
      "candidate_work_budget_exceeded",
      `Candidate generation stopped after ${budgets.maxWorkUnits.toString()} work units.`,
    );
    return false;
  }
  state.workUnits += 1;
  return true;
}

function simplePathCandidates(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
  budgets: FameRouteCandidateBudgets,
  state: CandidateBudgetState,
): FameRouteCandidate[] {
  const candidates: FameRouteCandidate[] = [];

  function visit(
    currentToken: Address,
    path: FamePoolEdge[],
    visitedPools: ReadonlySet<string>,
    visitedTokens: ReadonlySet<string>,
  ) {
    if (path.length > 0 && sameAddress(currentToken, tokenOut)) {
      const legs = path.map((edge, index) => ({
        edge,
        amountMode: index === 0 ? ("Exact" as const) : ("All" as const),
        allocationBps: null,
      }));
      candidates.push(buildCandidate("single_path", tokenIn, tokenOut, legs));
      return;
    }

    if (path.length >= budgets.maxSimplePathLegs) return;

    for (const edge of graph.edgesFrom(currentToken)) {
      if (!spendWork(state, budgets)) return;
      if (!edge.manifestReady) continue;
      if (visitedPools.has(edge.poolId)) continue;

      const nextTokenKey = normalizedAddress(edge.tokenOut);
      if (visitedTokens.has(nextTokenKey) && !sameAddress(edge.tokenOut, tokenOut)) {
        continue;
      }

      visit(
        edge.tokenOut,
        [...path, edge],
        new Set([...visitedPools, edge.poolId]),
        new Set([...visitedTokens, nextTokenKey]),
      );
    }
  }

  visit(
    tokenIn,
    [],
    new Set(),
    new Set([normalizedAddress(tokenIn)]),
  );

  return candidates;
}

function directEdges(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
): FamePoolEdge[] {
  return graph
    .edgesFrom(tokenIn)
    .filter((edge) => edge.manifestReady && sameAddress(edge.tokenOut, tokenOut));
}

function splitCandidates(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
  budgets: FameRouteCandidateBudgets,
  state: CandidateBudgetState,
): FameRouteCandidate[] {
  const direct = directEdges(graph, tokenIn, tokenOut);
  const candidates: FameRouteCandidate[] = [];

  for (let leftIndex = 0; leftIndex < direct.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < direct.length; rightIndex += 1) {
      for (const allocationBps of FAME_ROUTE_SPLIT_ALLOCATION_BPS) {
        if (!spendWork(state, budgets)) return candidates;
        if (state.splitCandidates >= budgets.maxSplitCandidates) {
          addBudgetDiagnostic(
            state,
            "split_candidate_budget_exceeded",
            `Split candidate generation stopped after ${budgets.maxSplitCandidates.toString()} split candidates.`,
          );
          return candidates;
        }
        state.splitCandidates += 1;
        candidates.push(
          buildCandidate("split", tokenIn, tokenOut, [
            {
              edge: direct[leftIndex],
              amountMode: "Exact",
              allocationBps,
            },
            {
              edge: direct[rightIndex],
              amountMode: "All",
              allocationBps: 10_000 - allocationBps,
            },
          ]),
        );
      }
    }
  }

  return candidates;
}

function splitMergeCandidates(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
  budgets: FameRouteCandidateBudgets,
  state: CandidateBudgetState,
): FameRouteCandidate[] {
  const firstHopGroups = new Map<string, FamePoolEdge[]>();
  for (const edge of graph.edgesFrom(tokenIn)) {
    if (!spendWork(state, budgets)) break;
    if (!edge.manifestReady) continue;
    if (sameAddress(edge.tokenOut, tokenOut) || sameAddress(edge.tokenOut, tokenIn)) {
      continue;
    }
    const key = normalizedAddress(edge.tokenOut);
    firstHopGroups.set(key, [...(firstHopGroups.get(key) ?? []), edge]);
  }

  const candidates: FameRouteCandidate[] = [];
  const orderedFirstHopGroups = [...firstHopGroups.entries()].sort(
    ([leftKey, leftEdges], [rightKey, rightEdges]) =>
      leftEdges.length - rightEdges.length || leftKey.localeCompare(rightKey),
  );
  for (const [, firstHopEdges] of orderedFirstHopGroups) {
    if (firstHopEdges.length < 2) continue;

    const mergeEdges = directEdges(graph, firstHopEdges[0].tokenOut, tokenOut);
    for (let leftIndex = 0; leftIndex < firstHopEdges.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < firstHopEdges.length;
        rightIndex += 1
      ) {
        for (const mergeEdge of mergeEdges) {
          for (const allocationBps of FAME_ROUTE_SPLIT_ALLOCATION_BPS) {
            if (!spendWork(state, budgets)) return candidates;
            if (state.splitCandidates >= budgets.maxSplitCandidates) {
              addBudgetDiagnostic(
                state,
                "split_candidate_budget_exceeded",
                `Split candidate generation stopped after ${budgets.maxSplitCandidates.toString()} split candidates.`,
              );
              return candidates;
            }
            state.splitCandidates += 1;
            candidates.push(
              buildCandidate("split_merge", tokenIn, tokenOut, [
                {
                  edge: firstHopEdges[leftIndex],
                  amountMode: "Exact",
                  allocationBps,
                },
                {
                  edge: firstHopEdges[rightIndex],
                  amountMode: "All",
                  allocationBps: 10_000 - allocationBps,
                },
                {
                  edge: mergeEdge,
                  amountMode: "All",
                  allocationBps: null,
                },
              ]),
            );
          }
        }
      }
    }
  }

  return candidates;
}

function dedupeAndCapCandidates(
  candidates: readonly FameRouteCandidate[],
  budgets: FameRouteCandidateBudgets,
  state: CandidateBudgetState,
): FameRouteCandidate[] {
  const deduped = new Map<string, FameRouteCandidate>();
  for (const candidate of candidates.slice().sort((left, right) => left.id.localeCompare(right.id))) {
    if (!deduped.has(candidate.id)) deduped.set(candidate.id, candidate);
  }

  const result = [...deduped.values()];
  if (result.length <= budgets.maxCandidates) return result;

  addBudgetDiagnostic(
    state,
    "candidate_count_budget_exceeded",
    `Candidate generation kept the first ${budgets.maxCandidates.toString()} deterministic candidates out of ${result.length.toString()}.`,
  );
  return result.slice(0, budgets.maxCandidates);
}

export function routeCandidatesForPair(
  tokenIn: Address,
  tokenOut: Address,
  graph: FamePoolGraph = buildFamePoolGraph(),
  options: {
    budgets?: Partial<FameRouteCandidateBudgets>;
  } = {},
): FameRouteCandidateSet {
  const rejected: FameRouteCandidateRejected[] = [];
  const budgets = normalizeBudgets(options.budgets);
  const budgetState = emptyBudgetState();

  if (!supportedFamePair(tokenIn, tokenOut)) {
    return {
      candidates: [],
      rejected: [
        {
          reason: "unsupported_pair",
          detail: "Only FAME paired with USDC, WETH, or native ETH is supported.",
        },
      ],
    };
  }

  let candidates = dedupeAndCapCandidates(
    [
      ...simplePathCandidates(graph, tokenIn, tokenOut, budgets, budgetState),
      ...splitCandidates(graph, tokenIn, tokenOut, budgets, budgetState),
      ...splitMergeCandidates(graph, tokenIn, tokenOut, budgets, budgetState),
    ],
    budgets,
    budgetState,
  );

  if (candidates.length === 0) {
    rejected.push({
      reason: "no_candidate_path",
      detail: "No known pinned pool path can connect this FAME pair.",
    });
  }

  return {
    candidates,
    rejected: [...rejected, ...budgetState.diagnostics.values()],
  };
}

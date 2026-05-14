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

const MAX_SIMPLE_PATH_LEGS = 3;

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

function touchesWethAddress(legs: readonly FameRouteCandidateLeg[]): boolean {
  return legs.some(
    (leg) =>
      sameAddress(leg.edge.tokenIn, WETH) || sameAddress(leg.edge.tokenOut, WETH),
  );
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

function simplePathCandidates(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
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

    if (path.length >= MAX_SIMPLE_PATH_LEGS) return;

    for (const edge of graph.edgesFrom(currentToken)) {
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
    .filter((edge) => sameAddress(edge.tokenOut, tokenOut));
}

function splitCandidates(
  graph: FamePoolGraph,
  tokenIn: Address,
  tokenOut: Address,
): FameRouteCandidate[] {
  const direct = directEdges(graph, tokenIn, tokenOut);
  const candidates: FameRouteCandidate[] = [];

  for (let leftIndex = 0; leftIndex < direct.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < direct.length; rightIndex += 1) {
      for (const allocationBps of FAME_ROUTE_SPLIT_ALLOCATION_BPS) {
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
): FameRouteCandidate[] {
  const firstHopGroups = new Map<string, FamePoolEdge[]>();
  for (const edge of graph.edgesFrom(tokenIn)) {
    if (sameAddress(edge.tokenOut, tokenOut) || sameAddress(edge.tokenOut, tokenIn)) {
      continue;
    }
    const key = normalizedAddress(edge.tokenOut);
    firstHopGroups.set(key, [...(firstHopGroups.get(key) ?? []), edge]);
  }

  const candidates: FameRouteCandidate[] = [];
  for (const firstHopEdges of firstHopGroups.values()) {
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

export function routeCandidatesForPair(
  tokenIn: Address,
  tokenOut: Address,
  graph: FamePoolGraph = buildFamePoolGraph(),
): FameRouteCandidateSet {
  const rejected: FameRouteCandidateRejected[] = [];

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

  let candidates = [
    ...simplePathCandidates(graph, tokenIn, tokenOut),
    ...splitCandidates(graph, tokenIn, tokenOut),
    ...splitMergeCandidates(graph, tokenIn, tokenOut),
  ];
  if (isNativeEthAddress(tokenIn) || isNativeEthAddress(tokenOut)) {
    candidates = candidates.filter(
      (candidate) => !touchesWethAddress(candidate.legs),
    );
  }

  if (candidates.length === 0) {
    rejected.push({
      reason: "no_candidate_path",
      detail: "No known pinned pool path can connect this FAME pair.",
    });
  }

  return {
    candidates,
    rejected,
  };
}

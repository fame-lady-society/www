import type { Address } from "viem";
import { WETH } from "../../tokens";
import type { AmountModeName, FameRouteCapabilities } from "../../router/types";
import type {
  FameRouteCandidate,
  FameRouteCandidateLeg,
  FameRouteCandidateKind,
} from "../graph/routePlan";
import { emptyCapabilities } from "../graph/routePlan";
import { isNativeEthAddress, type FamePoolEdge } from "../poolUniverse";
import type {
  FameOptimizerAllocation,
  FameOptimizerRouteTemplate,
} from "./types";

function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

function sameAddress(left: Address, right: Address): boolean {
  return normalizedAddress(left) === normalizedAddress(right);
}

function usesWeth(legs: readonly FameRouteCandidateLeg[]): boolean {
  return legs.some(
    (leg) =>
      sameAddress(leg.edge.tokenIn, WETH) ||
      sameAddress(leg.edge.tokenOut, WETH),
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
  kind: FameRouteCandidateKind,
): FameRouteCapabilities {
  return emptyCapabilities({
    nativeEth: usesNativeEth(legs),
    weth: usesWeth(legs),
    nativeWrap: usesNativeWrap(legs),
    permit2UniversalRouter: usesPermit2(legs),
    v4Hooks: usesV4Hooks(legs),
    v4HookAddress: usesV4Hooks(legs),
    v4NonEmptyHookData: usesV4HookData(legs),
    split: kind !== "single_path",
    splitThenMerge: kind === "split_merge",
  });
}

function summary(legs: readonly FameRouteCandidateLeg[]): string {
  return legs
    .map((leg) => `${leg.edge.poolId} (${leg.amountMode})`)
    .join(" -> ");
}

function candidateId(
  template: FameOptimizerRouteTemplate,
  allocation: FameOptimizerAllocation,
): string {
  if (allocation === null) {
    return `optimizer-${template.id}`;
  }
  if (Array.isArray(allocation)) {
    return `optimizer-${template.id}-${allocation.join("-")}bps`;
  }
  return `optimizer-${template.id}-${allocation.toString()}bps`;
}

function leg(
  edge: FamePoolEdge,
  amountMode: AmountModeName,
  allocationBps: number | null,
): FameRouteCandidateLeg {
  return {
    edge,
    amountMode,
    allocationBps,
  };
}

function buildCandidate(
  template: FameOptimizerRouteTemplate,
  kind: FameRouteCandidateKind,
  legs: FameRouteCandidateLeg[],
  allocation: FameOptimizerAllocation,
): FameRouteCandidate {
  return {
    id: candidateId(template, allocation),
    kind,
    tokenIn: template.tokenIn,
    tokenOut: template.tokenOut,
    legs,
    capabilities: capabilitiesFor(legs, kind),
    summary: summary(legs),
  };
}

function singlePathFromEdges(
  template: FameOptimizerRouteTemplate,
  edges: readonly FamePoolEdge[],
  allocationBps: number,
): FameRouteCandidate {
  const legs = edges.map((edge, index) =>
    leg(edge, index === 0 ? "Exact" : "All", null),
  );
  return buildCandidate(template, "single_path", legs, allocationBps);
}

function templatePrefix(
  template: FameOptimizerRouteTemplate,
): readonly FamePoolEdge[] {
  return template.prefix ?? [];
}

function validateAllocationVector(
  template: FameOptimizerRouteTemplate,
  vector: readonly number[],
): number[] {
  if (vector.length !== template.branches.length) {
    throw new Error(
      `${template.id} allocation vector does not match branches.`,
    );
  }
  const normalized = vector.map((bps) => {
    if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
      throw new Error(
        `${template.id} allocation vector bps must be between 0 and 10000.`,
      );
    }
    return bps;
  });
  const total = normalized.reduce((sum, bps) => sum + bps, 0);
  if (total !== 10_000) {
    throw new Error(`${template.id} allocation vector must sum to 10000.`);
  }
  return normalized;
}

function allocationVector(
  template: FameOptimizerRouteTemplate,
  allocation: FameOptimizerAllocation,
): number[] {
  if (Array.isArray(allocation)) {
    return validateAllocationVector(template, allocation);
  }
  if (template.branches.length !== 2) {
    throw new Error(`${template.id} requires an allocation vector.`);
  }
  const bps = typeof allocation === "number" ? allocation : 10_000;
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error(
      `${template.id} allocation bps must be between 0 and 10000.`,
    );
  }
  return [bps, 10_000 - bps];
}

function sequentialBranchLegs(
  branches: readonly FameOptimizerRouteTemplate["branches"][number][],
  vector: readonly number[],
): FameRouteCandidateLeg[] {
  const nonZero = branches
    .map((branch, index) => ({ branch, bps: vector[index] ?? 0 }))
    .filter((entry) => entry.bps > 0);
  if (nonZero.length === 0) return [];
  if (nonZero.length === 1) {
    return [leg(nonZero[0].branch.edge, "Exact", null)];
  }

  let remainingBps = 10_000;
  return nonZero.map((entry, index) => {
    if (index === nonZero.length - 1) {
      return leg(entry.branch.edge, "All", entry.bps);
    }

    const sequentialBps = Math.min(
      10_000,
      Math.floor((entry.bps * 10_000) / remainingBps),
    );
    remainingBps -= entry.bps;
    return leg(entry.branch.edge, "Exact", sequentialBps);
  });
}

export function materializeOptimizerTemplate(
  template: FameOptimizerRouteTemplate,
  allocation: FameOptimizerAllocation,
): FameRouteCandidate {
  if (template.kind === "single_path") {
    if (!template.baselineCandidate) {
      throw new Error(`${template.id} has no baseline candidate.`);
    }
    return template.baselineCandidate;
  }

  const vector = allocationVector(template, allocation);
  const prefix = templatePrefix(template);
  const nonZeroBranches = template.branches.filter(
    (_branch, index) => (vector[index] ?? 0) > 0,
  );
  if (nonZeroBranches.length === 1) {
    const onlyBranch = nonZeroBranches[0];
    if (!onlyBranch) {
      throw new Error(`${template.id} allocation produced no branch.`);
    }
    return singlePathFromEdges(
      template,
      [...prefix, onlyBranch.edge, ...template.suffix],
      vector[template.branches.indexOf(onlyBranch)] ?? 10_000,
    );
  }

  const branchLegs = sequentialBranchLegs(template.branches, vector);
  if (branchLegs.length < 2) {
    throw new Error(`${template.id} allocation produced no executable split.`);
  }

  if (template.kind === "direct_split") {
    return buildCandidate(template, "split", branchLegs, allocation);
  }

  if (template.kind === "terminal_split") {
    return buildCandidate(
      template,
      "split_merge",
      [
        ...prefix.map((edge, index) =>
          leg(edge, index === 0 ? "Exact" : "All", null),
        ),
        ...branchLegs,
        ...template.suffix.map((edge) => leg(edge, "All", null)),
      ],
      allocation,
    );
  }

  return buildCandidate(
    template,
    "split_merge",
    [...branchLegs, ...template.suffix.map((edge) => leg(edge, "All", null))],
    allocation,
  );
}

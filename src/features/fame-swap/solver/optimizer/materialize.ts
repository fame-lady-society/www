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
import type { FameOptimizerRouteTemplate } from "./types";

function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

function sameAddress(left: Address, right: Address): boolean {
  return normalizedAddress(left) === normalizedAddress(right);
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
  allocationBps: number | null,
): string {
  return allocationBps === null
    ? `optimizer-${template.id}`
    : `optimizer-${template.id}-${allocationBps.toString()}bps`;
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
  allocationBps: number | null,
): FameRouteCandidate {
  return {
    id: candidateId(template, allocationBps),
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

function templatePrefix(template: FameOptimizerRouteTemplate): readonly FamePoolEdge[] {
  return template.prefix ?? [];
}

export function materializeOptimizerTemplate(
  template: FameOptimizerRouteTemplate,
  allocationBps: number | null,
): FameRouteCandidate {
  if (template.kind === "single_path") {
    if (!template.baselineCandidate) {
      throw new Error(`${template.id} has no baseline candidate.`);
    }
    return template.baselineCandidate;
  }

  if (template.branches.length !== 2) {
    throw new Error(`${template.id} is not a two-branch template.`);
  }

  const bps = allocationBps ?? 10_000;
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error(`${template.id} allocation bps must be between 0 and 10000.`);
  }

  const left = template.branches[0].edge;
  const right = template.branches[1].edge;
  const prefix = templatePrefix(template);
  if (bps === 10_000) {
    return singlePathFromEdges(template, [...prefix, left, ...template.suffix], bps);
  }
  if (bps === 0) {
    return singlePathFromEdges(template, [...prefix, right, ...template.suffix], bps);
  }

  if (template.kind === "direct_split") {
    return buildCandidate(
      template,
      "split",
      [leg(left, "Exact", bps), leg(right, "All", 10_000 - bps)],
      bps,
    );
  }

  if (template.kind === "terminal_split") {
    return buildCandidate(
      template,
      "split_merge",
      [
        ...prefix.map((edge, index) =>
          leg(edge, index === 0 ? "Exact" : "All", null),
        ),
        leg(left, "Exact", bps),
        leg(right, "All", 10_000 - bps),
        ...template.suffix.map((edge) => leg(edge, "All", null)),
      ],
      bps,
    );
  }

  return buildCandidate(
    template,
    "split_merge",
    [
      leg(left, "Exact", bps),
      leg(right, "All", 10_000 - bps),
      ...template.suffix.map((edge) => leg(edge, "All", null)),
    ],
    bps,
  );
}

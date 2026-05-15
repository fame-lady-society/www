import type { Address } from "viem";
import type { AmountModeName, FameRouteCapabilities } from "../../router/types";
import type { FamePoolEdge } from "../poolUniverse";

export type FameRouteCandidateKind = "single_path" | "split" | "split_merge";

export interface FameRouteCandidateLeg {
  edge: FamePoolEdge;
  amountMode: AmountModeName;
  allocationBps: number | null;
}

export interface FameRouteCandidate {
  id: string;
  kind: FameRouteCandidateKind;
  tokenIn: Address;
  tokenOut: Address;
  legs: FameRouteCandidateLeg[];
  capabilities: FameRouteCapabilities;
  summary: string;
}

export interface FameRouteCandidateRejected {
  reason: string;
  detail: string;
}

export interface FameRouteCandidateSet {
  candidates: FameRouteCandidate[];
  rejected: FameRouteCandidateRejected[];
}

export function emptyCapabilities(
  overrides: Partial<FameRouteCapabilities> = {},
): FameRouteCapabilities {
  return {
    nativeEth: false,
    weth: false,
    nativeWrap: false,
    permit2UniversalRouter: false,
    v4Hooks: false,
    v4HookAddress: false,
    v4NonEmptyHookData: false,
    v4MultiHopPathKeys: false,
    split: false,
    splitThenMerge: false,
    ...overrides,
  };
}

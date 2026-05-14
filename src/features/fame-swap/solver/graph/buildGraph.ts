import type { Address } from "viem";
import { famePoolEdges, type FamePoolEdge } from "../poolUniverse";

export interface FamePoolGraph {
  edges: readonly FamePoolEdge[];
  edgesFrom(token: Address): readonly FamePoolEdge[];
}

export interface FamePoolGraphOptions {
  includeManifestDisabled?: boolean;
}

function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

export function buildFamePoolGraph(
  edges: readonly FamePoolEdge[] = famePoolEdges(),
  options: FamePoolGraphOptions = {},
): FamePoolGraph {
  const graphEdges = edges
    .filter((edge) => options.includeManifestDisabled || edge.manifestReady)
    .slice()
    .sort((left, right) => {
      const tokenCompare = normalizedAddress(left.tokenIn).localeCompare(
        normalizedAddress(right.tokenIn),
      );
      if (tokenCompare !== 0) return tokenCompare;
      return left.poolId.localeCompare(right.poolId);
    });
  const edgesByInput = new Map<string, FamePoolEdge[]>();

  for (const edge of graphEdges) {
    const key = normalizedAddress(edge.tokenIn);
    const existing = edgesByInput.get(key) ?? [];
    existing.push(edge);
    edgesByInput.set(key, existing);
  }

  return {
    edges: graphEdges,
    edgesFrom(token) {
      return edgesByInput.get(normalizedAddress(token)) ?? [];
    },
  };
}

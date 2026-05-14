import type { Address } from "viem";
import { famePoolEdges, type FamePoolEdge } from "../poolUniverse";

export interface FamePoolGraph {
  edges: readonly FamePoolEdge[];
  edgesFrom(token: Address): readonly FamePoolEdge[];
}

function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

export function buildFamePoolGraph(
  edges: readonly FamePoolEdge[] = famePoolEdges(),
): FamePoolGraph {
  const readyEdges = edges
    .filter((edge) => edge.manifestReady)
    .slice()
    .sort((left, right) => {
      const tokenCompare = normalizedAddress(left.tokenIn).localeCompare(
        normalizedAddress(right.tokenIn),
      );
      if (tokenCompare !== 0) return tokenCompare;
      return left.poolId.localeCompare(right.poolId);
    });
  const edgesByInput = new Map<string, FamePoolEdge[]>();

  for (const edge of readyEdges) {
    const key = normalizedAddress(edge.tokenIn);
    const existing = edgesByInput.get(key) ?? [];
    existing.push(edge);
    edgesByInput.set(key, existing);
  }

  return {
    edges: readyEdges,
    edgesFrom(token) {
      return edgesByInput.get(normalizedAddress(token)) ?? [];
    },
  };
}

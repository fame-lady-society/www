import type { Address } from "viem";
import type { FameRouteLeg } from "../router/types";
import { formatTokenAmount } from "../solver/format";
import type {
  FameSwapExecutableQuote,
  FameSwapRouteDisplayLeg,
} from "../solver/types";
import { tokenForAddress } from "../tokens";
import { poolDisplayMetadata } from "./poolDisplay";
import {
  routeTokenMetadataForAddress,
  type FameRouteTokenMetadata,
} from "./routeMetadata";

export type FameSwapRouteGraphTopology = "serial" | "split" | "split_merge";

export type FameSwapRouteGraphShareSource =
  | "quoted_amount"
  | "allocation_bps"
  | "unavailable";

export interface FameSwapRouteGraphShare {
  source: FameSwapRouteGraphShareSource;
  label: string;
  bps: number | null;
  amountLabel: string | null;
}

export interface FameSwapRouteGraphTokenNode {
  id: string;
  address: Address;
  token: FameRouteTokenMetadata;
  column: number;
  lane: number;
}

export interface FameSwapRouteGraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromToken: FameRouteTokenMetadata;
  toToken: FameRouteTokenMetadata;
  lane: number;
  column: number;
  venue: FameRouteLeg["venue"];
  venueLabel: string;
  poolId: string | null;
  poolName: string;
  poolTypeLabel: string;
  pairLabel: string;
  feeLabel: string;
  feeAmountLabel: string | null;
  feeDetailLabel: string;
  feeTooltip: string | null;
  amountMode: FameRouteLeg["amountMode"];
  amountLabel: string | null;
  share: FameSwapRouteGraphShare;
  branchGroupId: string | null;
  mergeGroupId: string | null;
  reviewed: boolean;
}

export interface FameSwapRouteGraphGroup {
  id: string;
  nodeId: string;
  edgeIds: string[];
}

export interface FameSwapRouteGraph {
  summary: string;
  topology: FameSwapRouteGraphTopology;
  nodes: FameSwapRouteGraphTokenNode[];
  edges: FameSwapRouteGraphEdge[];
  branchGroups: FameSwapRouteGraphGroup[];
  mergeGroups: FameSwapRouteGraphGroup[];
  semanticLines: string[];
}

interface MutableNode extends FameSwapRouteGraphTokenNode {}

interface MutableEdge extends Omit<FameSwapRouteGraphEdge, "share"> {
  legIndex: number;
  quotedAmountIn: bigint | null;
  allocationBps: number | null;
  share: FameSwapRouteGraphShare;
}

function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

function nodeKey(address: Address, column: number): string {
  return `${normalizedAddress(address)}:${column}`;
}

function nodeId(address: Address, column: number): string {
  return `token-${normalizedAddress(address)}-${column}`;
}

function edgeConnectionKey(
  edge: Pick<FameSwapRouteGraphEdge, "fromNodeId" | "toNodeId">,
): string {
  return `${edge.fromNodeId}->${edge.toNodeId}`;
}

function edgeId(
  index: number,
  leg: FameRouteLeg,
  poolId: string | undefined,
): string {
  return `edge-${index}-${poolId ?? leg.venue}-${leg.amountMode}`;
}

function routeToken(address: Address): FameRouteTokenMetadata {
  return routeTokenMetadataForAddress(address);
}

function routePath(nodes: readonly FameSwapRouteGraphTokenNode[]): string {
  return nodes
    .slice()
    .sort((left, right) => left.column - right.column || left.lane - right.lane)
    .map((node) => node.token.symbol)
    .filter((symbol, index, symbols) => symbols[index - 1] !== symbol)
    .join(" -> ");
}

function formatBps(bps: number): string {
  const percent = bps / 100;
  return Number.isInteger(percent)
    ? `${percent.toFixed(0)}%`
    : `${percent.toFixed(2)}%`;
}

function bpsFromShare(amount: bigint, total: bigint): number {
  if (total <= 0n) return 0;
  return Number((amount * 10_000n) / total);
}

function legAmountLabel(leg: FameRouteLeg): string | null {
  if (leg.amountMode === "All") return "remaining";
  if (leg.amountMode !== "Exact") return null;

  const token = tokenForAddress(leg.tokenIn);
  return token ? formatTokenAmount(leg.amount, token) : null;
}

function quotedAmountLabel(
  address: Address,
  amount: bigint | null,
): string | null {
  if (amount === null) return null;
  const token = tokenForAddress(address);
  return token ? formatTokenAmount(amount, token) : null;
}

function venueFeeTooltip(poolName: string, feeLabel: string): string {
  return `${poolName} uses reviewed pool metadata for a ${feeLabel} venue fee tier. Venue fees are already included in the quoted output; this is not a live fee read.`;
}

function unavailableVenueFeeTooltip(poolName: string, reason: string): string {
  return `${poolName} has no reviewed venue fee metadata: ${reason}`;
}

function poolFeeAmountLabel(
  leg: FameSwapExecutableQuote["feeBreakdown"]["legs"][number] | undefined,
): string | null {
  if (!leg || leg.fee.status !== "available") return null;
  const token = tokenForAddress(leg.tokenIn);
  if (!token) return null;

  const feePpm = Math.round(leg.fee.feeBps * 100);
  if (feePpm <= 0) return null;

  const feeAmount = (leg.amountIn * BigInt(feePpm)) / 1_000_000n;
  return formatTokenAmount(feeAmount, token);
}

function poolFeeDetailLabel(options: {
  leg: FameSwapExecutableQuote["feeBreakdown"]["legs"][number] | undefined;
  feeLabel: string;
  feeAmountLabel: string | null;
}): string {
  const inputLabel = options.leg
    ? quotedAmountLabel(options.leg.tokenIn, options.leg.amountIn)
    : null;

  if (options.feeAmountLabel && inputLabel) {
    return `${options.feeAmountLabel} pool fee on ${inputLabel} route input (${options.feeLabel}).`;
  }

  if (options.leg?.fee.status === "available") {
    return `${options.feeLabel} pool fee tier, included in the quoted output.`;
  }

  return "Pool fee amount unavailable for this selected leg.";
}

function shareUnavailable(edge: MutableEdge): FameSwapRouteGraphShare {
  if (edge.amountMode === "All") {
    return {
      source: "unavailable",
      label: "remaining",
      bps: null,
      amountLabel: edge.amountLabel,
    };
  }

  return {
    source: "unavailable",
    label: "share unavailable",
    bps: null,
    amountLabel: edge.amountLabel,
  };
}

function quotedShare(
  edge: MutableEdge,
  groupTotal: bigint,
): FameSwapRouteGraphShare {
  if (edge.quotedAmountIn === null || groupTotal <= 0n)
    return shareUnavailable(edge);
  const bps = bpsFromShare(edge.quotedAmountIn, groupTotal);
  return {
    source: "quoted_amount",
    label: formatBps(bps),
    bps,
    amountLabel: quotedAmountLabel(edge.fromToken.address, edge.quotedAmountIn),
  };
}

function allocationShare(edge: MutableEdge): FameSwapRouteGraphShare {
  if (edge.allocationBps === null) return shareUnavailable(edge);
  return {
    source: "allocation_bps",
    label: formatBps(edge.allocationBps),
    bps: edge.allocationBps,
    amountLabel: edge.amountLabel,
  };
}

function applyBranchGroups(edges: MutableEdge[]): FameSwapRouteGraphGroup[] {
  const byConnection = new Map<string, MutableEdge[]>();
  for (const edge of edges) {
    const key = edgeConnectionKey(edge);
    byConnection.set(key, [...(byConnection.get(key) ?? []), edge]);
  }

  const branchGroups: FameSwapRouteGraphGroup[] = [];

  for (const [index, groupEdges] of [...byConnection.values()].entries()) {
    if (groupEdges.length <= 1) {
      const edge = groupEdges[0];
      edge.share =
        edge.allocationBps !== null
          ? allocationShare(edge)
          : shareUnavailable(edge);
      continue;
    }

    const branchGroupId = `branch-${index}`;
    const quotedTotal = groupEdges.every((edge) => edge.quotedAmountIn !== null)
      ? groupEdges.reduce(
          (total, edge) => total + (edge.quotedAmountIn ?? 0n),
          0n,
        )
      : null;
    const hasAllocationFallback = groupEdges.every(
      (edge) => edge.allocationBps !== null,
    );
    const midpoint = (groupEdges.length - 1) / 2;

    for (const [laneIndex, edge] of groupEdges.entries()) {
      edge.branchGroupId = branchGroupId;
      edge.lane = laneIndex - midpoint;
      if (quotedTotal !== null && quotedTotal > 0n) {
        edge.share = quotedShare(edge, quotedTotal);
      } else if (hasAllocationFallback) {
        edge.share = allocationShare(edge);
      } else {
        edge.share = shareUnavailable(edge);
      }
    }

    branchGroups.push({
      id: branchGroupId,
      nodeId: groupEdges[0].fromNodeId,
      edgeIds: groupEdges.map((edge) => edge.id),
    });
  }

  return branchGroups;
}

function applyMergeGroups(edges: MutableEdge[]): FameSwapRouteGraphGroup[] {
  const branchTargetNodeIds = new Set(
    edges.filter((edge) => edge.branchGroupId).map((edge) => edge.toNodeId),
  );
  const mergeGroups: FameSwapRouteGraphGroup[] = [];

  for (const nodeId of branchTargetNodeIds) {
    const outgoing = edges.filter((edge) => edge.fromNodeId === nodeId);
    if (outgoing.length === 0) continue;

    const mergeGroupId = `merge-${mergeGroups.length}`;
    for (const edge of outgoing) {
      edge.mergeGroupId = mergeGroupId;
    }
    mergeGroups.push({
      id: mergeGroupId,
      nodeId,
      edgeIds: outgoing.map((edge) => edge.id),
    });
  }

  return mergeGroups;
}

function graphTopology(
  branchGroups: readonly FameSwapRouteGraphGroup[],
  mergeGroups: readonly FameSwapRouteGraphGroup[],
): FameSwapRouteGraphTopology {
  if (mergeGroups.length > 0) return "split_merge";
  if (branchGroups.length > 0) return "split";
  return "serial";
}

function semanticLines(graph: {
  edges: readonly FameSwapRouteGraphEdge[];
  topology: FameSwapRouteGraphTopology;
}): string[] {
  const prefix =
    graph.topology === "split_merge"
      ? "Split route with merge"
      : graph.topology === "split"
        ? "Split route"
        : "Serial route";

  return [
    `${prefix}: ${graph.edges
      .map((edge) => `${edge.fromToken.symbol} to ${edge.toToken.symbol}`)
      .join(", ")}.`,
    ...graph.edges.map((edge) => {
      const share =
        edge.share.source === "unavailable"
          ? edge.share.label
          : `${edge.share.label} ${edge.share.source === "quoted_amount" ? "quoted input" : "allocation"}`;
      return `${edge.fromToken.symbol} to ${edge.toToken.symbol} through ${edge.venueLabel} ${edge.pairLabel}, ${edge.poolTypeLabel}, ${edge.feeLabel}, ${share}.`;
    }),
  ];
}

function createNode(
  nodes: MutableNode[],
  nodeByAddress: Map<string, MutableNode>,
  address: Address,
  column: number,
): MutableNode {
  const key = normalizedAddress(address);
  const existing = nodeByAddress.get(key);
  if (existing) return existing;

  const node = {
    id: nodeId(address, column),
    address,
    token: routeToken(address),
    column,
    lane: 0,
  };
  nodes.push(node);
  nodeByAddress.set(key, node);
  return node;
}

export function buildFameSwapRouteGraph(
  quote: FameSwapExecutableQuote,
): FameSwapRouteGraph {
  const nodes: MutableNode[] = [];
  const nodeByAddress = new Map<string, MutableNode>();
  createNode(nodes, nodeByAddress, quote.route.tokenIn, 0);
  const columnByAddress = new Map<string, number>([
    [normalizedAddress(quote.route.tokenIn), 0],
  ]);
  const routeDisplayByIndex = new Map<number, FameSwapRouteDisplayLeg>(
    quote.routeDisplay.map((leg, index) => [index, leg]),
  );

  const edges: MutableEdge[] = quote.route.legs.map((leg, index) => {
    const fromColumn =
      columnByAddress.get(normalizedAddress(leg.tokenIn)) ?? index;
    const toColumn =
      columnByAddress.get(normalizedAddress(leg.tokenOut)) ?? fromColumn + 1;
    columnByAddress.set(normalizedAddress(leg.tokenOut), toColumn);

    const fromNode = createNode(nodes, nodeByAddress, leg.tokenIn, fromColumn);
    const toNode = createNode(nodes, nodeByAddress, leg.tokenOut, toColumn);
    const poolId = quote.poolIds[index];
    const quotedLeg = quote.feeBreakdown.legs[index];
    const poolMetadata = poolDisplayMetadata(poolId, leg.venue);
    const poolName = poolMetadata.displayName;
    const fee =
      quotedLeg?.fee.status === "available"
        ? {
            label: quotedLeg.fee.label,
            tooltip: venueFeeTooltip(poolName, quotedLeg.fee.label),
          }
        : {
            label: "Fee unavailable",
            tooltip: unavailableVenueFeeTooltip(
              poolName,
              quotedLeg?.fee.reason ?? "No selected leg fee descriptor.",
            ),
          };
    const feeAmountLabel = poolFeeAmountLabel(quotedLeg);

    return {
      id: edgeId(index, leg, poolId),
      legIndex: index,
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      fromToken: fromNode.token,
      toToken: toNode.token,
      lane: 0,
      column: fromColumn,
      venue: leg.venue,
      venueLabel: poolMetadata.venueLabel,
      poolId: poolId ?? null,
      poolName,
      poolTypeLabel: poolMetadata.poolTypeLabel,
      pairLabel: poolMetadata.pairLabel,
      feeLabel: fee.label,
      feeAmountLabel,
      feeDetailLabel: poolFeeDetailLabel({
        leg: quotedLeg,
        feeLabel: fee.label,
        feeAmountLabel,
      }),
      feeTooltip: fee.tooltip,
      amountMode: leg.amountMode,
      amountLabel: legAmountLabel(leg),
      quotedAmountIn: quotedLeg?.amountIn ?? null,
      allocationBps: routeDisplayByIndex.get(index)?.allocationBps ?? null,
      share: {
        source: "unavailable",
        label: "share unavailable",
        bps: null,
        amountLabel: null,
      },
      branchGroupId: null,
      mergeGroupId: null,
      reviewed: poolMetadata.reviewed,
    };
  });

  const branchGroups = applyBranchGroups(edges);
  const mergeGroups = applyMergeGroups(edges);
  const topology = graphTopology(branchGroups, mergeGroups);
  const sortedNodes = nodes.sort(
    (left, right) => left.column - right.column || left.lane - right.lane,
  );
  const sortedEdges = edges.sort(
    (left, right) => left.column - right.column || left.lane - right.lane,
  );
  const publicEdges: FameSwapRouteGraphEdge[] = sortedEdges.map(
    ({ legIndex, quotedAmountIn, allocationBps, ...edge }) => edge,
  );
  const summary =
    routePath(sortedNodes) ||
    `${quote.tokenIn.symbol} -> ${quote.tokenOut.symbol}`;

  return {
    summary,
    topology,
    nodes: sortedNodes,
    edges: publicEdges,
    branchGroups,
    mergeGroups,
    semanticLines: semanticLines({
      edges: publicEdges,
      topology,
    }),
  };
}

import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type {
  FamePoolConfig,
  FamePoolVenue,
  VenueFamilyName,
} from "../router/types";
import { poolUniverseFile, solverRoutesFile } from "./artifacts";
import {
  famePoolStateRegistry,
  type FamePoolStateRegistryEntry,
} from "./poolStateRegistry";
import {
  feeDescriptorForPool,
  type FamePoolFeeDescriptor,
} from "./poolUniverse";

import {
  FAME_POOL_ACTIVATION_LEDGER_HASH,
  FAME_POOL_ACTIVATION_SCHEMA_VERSION,
  FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
  REVIEWED_POOL_ACTIVATIONS,
  compactQuoteCapabilityForStatus,
  type FameConsumerQuoteCapability,
  type FamePoolActivationStatus,
  type FameProducerRegistryPresence,
} from "./poolActivationLedger";

export {
  FAME_POOL_ACTIVATION_SCHEMA_VERSION,
  FAME_POOL_ACTIVATION_STATUS_VALUES,
  FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
  FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
  REVIEWED_POOL_ACTIVATIONS,
  compactQuoteCapabilityForStatus,
  poolIdsForActivationStatus,
  reviewedPoolActivation,
  reviewedPoolActivationEntries,
} from "./poolActivationLedger";
export type {
  FameConsumerQuoteCapability,
  FamePoolActivationStatus,
  FameProducerRegistryPresence,
  ReviewedFamePoolActivation,
  ReviewedFamePoolActivationEntry,
} from "./poolActivationLedger";

export interface FamePoolActivationRouteReference {
  id: string;
  selected: boolean;
  routePoolOrder: readonly string[];
}

export interface FamePoolActivationEntry {
  poolId: string;
  venue: FamePoolVenue;
  venueFamily: VenueFamilyName;
  activationStatus: FamePoolActivationStatus;
  producerRegistryPresence: FameProducerRegistryPresence;
  consumerQuoteCapability: FameConsumerQuoteCapability;
  routeArtifactIds: readonly string[];
  selectedRouteArtifactIds: readonly string[];
  routeReferences: readonly FamePoolActivationRouteReference[];
  liveRouteDependencies: readonly string[];
  selectedCandidate: boolean;
  liveRouteDependency: boolean;
  producerRegistryEntry: FamePoolStateRegistryEntry | null;
  fee: FamePoolFeeDescriptor;
  reason: string;
}

export interface FameProducerOnlyActivationEntry {
  poolId: string;
  producerRegistryPresence: "producer-only";
  activationStatus: "tracked-only";
  consumerQuoteCapability: "none";
  reason: string;
}

export interface FamePoolActivationReport {
  schemaVersion: typeof FAME_POOL_ACTIVATION_SCHEMA_VERSION;
  status: "generated-reviewed-activation";
  source: {
    repo: "www";
    schemaVersion: number;
    pinnedBaseBlock: number;
    poolsJsonHash: string;
    poolsContentHash: string;
    solverRoutesJsonHash: string;
    solverRoutesContentHash: string;
    poolStateRegistrySchemaVersion: number;
    activationLedgerHash: string;
  };
  selectedCandidatePoolId: typeof FAME_SELECTED_CL_ACTIVATION_CANDIDATE;
  liveRouteDependencyPoolId: typeof FAME_SELECTED_LIVE_ROUTE_DEPENDENCY;
  upstreamPoolCount: number;
  producerRegistryPoolCount: number;
  upstreamPools: readonly FamePoolActivationEntry[];
  producerOnlyPools: readonly FameProducerOnlyActivationEntry[];
  statusCounts: Record<FamePoolActivationStatus, number>;
}

const venueFamilies = {
  solidly: "Solidly",
  "uniswap-v2": "UniswapV2",
  "aerodrome-v2": "AerodromeV2",
  "aerodrome-slipstream": "Slipstream",
  "aerodrome-slipstream2": "Slipstream2",
  "uniswap-v3": "UniswapV3",
  "uniswap-v4": "UniswapV4",
  "native-wrap": "NativeWrap",
} as const satisfies Record<FamePoolVenue, VenueFamilyName>;

function selectedRouteIds(): Set<string> {
  return new Set(FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds);
}

function registryEntriesById(): Map<string, FamePoolStateRegistryEntry> {
  return new Map(
    famePoolStateRegistry().pools.map((entry) => [entry.id, entry]),
  );
}

function routeReferencesForPool(
  poolId: string,
): FamePoolActivationRouteReference[] {
  const selected = selectedRouteIds();
  return solverRoutesFile.routes
    .filter((route) => route.poolIds.includes(poolId))
    .map((route) => ({
      id: route.id,
      selected: selected.has(route.id),
      routePoolOrder: route.poolIds,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function liveRouteDependencies(
  poolId: string,
  routeReferences: readonly FamePoolActivationRouteReference[],
): string[] {
  if (poolId !== FAME_SELECTED_CL_ACTIVATION_CANDIDATE) return [];
  const dependsOnLiveV4 = routeReferences.some((reference) =>
    reference.routePoolOrder.includes(FAME_SELECTED_LIVE_ROUTE_DEPENDENCY),
  );
  return dependsOnLiveV4 ? [FAME_SELECTED_LIVE_ROUTE_DEPENDENCY] : [];
}

export function assertReviewedPoolActivationCoverage(
  upstreamPoolIds: readonly string[],
  reviewedPoolIds: readonly string[] = Object.keys(REVIEWED_POOL_ACTIVATIONS),
): void {
  const upstream = new Set(upstreamPoolIds);
  const reviewed = new Set(reviewedPoolIds);
  for (const poolId of upstream) {
    if (!reviewed.has(poolId)) {
      throw new Error(
        `Missing reviewed activation status for upstream pool ${poolId}.`,
      );
    }
  }
  for (const poolId of reviewed) {
    if (!upstream.has(poolId)) {
      throw new Error(
        `Reviewed activation status references unknown upstream pool ${poolId}.`,
      );
    }
  }
}

function activationEntryForPool(
  pool: FamePoolConfig,
  registryEntry: FamePoolStateRegistryEntry | null,
): FamePoolActivationEntry {
  const reviewed = REVIEWED_POOL_ACTIVATIONS[pool.id];
  if (!reviewed) {
    throw new Error(
      `Missing reviewed activation status for upstream pool ${pool.id}.`,
    );
  }
  const routeReferences = routeReferencesForPool(pool.id);
  const selectedRouteArtifactIds = routeReferences
    .filter((reference) => reference.selected)
    .map((reference) => reference.id);
  const activationStatus = reviewed.activationStatus;

  return {
    poolId: pool.id,
    venue: pool.venue,
    venueFamily: venueFamilies[pool.venue],
    activationStatus,
    producerRegistryPresence: reviewed.producerRegistryPresence,
    consumerQuoteCapability: compactQuoteCapabilityForStatus(activationStatus),
    routeArtifactIds: routeReferences.map((reference) => reference.id),
    selectedRouteArtifactIds,
    routeReferences,
    liveRouteDependencies: liveRouteDependencies(pool.id, routeReferences),
    selectedCandidate: pool.id === FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
    liveRouteDependency: pool.id === FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
    producerRegistryEntry: registryEntry,
    fee: feeDescriptorForPool(pool),
    reason: reviewed.reason,
  };
}

function statusCounts(
  entries: readonly FamePoolActivationEntry[],
): Record<FamePoolActivationStatus, number> {
  const counts: Record<FamePoolActivationStatus, number> = {
    "reserve-compact-quote-active": 0,
    "cl-compact-quote-active": 0,
    "cl-replay-candidate": 0,
    "cl-head-only": 0,
    "tracked-only": 0,
    blocked: 0,
    unsupported: 0,
    "producer-unrepresented": 0,
  };
  for (const entry of entries) counts[entry.activationStatus] += 1;
  return counts;
}

function producerOnlyEntries(
  upstreamPoolIds: ReadonlySet<string>,
): FameProducerOnlyActivationEntry[] {
  return famePoolStateRegistry()
    .pools.filter((entry) => !upstreamPoolIds.has(entry.id))
    .map((entry) => ({
      poolId: entry.id,
      producerRegistryPresence: "producer-only" as const,
      activationStatus: "tracked-only" as const,
      consumerQuoteCapability: "none" as const,
      reason:
        "Producer-only helper entry; not part of the upstream www pool universe.",
    }))
    .sort((left, right) => left.poolId.localeCompare(right.poolId));
}

function assertActivationReport(report: FamePoolActivationReport): void {
  const seen = new Set<string>();
  for (const entry of report.upstreamPools) {
    if (seen.has(entry.poolId)) {
      throw new Error(
        `Duplicate activation row for upstream pool ${entry.poolId}.`,
      );
    }
    seen.add(entry.poolId);
    if (
      entry.activationStatus === "blocked" &&
      entry.consumerQuoteCapability !== "none"
    ) {
      throw new Error(
        `Blocked pool ${entry.poolId} cannot be compact quote capable.`,
      );
    }
    if (
      entry.consumerQuoteCapability !==
      compactQuoteCapabilityForStatus(entry.activationStatus)
    ) {
      throw new Error(
        `Pool ${entry.poolId} consumer quote capability must be derived from activation status ${entry.activationStatus}.`,
      );
    }
    if (
      entry.producerRegistryPresence === "present" &&
      entry.producerRegistryEntry === null
    ) {
      throw new Error(
        `Pool ${entry.poolId} is reviewed as producer-present but has no registry entry.`,
      );
    }
    if (
      entry.producerRegistryPresence === "producer-unrepresented" &&
      entry.producerRegistryEntry !== null
    ) {
      throw new Error(
        `Pool ${entry.poolId} is reviewed as producer-unrepresented but has a registry entry.`,
      );
    }
    if (
      entry.producerRegistryEntry !== null &&
      entry.producerRegistryEntry.activationStatus !== entry.activationStatus
    ) {
      throw new Error(
        `Pool ${entry.poolId} registry activation status ${entry.producerRegistryEntry.activationStatus} does not match reviewed status ${entry.activationStatus}.`,
      );
    }
  }
  if (seen.size !== report.upstreamPoolCount) {
    throw new Error(
      `Activation report covers ${seen.size.toString()} upstream pools, expected ${report.upstreamPoolCount.toString()}.`,
    );
  }
}

export function famePoolActivationReport(): FamePoolActivationReport {
  assertReviewedPoolActivationCoverage(
    poolUniverseFile.pools.map((pool) => pool.id),
  );
  const registryById = registryEntriesById();
  const registry = famePoolStateRegistry();
  const upstreamPools = poolUniverseFile.pools
    .map((pool) =>
      activationEntryForPool(pool, registryById.get(pool.id) ?? null),
    )
    .sort((left, right) => left.poolId.localeCompare(right.poolId));
  const upstreamPoolIds = new Set(upstreamPools.map((entry) => entry.poolId));
  const report: FamePoolActivationReport = {
    schemaVersion: FAME_POOL_ACTIVATION_SCHEMA_VERSION,
    status: "generated-reviewed-activation",
    source: {
      repo: "www",
      schemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
      pinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
      poolsJsonHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
      poolsContentHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsContentHash,
      solverRoutesJsonHash: FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
      solverRoutesContentHash:
        FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesContentHash,
      poolStateRegistrySchemaVersion: registry.schemaVersion,
      activationLedgerHash: FAME_POOL_ACTIVATION_LEDGER_HASH,
    },
    selectedCandidatePoolId: FAME_SELECTED_CL_ACTIVATION_CANDIDATE,
    liveRouteDependencyPoolId: FAME_SELECTED_LIVE_ROUTE_DEPENDENCY,
    upstreamPoolCount: poolUniverseFile.pools.length,
    producerRegistryPoolCount: registry.pools.length,
    upstreamPools,
    producerOnlyPools: producerOnlyEntries(upstreamPoolIds),
    statusCounts: statusCounts(upstreamPools),
  };
  assertActivationReport(report);
  return report;
}

import type { Address, Hex } from "viem";
import { base } from "viem/chains";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type {
  FamePoolConfig,
  FamePoolVenue,
  VenueFamilyName,
} from "../router/types";
import { FAME, NATIVE_ETH, USDC, WETH } from "../tokens";
import { routeCandidatesForPair } from "./graph/candidates";
import {
  routeOptimizerTemplatesForPair,
  templatePoolIds,
} from "./optimizer/templates";
import {
  feeDescriptorForPool,
  famePoolById,
  type FamePoolFeeDescriptor,
} from "./poolUniverse";

export const FAME_POOL_STATE_REGISTRY_SCHEMA_VERSION = 2;

export const QUOTE_MODEL_CAPABLE_FAME_POOL_IDS = [
  "aerodrome-v2-usdc-weth",
  "scale-equalizer-frxusd-fame",
  "scale-equalizer-scale-fame",
  "scale-equalizer-usdc-scale",
  "scale-equalizer-weth-fame",
  "uniswap-v2-fame-direct",
  "uniswap-v2-usdc-weth",
] as const;

export type FamePoolStateCapability =
  | "market-state"
  | "quote-model"
  | "tracked-only";
export type FamePoolStateQuoteModel = "constant-product-reserves";
export type FamePoolStateSurface =
  | "cl-head-snapshot"
  | "constant-product-reserves";
export type FamePoolStateUnsupportedReason =
  | "concentrated-liquidity"
  | "missing-fee-metadata"
  | "native-wrap"
  | "stable-pool"
  | "unsupported-venue";

export interface FamePoolStateRegistrySource {
  repo: "www";
  schemaVersion: number;
  pinnedBaseBlock: number;
  poolsJsonHash: Hex;
  poolsContentHash: Hex;
  solverRoutesJsonHash: Hex;
  solverRoutesContentHash: Hex;
}

export interface FamePoolStateRegistryDirection {
  tokenIn: Address;
  tokenOut: Address;
}

export interface FamePoolStateRegistryEntry {
  id: string;
  chainId: typeof base.id;
  venue: FamePoolVenue;
  venueFamily: VenueFamilyName;
  router: Address;
  poolAddress: Address | null;
  poolKey: Hex | null;
  token0: Address;
  token1: Address;
  stable: boolean | null;
  fee: FamePoolFeeDescriptor;
  tickSpacing: number | null;
  stateViewAddress: Address | null;
  capability: FamePoolStateCapability;
  stateSurface: FamePoolStateSurface | null;
  quoteModel: FamePoolStateQuoteModel | null;
  unsupportedReason: FamePoolStateUnsupportedReason | null;
}

export interface FamePoolStateRegistryFile {
  schemaVersion: typeof FAME_POOL_STATE_REGISTRY_SCHEMA_VERSION;
  status: "generated-reviewed-route-candidates";
  source: FamePoolStateRegistrySource;
  candidateDirections: readonly FamePoolStateRegistryDirection[];
  pools: readonly FamePoolStateRegistryEntry[];
}

const FAME_POOL_STATE_REGISTRY_DIRECTIONS = [
  [FAME, USDC],
  [USDC, FAME],
  [FAME, WETH],
  [WETH, FAME],
  [FAME, NATIVE_ETH],
  [NATIVE_ETH, FAME],
] as const satisfies readonly (readonly [Address, Address])[];

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

function routePoolIdsForDirections(
  directions: readonly (readonly [Address, Address])[],
): string[] {
  const ids = new Set<string>();

  for (const [tokenIn, tokenOut] of directions) {
    for (const candidate of routeCandidatesForPair(tokenIn, tokenOut)
      .candidates) {
      for (const leg of candidate.legs) ids.add(leg.edge.poolId);
    }

    for (const template of routeOptimizerTemplatesForPair(tokenIn, tokenOut)
      .templates) {
      for (const poolId of templatePoolIds(template)) ids.add(poolId);
    }
  }

  return [...ids].sort((left, right) => left.localeCompare(right));
}

function routePoolIds(): string[] {
  return routePoolIdsForDirections(FAME_POOL_STATE_REGISTRY_DIRECTIONS);
}

export function famePoolStateRegistryPoolIdsForPair(
  tokenIn: Address,
  tokenOut: Address,
): string[] {
  return routePoolIdsForDirections([[tokenIn, tokenOut]]);
}

export function famePoolStateRegistrySourceId(
  registry: FamePoolStateRegistryFile = famePoolStateRegistry(),
): string {
  return `${registry.source.poolsJsonHash}:${registry.source.solverRoutesJsonHash}`;
}

function unsupportedReasonForPool(
  pool: FamePoolConfig,
  fee: FamePoolFeeDescriptor,
  stateSurface: FamePoolStateSurface | null,
): FamePoolStateUnsupportedReason | null {
  if (stateSurface !== null) {
    return null;
  }
  if (pool.venue === "uniswap-v2") {
    return fee.status === "available" ? null : "missing-fee-metadata";
  }
  if (pool.venue === "solidly" || pool.venue === "aerodrome-v2") {
    if (pool.stable) return "stable-pool";
    return fee.status === "available" ? null : "missing-fee-metadata";
  }
  if (isConcentratedLiquidityPool(pool)) {
    return fee.status === "available"
      ? "unsupported-venue"
      : "missing-fee-metadata";
  }
  if (pool.venue === "native-wrap") return "native-wrap";
  return "unsupported-venue";
}

function isConcentratedLiquidityPool(pool: FamePoolConfig): boolean {
  return (
    pool.venue === "aerodrome-slipstream" ||
    pool.venue === "aerodrome-slipstream2" ||
    pool.venue === "uniswap-v3" ||
    pool.venue === "uniswap-v4"
  );
}

function stateSurfaceForPool(
  pool: FamePoolConfig,
  fee: FamePoolFeeDescriptor,
): FamePoolStateSurface | null {
  if (pool.venue === "uniswap-v2") {
    return fee.status === "available" ? "constant-product-reserves" : null;
  }
  if (pool.venue === "solidly" || pool.venue === "aerodrome-v2") {
    if (pool.stable) return null;
    return fee.status === "available" ? "constant-product-reserves" : null;
  }
  if (isConcentratedLiquidityPool(pool) && fee.status === "available") {
    return "cl-head-snapshot";
  }
  return null;
}

function capabilityForStateSurface(
  stateSurface: FamePoolStateSurface | null,
): FamePoolStateCapability {
  if (stateSurface === "constant-product-reserves") return "quote-model";
  if (stateSurface === "cl-head-snapshot") return "market-state";
  return "tracked-only";
}

function stableFlag(pool: FamePoolConfig): boolean | null {
  if (pool.venue === "solidly" || pool.venue === "aerodrome-v2") {
    return pool.stable;
  }
  return null;
}

function poolAddress(pool: FamePoolConfig): Address | null {
  return "pool" in pool ? pool.pool : null;
}

function poolKey(pool: FamePoolConfig): Hex | null {
  return "poolId" in pool ? pool.poolId : null;
}

function tickSpacing(pool: FamePoolConfig): number | null {
  return "tickSpacing" in pool ? pool.tickSpacing : null;
}

function stateViewAddress(pool: FamePoolConfig): Address | null {
  return pool.venue === "uniswap-v4" ? pool.stateView : null;
}

function token0(pool: FamePoolConfig): Address {
  if (pool.venue === "uniswap-v4") return pool.currency0;
  if (pool.venue === "native-wrap") return NATIVE_ETH;
  return pool.token0;
}

function token1(pool: FamePoolConfig): Address {
  if (pool.venue === "uniswap-v4") return pool.currency1;
  if (pool.venue === "native-wrap") return pool.weth;
  return pool.token1;
}

function registryEntry(pool: FamePoolConfig): FamePoolStateRegistryEntry {
  const fee = feeDescriptorForPool(pool);
  const stateSurface = stateSurfaceForPool(pool, fee);
  const capability = capabilityForStateSurface(stateSurface);
  const unsupportedReason = unsupportedReasonForPool(pool, fee, stateSurface);

  return {
    id: pool.id,
    chainId: base.id,
    venue: pool.venue,
    venueFamily: venueFamilies[pool.venue],
    router: pool.router,
    poolAddress: poolAddress(pool),
    poolKey: poolKey(pool),
    token0: token0(pool),
    token1: token1(pool),
    stable: stableFlag(pool),
    fee,
    tickSpacing: tickSpacing(pool),
    stateViewAddress: stateViewAddress(pool),
    capability,
    stateSurface,
    quoteModel:
      capability === "quote-model" ? "constant-product-reserves" : null,
    unsupportedReason,
  };
}

export function famePoolStateRegistry(): FamePoolStateRegistryFile {
  const pools = routePoolIds().map((poolId) => {
    const pool = famePoolById(poolId);
    if (!pool) {
      throw new Error(
        `FAME pool-state registry references unknown pool ${poolId}.`,
      );
    }
    return registryEntry(pool);
  });

  return {
    schemaVersion: FAME_POOL_STATE_REGISTRY_SCHEMA_VERSION,
    status: "generated-reviewed-route-candidates",
    source: {
      repo: "www",
      schemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
      pinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
      poolsJsonHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
      poolsContentHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsContentHash,
      solverRoutesJsonHash: FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
      solverRoutesContentHash:
        FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesContentHash,
    },
    candidateDirections: FAME_POOL_STATE_REGISTRY_DIRECTIONS.map(
      ([tokenIn, tokenOut]) => ({
        tokenIn,
        tokenOut,
      }),
    ),
    pools,
  };
}

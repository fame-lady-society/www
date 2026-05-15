import type { Address } from "viem";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import {
  NATIVE_ETH_ADDRESS,
  venueFamilyOrdinals,
  type FamePoolConfig,
  type FamePoolUniverseFile,
  type VenueFamilyName,
  type VenueFamilyOrdinal,
} from "../router/types";
import { WETH } from "../tokens";
import { poolUniverseFile } from "./artifacts";

export type FamePoolFeeDescriptor =
  | {
      status: "available";
      feeBps: number;
      label: string;
      source: "pool-metadata";
    }
  | {
      status: "unavailable";
      reason: string;
    };

export interface FamePoolEdge {
  id: string;
  poolId: string;
  pool: FamePoolConfig;
  tokenIn: Address;
  tokenOut: Address;
  venue: VenueFamilyName;
  venueOrdinal: VenueFamilyOrdinal;
  target: Address;
  fee: FamePoolFeeDescriptor;
  manifestReady: boolean;
}

export interface FamePoolUniverse {
  file: FamePoolUniverseFile;
  pools: readonly FamePoolConfig[];
  edges: readonly FamePoolEdge[];
}

export const NATIVE_WRAP_POOL_ID = "native-wrap-weth";

const NATIVE_WRAP_POOL = {
  id: NATIVE_WRAP_POOL_ID,
  venue: "native-wrap",
  router: WETH,
  weth: WETH,
} as const satisfies FamePoolConfig;

const venueFamilies = {
  solidly: "Solidly",
  "uniswap-v2": "UniswapV2",
  "aerodrome-slipstream": "Slipstream",
  "aerodrome-slipstream2": "Slipstream2",
  "uniswap-v3": "UniswapV3",
  "uniswap-v4": "UniswapV4",
  "native-wrap": "NativeWrap",
} as const satisfies Record<FamePoolConfig["venue"], VenueFamilyName>;

function normalizedAddress(address: Address): string {
  return address.toLowerCase();
}

function sameAddress(left: Address, right: Address): boolean {
  return normalizedAddress(left) === normalizedAddress(right);
}

function feeLabel(feeBps: number): string {
  if (feeBps === 0) return "0%";
  const percent = feeBps / 100;
  const decimals = percent < 0.01 ? 4 : percent < 0.1 ? 3 : 2;
  return `${percent.toFixed(decimals)}%`;
}

export function feeDescriptorForPool(
  pool: FamePoolConfig,
): FamePoolFeeDescriptor {
  if (pool.venue === "native-wrap") {
    return {
      status: "available",
      feeBps: 0,
      label: "0%",
      source: "pool-metadata",
    };
  }

  if ("feeBps" in pool && Number.isFinite(pool.feeBps)) {
    return {
      status: "available",
      feeBps: pool.feeBps,
      label: feeLabel(pool.feeBps),
      source: "pool-metadata",
    };
  }

  if ("fee" in pool && Number.isFinite(pool.fee)) {
    return {
      status: "available",
      feeBps: pool.fee / 100,
      label: feeLabel(pool.fee / 100),
      source: "pool-metadata",
    };
  }

  return {
    status: "unavailable",
    reason: "Pool fee metadata is unavailable.",
  };
}

function poolTokens(pool: FamePoolConfig): readonly [Address, Address] {
  if (pool.venue === "native-wrap") {
    return [NATIVE_ETH_ADDRESS, pool.weth];
  }

  if (pool.venue === "uniswap-v4") {
    return [pool.currency0, pool.currency1];
  }

  return [pool.token0, pool.token1];
}

function poolEnablementReady(pool: FamePoolConfig): boolean {
  return pool.enablement?.status !== "blocked";
}

function manifestReady(
  pool: FamePoolConfig,
  venueOrdinal: VenueFamilyOrdinal,
  target: Address,
): boolean {
  if (!poolEnablementReady(pool)) return false;

  return FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.some(
    (required) =>
      required.familyOrdinal === venueOrdinal &&
      sameAddress(required.target, target),
  );
}

function buildEdge(
  pool: FamePoolConfig,
  tokenIn: Address,
  tokenOut: Address,
): FamePoolEdge {
  const venue = venueFamilies[pool.venue];
  const venueOrdinal = venueFamilyOrdinals[venue];
  const target = pool.venue === "native-wrap" ? pool.weth : pool.router;

  return {
    id: `${pool.id}:${normalizedAddress(tokenIn)}:${normalizedAddress(tokenOut)}`,
    poolId: pool.id,
    pool,
    tokenIn,
    tokenOut,
    venue,
    venueOrdinal,
    target,
    fee: feeDescriptorForPool(pool),
    manifestReady: manifestReady(pool, venueOrdinal, target),
  };
}

function buildEdges(pools: readonly FamePoolConfig[]): FamePoolEdge[] {
  return pools.flatMap((pool) => {
    const [token0, token1] = poolTokens(pool);
    return [buildEdge(pool, token0, token1), buildEdge(pool, token1, token0)];
  });
}

export function famePoolUniverse(): FamePoolUniverse {
  return {
    file: poolUniverseFile,
    pools: poolUniverseFile.pools,
    edges: buildEdges([...poolUniverseFile.pools, NATIVE_WRAP_POOL]),
  };
}

export function famePoolById(id: string): FamePoolConfig | undefined {
  return (
    poolUniverseFile.pools.find((pool) => pool.id === id) ??
    (id === NATIVE_WRAP_POOL_ID ? NATIVE_WRAP_POOL : undefined)
  );
}

export function famePoolEdges(): readonly FamePoolEdge[] {
  return famePoolUniverse().edges;
}

export function famePoolEdgesForPair(
  tokenIn: Address,
  tokenOut: Address,
): readonly FamePoolEdge[] {
  return famePoolEdges().filter(
    (edge) => sameAddress(edge.tokenIn, tokenIn) && sameAddress(edge.tokenOut, tokenOut),
  );
}

export function isNativeEthAddress(address: Address): boolean {
  return sameAddress(address, NATIVE_ETH_ADDRESS);
}

import type { Address, Hex } from "viem";
import { base } from "viem/chains";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type {
  FamePoolConfig,
  FamePoolVenue,
  FameUniswapV4PoolConfig,
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

export const FAME_POOL_STATE_REGISTRY_SCHEMA_VERSION = 4;
export const FAME_POOL_STATE_ACTIVATION_LEDGER_HASH =
  "0xb5b11fb5b0e829d7cef286ed3eb9df977260d1de50aabd658994b3995efb958b" as const satisfies Hex;

export const QUOTE_MODEL_CAPABLE_FAME_POOL_IDS = [
  "aerodrome-v2-usdc-weth",
  "scale-equalizer-frxusd-fame",
  "scale-equalizer-scale-fame",
  "scale-equalizer-usdc-scale",
  "scale-equalizer-weth-fame",
  "uniswap-v2-fame-direct",
  "uniswap-v2-usdc-weth",
] as const;

export const CL_REPLAY_CAPABLE_FAME_POOL_IDS = [
  "slipstream-usdc-weth-100",
] as const;

export const COMPACT_QUOTE_CAPABLE_FAME_POOL_IDS = [
  ...QUOTE_MODEL_CAPABLE_FAME_POOL_IDS,
  ...CL_REPLAY_CAPABLE_FAME_POOL_IDS,
] as const;

export const V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID =
  "uniswap-v4-basedflick-zora";
export const UNISWAP_V4_DYNAMIC_FEE_FLAG = 0x800000;
export const UNISWAP_V4_MAX_LP_FEE = 1_000_000;

export interface FameV4HookPermissions {
  beforeInitialize: boolean;
  afterInitialize: boolean;
  beforeAddLiquidity: boolean;
  afterAddLiquidity: boolean;
  beforeRemoveLiquidity: boolean;
  afterRemoveLiquidity: boolean;
  beforeSwap: boolean;
  afterSwap: boolean;
  beforeDonate: boolean;
  afterDonate: boolean;
  beforeSwapReturnDelta: boolean;
  afterSwapReturnDelta: boolean;
  afterAddLiquidityReturnDelta: boolean;
  afterRemoveLiquidityReturnDelta: boolean;
}

export interface FameV4ZoraReviewedPoolShape {
  poolId: typeof V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID;
  chainId: typeof base.id;
  venue: "uniswap-v4";
  venueFamily: "UniswapV4";
  router: Address;
  poolManager: Address;
  stateViewAddress: Address;
  poolKey: Hex;
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: 200;
  hooks: Address;
  hookData: Hex;
}

export type FameV4ZoraQuoteLaneBlockReason =
  | "unknown-pool"
  | "not-uniswap-v4"
  | "non-target-v4-pool"
  | "router-mismatch"
  | "pool-manager-mismatch"
  | "state-view-mismatch"
  | "pool-key-mismatch"
  | "currency0-mismatch"
  | "currency1-mismatch"
  | "invalid-fee"
  | "dynamic-fee"
  | "fee-mismatch"
  | "tick-spacing-mismatch"
  | "hook-data-mismatch"
  | "unsafe-hook-permissions"
  | "hook-address-mismatch"
  | "missing-provenance";

export type FameV4ZoraQuoteLaneClassification =
  | {
      status: "target-eligible";
      poolId: typeof V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID;
      reviewedPoolShape: FameV4ZoraReviewedPoolShape;
      hookPermissions: FameV4HookPermissions;
    }
  | {
      status: "target-blocked";
      poolId: string;
      reason: FameV4ZoraQuoteLaneBlockReason;
      hookPermissions?: FameV4HookPermissions;
      unsafeHookPermissions?: readonly string[];
    }
  | {
      status: "non-target-v4-unsupported";
      poolId: string;
      reason: "non-target-v4-pool";
    }
  | {
      status: "not-uniswap-v4";
      poolId: string;
      reason: "not-uniswap-v4" | "unknown-pool";
    };

export interface FameV4ZoraQuoteLaneOptions {
  provenanceVerified?: boolean;
}

export type FameV4ZoraQuoteLaneActivation =
  | {
      status: "pending";
      reason:
        | "awaiting-parity-and-route-simulation"
        | "blocked-by-parity"
        | "blocked-by-route-simulation";
    }
  | {
      status: "active";
      sourceRegistryId: string;
      parityStatus: "passed";
      routeSimulationStatus: "passed";
      evidenceId: string;
    };

export const FAME_V4_ZORA_QUOTE_LANE_ACTIVATION = {
  status: "pending",
  reason: "awaiting-parity-and-route-simulation",
} as const satisfies FameV4ZoraQuoteLaneActivation;

export interface FameCompactQuoteSupportOptions {
  v4ZoraQuoteLaneActivation?: FameV4ZoraQuoteLaneActivation;
}

export type FamePoolStateCapability =
  | "market-state"
  | "quote-model"
  | "tracked-only";
export type FamePoolActivationStatus =
  | "reserve-compact-quote-active"
  | "cl-compact-quote-active"
  | "cl-replay-candidate"
  | "cl-head-only"
  | "tracked-only"
  | "blocked"
  | "unsupported"
  | "producer-unrepresented";
export type FamePoolStateQuoteModel = "constant-product-reserves";
export type FamePoolStateReplaySurface = "cl-replay-v1";
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
  activationLedgerHash: Hex;
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
  factoryAddress: Address | null;
  poolAddress: Address | null;
  poolKey: Hex | null;
  token0: Address;
  token1: Address;
  stable: boolean | null;
  fee: FamePoolFeeDescriptor;
  tickSpacing: number | null;
  stateViewAddress: Address | null;
  capability: FamePoolStateCapability;
  activationStatus: FamePoolActivationStatus;
  stateSurface: FamePoolStateSurface | null;
  replaySurface: FamePoolStateReplaySurface | null;
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

const V4_HOOK_FLAGS = {
  beforeInitialize: 1n << 13n,
  afterInitialize: 1n << 12n,
  beforeAddLiquidity: 1n << 11n,
  afterAddLiquidity: 1n << 10n,
  beforeRemoveLiquidity: 1n << 9n,
  afterRemoveLiquidity: 1n << 8n,
  beforeSwap: 1n << 7n,
  afterSwap: 1n << 6n,
  beforeDonate: 1n << 5n,
  afterDonate: 1n << 4n,
  beforeSwapReturnDelta: 1n << 3n,
  afterSwapReturnDelta: 1n << 2n,
  afterAddLiquidityReturnDelta: 1n << 1n,
  afterRemoveLiquidityReturnDelta: 1n << 0n,
} as const satisfies Record<keyof FameV4HookPermissions, bigint>;

export const FAME_V4_ZORA_REVIEWED_POOL_SHAPE = {
  poolId: V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
  chainId: base.id,
  venue: "uniswap-v4",
  venueFamily: "UniswapV4",
  router: "0x6ff5693b99212da76ad316178a184ab56d299b43",
  poolManager: "0x498581ff718922c3f8e6a244956af099b2652b2b",
  stateViewAddress: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71",
  poolKey:
    "0x0fe6333346fcd0ffa4be3fda91f271bda52c6755f604b06483b709666d363628",
  currency0: "0x1111111111166b7fe7bd91427724b487980afc69",
  currency1: "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926",
  fee: 30_000,
  tickSpacing: 200,
  hooks: "0xd61a675f8a0c67a73dc3b54fb7318b4d91409040",
  hookData: "0x",
} as const satisfies FameV4ZoraReviewedPoolShape;

function sameAddress(left: Address, right: Address): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function sameHex(left: Hex, right: Hex): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function targetBlocked(
  poolId: string,
  reason: FameV4ZoraQuoteLaneBlockReason,
  extra: Omit<
    Extract<FameV4ZoraQuoteLaneClassification, { status: "target-blocked" }>,
    "status" | "poolId" | "reason"
  > = {},
): FameV4ZoraQuoteLaneClassification {
  return {
    status: "target-blocked",
    poolId,
    reason,
    ...extra,
  };
}

export function decodeUniswapV4HookPermissions(
  hooks: Address,
): FameV4HookPermissions {
  const hookBits = BigInt(hooks);
  return {
    beforeInitialize: (hookBits & V4_HOOK_FLAGS.beforeInitialize) !== 0n,
    afterInitialize: (hookBits & V4_HOOK_FLAGS.afterInitialize) !== 0n,
    beforeAddLiquidity: (hookBits & V4_HOOK_FLAGS.beforeAddLiquidity) !== 0n,
    afterAddLiquidity: (hookBits & V4_HOOK_FLAGS.afterAddLiquidity) !== 0n,
    beforeRemoveLiquidity:
      (hookBits & V4_HOOK_FLAGS.beforeRemoveLiquidity) !== 0n,
    afterRemoveLiquidity:
      (hookBits & V4_HOOK_FLAGS.afterRemoveLiquidity) !== 0n,
    beforeSwap: (hookBits & V4_HOOK_FLAGS.beforeSwap) !== 0n,
    afterSwap: (hookBits & V4_HOOK_FLAGS.afterSwap) !== 0n,
    beforeDonate: (hookBits & V4_HOOK_FLAGS.beforeDonate) !== 0n,
    afterDonate: (hookBits & V4_HOOK_FLAGS.afterDonate) !== 0n,
    beforeSwapReturnDelta:
      (hookBits & V4_HOOK_FLAGS.beforeSwapReturnDelta) !== 0n,
    afterSwapReturnDelta:
      (hookBits & V4_HOOK_FLAGS.afterSwapReturnDelta) !== 0n,
    afterAddLiquidityReturnDelta:
      (hookBits & V4_HOOK_FLAGS.afterAddLiquidityReturnDelta) !== 0n,
    afterRemoveLiquidityReturnDelta:
      (hookBits & V4_HOOK_FLAGS.afterRemoveLiquidityReturnDelta) !== 0n,
  };
}

function unsafeSwapHookPermissions(
  permissions: FameV4HookPermissions,
): string[] {
  return [
    "beforeSwap",
    "beforeSwapReturnDelta",
    "afterSwapReturnDelta",
  ].filter((name) => permissions[name as keyof FameV4HookPermissions]);
}

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

export function fameV4ZoraQuoteLaneActivationPassed(
  activation: FameV4ZoraQuoteLaneActivation = FAME_V4_ZORA_QUOTE_LANE_ACTIVATION,
): activation is Extract<FameV4ZoraQuoteLaneActivation, { status: "active" }> {
  return (
    activation.status === "active" &&
    activation.parityStatus === "passed" &&
    activation.routeSimulationStatus === "passed" &&
    activation.sourceRegistryId.length > 0 &&
    activation.evidenceId.length > 0
  );
}

export function famePoolSupportsCompactQuote(
  poolId: string,
  options: FameCompactQuoteSupportOptions = {},
): boolean {
  return (
    COMPACT_QUOTE_CAPABLE_FAME_POOL_IDS.some((id) => id === poolId) ||
    (fameV4ZoraQuoteLaneActivationPassed(
      options.v4ZoraQuoteLaneActivation,
    ) && famePoolSupportsV4ZoraQuoteLane(poolId, { provenanceVerified: true }))
  );
}

export function classifyFameV4ZoraPoolConfig(
  pool: FamePoolConfig,
  options: FameV4ZoraQuoteLaneOptions = {},
): FameV4ZoraQuoteLaneClassification {
  if (pool.venue !== "uniswap-v4") {
    return {
      status: "not-uniswap-v4",
      poolId: pool.id,
      reason: "not-uniswap-v4",
    };
  }
  if (pool.id !== V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID) {
    return {
      status: "non-target-v4-unsupported",
      poolId: pool.id,
      reason: "non-target-v4-pool",
    };
  }

  const reviewed = FAME_V4_ZORA_REVIEWED_POOL_SHAPE;
  const v4Pool: FameUniswapV4PoolConfig = pool;
  if (!sameAddress(v4Pool.router, reviewed.router)) {
    return targetBlocked(pool.id, "router-mismatch");
  }
  if (!sameAddress(v4Pool.poolManager, reviewed.poolManager)) {
    return targetBlocked(pool.id, "pool-manager-mismatch");
  }
  if (!sameAddress(v4Pool.stateView, reviewed.stateViewAddress)) {
    return targetBlocked(pool.id, "state-view-mismatch");
  }
  if (!sameHex(v4Pool.poolId, reviewed.poolKey)) {
    return targetBlocked(pool.id, "pool-key-mismatch");
  }
  if (!sameAddress(v4Pool.currency0, reviewed.currency0)) {
    return targetBlocked(pool.id, "currency0-mismatch");
  }
  if (!sameAddress(v4Pool.currency1, reviewed.currency1)) {
    return targetBlocked(pool.id, "currency1-mismatch");
  }
  if (v4Pool.fee === UNISWAP_V4_DYNAMIC_FEE_FLAG) {
    return targetBlocked(pool.id, "dynamic-fee");
  }
  if (v4Pool.fee > UNISWAP_V4_MAX_LP_FEE) {
    return targetBlocked(pool.id, "invalid-fee");
  }
  if (v4Pool.fee !== reviewed.fee) {
    return targetBlocked(pool.id, "fee-mismatch");
  }
  if (v4Pool.tickSpacing !== reviewed.tickSpacing) {
    return targetBlocked(pool.id, "tick-spacing-mismatch");
  }
  if ((v4Pool.hookData ?? "0x").toLowerCase() !== "0x") {
    return targetBlocked(pool.id, "hook-data-mismatch");
  }

  const hookPermissions = decodeUniswapV4HookPermissions(v4Pool.hooks);
  const unsafePermissions = unsafeSwapHookPermissions(hookPermissions);
  if (
    !hookPermissions.afterInitialize ||
    !hookPermissions.afterSwap ||
    unsafePermissions.length > 0
  ) {
    return targetBlocked(pool.id, "unsafe-hook-permissions", {
      hookPermissions,
      unsafeHookPermissions: unsafePermissions,
    });
  }
  if (!sameAddress(v4Pool.hooks, reviewed.hooks)) {
    return targetBlocked(pool.id, "hook-address-mismatch", {
      hookPermissions,
    });
  }
  if (!options.provenanceVerified) {
    return targetBlocked(pool.id, "missing-provenance", {
      hookPermissions,
    });
  }

  return {
    status: "target-eligible",
    poolId: V4_ZORA_QUOTE_LANE_CANDIDATE_FAME_POOL_ID,
    reviewedPoolShape: reviewed,
    hookPermissions,
  };
}

export function classifyFameV4ZoraQuoteLane(
  poolId: string,
  options: FameV4ZoraQuoteLaneOptions = {},
): FameV4ZoraQuoteLaneClassification {
  const pool = famePoolById(poolId);
  if (!pool) {
    return {
      status: "not-uniswap-v4",
      poolId,
      reason: "unknown-pool",
    };
  }
  return classifyFameV4ZoraPoolConfig(pool, options);
}

export function famePoolSupportsV4ZoraQuoteLane(
  poolId: string,
  options: FameV4ZoraQuoteLaneOptions = {},
): boolean {
  return (
    classifyFameV4ZoraQuoteLane(poolId, options).status === "target-eligible"
  );
}

export function famePoolStateRegistrySourceId(
  registry: FamePoolStateRegistryFile = famePoolStateRegistry(),
): string {
  return `pool-state-registry-v${FAME_POOL_STATE_REGISTRY_SCHEMA_VERSION.toString()}:${registry.source.poolsJsonHash}:${registry.source.solverRoutesJsonHash}:${registry.source.activationLedgerHash}`;
}

function unsupportedReasonForPool(
  pool: FamePoolConfig,
  fee: FamePoolFeeDescriptor,
): FamePoolStateUnsupportedReason | null {
  if (pool.venue === "uniswap-v2") {
    return fee.status === "available" ? null : "missing-fee-metadata";
  }
  if (pool.venue === "solidly" || pool.venue === "aerodrome-v2") {
    if (pool.stable) return "stable-pool";
    return fee.status === "available" ? null : "missing-fee-metadata";
  }
  if (
    pool.venue === "aerodrome-slipstream" ||
    pool.venue === "aerodrome-slipstream2" ||
    pool.venue === "uniswap-v3" ||
    pool.venue === "uniswap-v4"
  ) {
    return "concentrated-liquidity";
  }
  if (pool.venue === "native-wrap") return "native-wrap";
  return "unsupported-venue";
}

function clHeadSnapshotEligible(
  pool: FamePoolConfig,
  fee: FamePoolFeeDescriptor,
): boolean {
  if (fee.status !== "available") return false;
  if (
    pool.venue === "aerodrome-slipstream" ||
    pool.venue === "aerodrome-slipstream2" ||
    pool.venue === "uniswap-v3"
  ) {
    return "pool" in pool && Number.isSafeInteger(pool.tickSpacing);
  }
  if (pool.venue === "uniswap-v4") {
    return (
      Number.isSafeInteger(pool.tickSpacing) &&
      pool.poolId.length > 0 &&
      pool.stateView.length > 0
    );
  }
  return false;
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

function factoryAddress(pool: FamePoolConfig): Address | null {
  return "factory" in pool ? pool.factory : null;
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

function activationStatusForPool(
  pool: FamePoolConfig,
  capability: FamePoolStateCapability,
  replaySurface: FamePoolStateReplaySurface | null,
): FamePoolActivationStatus {
  if (capability === "quote-model") return "reserve-compact-quote-active";
  if (capability === "tracked-only") return "tracked-only";
  if (pool.venue === "uniswap-v4") return "unsupported";
  if (replaySurface === "cl-replay-v1") return "cl-compact-quote-active";
  return "cl-head-only";
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
  const unsupportedReason = unsupportedReasonForPool(pool, fee);
  const supportsQuoteModel = unsupportedReason === null;
  const supportsMarketState = clHeadSnapshotEligible(pool, fee);
  const capability: FamePoolStateCapability = supportsQuoteModel
    ? "quote-model"
    : supportsMarketState
      ? "market-state"
      : "tracked-only";
  const replaySurface: FamePoolStateReplaySurface | null =
    pool.id === "slipstream-usdc-weth-100" && supportsMarketState
      ? "cl-replay-v1"
      : null;

  return {
    id: pool.id,
    chainId: base.id,
    venue: pool.venue,
    venueFamily: venueFamilies[pool.venue],
    router: pool.router,
    factoryAddress: factoryAddress(pool),
    poolAddress: poolAddress(pool),
    poolKey: poolKey(pool),
    token0: token0(pool),
    token1: token1(pool),
    stable: stableFlag(pool),
    fee,
    tickSpacing: tickSpacing(pool),
    stateViewAddress: stateViewAddress(pool),
    capability,
    activationStatus: activationStatusForPool(
      pool,
      capability,
      replaySurface,
    ),
    stateSurface:
      capability === "quote-model"
        ? "constant-product-reserves"
        : capability === "market-state"
          ? "cl-head-snapshot"
          : null,
    replaySurface,
    quoteModel:
      capability === "quote-model" ? "constant-product-reserves" : null,
    unsupportedReason: capability === "tracked-only" ? unsupportedReason : null,
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
      activationLedgerHash: FAME_POOL_STATE_ACTIVATION_LEDGER_HASH,
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

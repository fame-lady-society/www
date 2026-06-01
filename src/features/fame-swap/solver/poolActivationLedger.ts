export const FAME_POOL_ACTIVATION_SCHEMA_VERSION = 1;
export const FAME_POOL_ACTIVATION_LEDGER_HASH =
  "0xb5b11fb5b0e829d7cef286ed3eb9df977260d1de50aabd658994b3995efb958b";

export const FAME_SELECTED_CL_ACTIVATION_CANDIDATE =
  "slipstream-basedflick-fame";
export const FAME_SELECTED_LIVE_ROUTE_DEPENDENCY = "uniswap-v4-basedflick-zora";

export const FAME_POOL_ACTIVATION_STATUS_VALUES = [
  "reserve-compact-quote-active",
  "cl-compact-quote-active",
  "cl-replay-candidate",
  "cl-head-only",
  "tracked-only",
  "blocked",
  "unsupported",
  "producer-unrepresented",
] as const;

export type FamePoolActivationStatus =
  (typeof FAME_POOL_ACTIVATION_STATUS_VALUES)[number];

export type FameProducerRegistryPresence =
  | "present"
  | "producer-only"
  | "producer-unrepresented";

export type FameConsumerQuoteCapability =
  | "reserve-compact-quote"
  | "cl-compact-quote"
  | "none";

export interface ReviewedFamePoolActivation {
  activationStatus: FamePoolActivationStatus;
  producerRegistryPresence: Exclude<
    FameProducerRegistryPresence,
    "producer-only"
  >;
  reason: string;
}

export interface ReviewedFamePoolActivationEntry
  extends ReviewedFamePoolActivation {
  poolId: string;
}

export const REVIEWED_POOL_ACTIVATIONS = {
  "aerodrome-v2-usdc-weth": {
    activationStatus: "reserve-compact-quote-active",
    producerRegistryPresence: "present",
    reason: "Reserve pool is active for compact quote rows.",
  },
  "scale-equalizer-frxusd-fame": {
    activationStatus: "reserve-compact-quote-active",
    producerRegistryPresence: "present",
    reason: "Reserve pool is active for compact quote rows.",
  },
  "scale-equalizer-scale-fame": {
    activationStatus: "reserve-compact-quote-active",
    producerRegistryPresence: "present",
    reason: "Reserve pool is active for compact quote rows.",
  },
  "scale-equalizer-usdc-frxusd": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Stable Solidly reserve math is not part of this activation lane; keep tracked for inventory only.",
  },
  "scale-equalizer-usdc-scale": {
    activationStatus: "reserve-compact-quote-active",
    producerRegistryPresence: "present",
    reason: "Reserve pool is active for compact quote rows.",
  },
  "scale-equalizer-weth-fame": {
    activationStatus: "reserve-compact-quote-active",
    producerRegistryPresence: "present",
    reason: "Reserve pool is active for compact quote rows.",
  },
  "slipstream-basedflick-fame": {
    activationStatus: "cl-compact-quote-active",
    producerRegistryPresence: "present",
    reason:
      "Selected v1 Slipstream CL leg is compact quote active for www routes; basedflick/ZORA remains a live V4 dependency.",
  },
  "slipstream-msusd-usdc-a": {
    activationStatus: "producer-unrepresented",
    producerRegistryPresence: "producer-unrepresented",
    reason:
      "Upstream Slipstream pool is not represented in the producer pool-state registry.",
  },
  "slipstream-spx-weth": {
    activationStatus: "producer-unrepresented",
    producerRegistryPresence: "producer-unrepresented",
    reason:
      "Upstream Slipstream pool is not represented in the producer pool-state registry.",
  },
  "slipstream-usdc-frxusd": {
    activationStatus: "cl-head-only",
    producerRegistryPresence: "present",
    reason:
      "Slipstream pool can support CL head-state diagnostics, but is not selected for compact quote activation in v1.",
  },
  "slipstream-usdc-weth-100": {
    activationStatus: "cl-compact-quote-active",
    producerRegistryPresence: "present",
    reason:
      "Reviewed Slipstream CL replay baseline is active for compact quote rows.",
  },
  "slipstream-usdc-weth-migrating-50": {
    activationStatus: "blocked",
    producerRegistryPresence: "producer-unrepresented",
    reason:
      "Aerodrome migrating pool belongs to the migration factory and must stay blocked until factory and tick-spacing assumptions are reviewed.",
  },
  "slipstream-weth-mseth": {
    activationStatus: "producer-unrepresented",
    producerRegistryPresence: "producer-unrepresented",
    reason:
      "Upstream Slipstream pool is not represented in the producer pool-state registry.",
  },
  "slipstream-zora-usdc": {
    activationStatus: "cl-head-only",
    producerRegistryPresence: "present",
    reason:
      "Slipstream pool can support CL head-state diagnostics, but is not selected for compact quote activation in v1.",
  },
  "slipstream-zora-weth": {
    activationStatus: "cl-head-only",
    producerRegistryPresence: "present",
    reason:
      "Slipstream pool can support CL head-state diagnostics, but is not selected for compact quote activation in v1.",
  },
  "slipstream2-msusd-mseth": {
    activationStatus: "producer-unrepresented",
    producerRegistryPresence: "producer-unrepresented",
    reason:
      "Slipstream2 pool is not represented in the producer registry and cannot inherit Slipstream replay support.",
  },
  "slipstream2-msusd-usdc-c": {
    activationStatus: "producer-unrepresented",
    producerRegistryPresence: "producer-unrepresented",
    reason:
      "Slipstream2 pool is not represented in the producer registry and cannot inherit Slipstream replay support.",
  },
  "uniswap-v2-fame-direct": {
    activationStatus: "reserve-compact-quote-active",
    producerRegistryPresence: "present",
    reason: "Reserve pool is active for compact quote rows.",
  },
  "uniswap-v2-usdc-weth": {
    activationStatus: "reserve-compact-quote-active",
    producerRegistryPresence: "present",
    reason: "Reserve pool is active for compact quote rows.",
  },
  "uniswap-v3-usdc-weth-30bps": {
    activationStatus: "cl-head-only",
    producerRegistryPresence: "present",
    reason:
      "Uniswap V3 pool can support CL head-state diagnostics, but is not compact quote active in this checkout.",
  },
  "uniswap-v3-usdc-weth-5bps": {
    activationStatus: "cl-head-only",
    producerRegistryPresence: "present",
    reason:
      "Uniswap V3 pool can support CL head-state diagnostics, but is not compact quote active in this checkout.",
  },
  "uniswap-v3-zora-usdc": {
    activationStatus: "cl-head-only",
    producerRegistryPresence: "present",
    reason:
      "Uniswap V3 pool can support CL head-state diagnostics, but is not compact quote active in this checkout.",
  },
  "uniswap-v3-zora-weth": {
    activationStatus: "cl-head-only",
    producerRegistryPresence: "present",
    reason:
      "Uniswap V3 pool can support CL head-state diagnostics, but is not compact quote active in this checkout.",
  },
  "uniswap-v4-basedflick-zora": {
    activationStatus: "unsupported",
    producerRegistryPresence: "present",
    reason:
      "Live V4 route dependency; Uniswap V4 compact quote support is unsupported until a V4 reducer model is reviewed.",
  },
  "uniswap-v4-usdc-eth": {
    activationStatus: "unsupported",
    producerRegistryPresence: "present",
    reason:
      "Uniswap V4 compact quote support is unsupported until PoolManager, PoolId, hook, fee, and StateView semantics have a reviewed reducer model.",
  },
  "uniswap-v4-zora-eth": {
    activationStatus: "unsupported",
    producerRegistryPresence: "present",
    reason:
      "Uniswap V4 compact quote support is unsupported until PoolManager, PoolId, hook, fee, and StateView semantics have a reviewed reducer model.",
  },
} as const satisfies Record<string, ReviewedFamePoolActivation>;

export function reviewedPoolActivation(
  poolId: string,
): ReviewedFamePoolActivation | undefined {
  return (
    REVIEWED_POOL_ACTIVATIONS as Record<
      string,
      ReviewedFamePoolActivation | undefined
    >
  )[poolId];
}

export function reviewedPoolActivationEntries(): ReviewedFamePoolActivationEntry[] {
  return Object.entries(REVIEWED_POOL_ACTIVATIONS).map(
    ([poolId, activation]) => ({
      poolId,
      ...activation,
    }),
  );
}

export function poolIdsForActivationStatus(
  status: FamePoolActivationStatus,
): string[] {
  return reviewedPoolActivationEntries()
    .filter((entry) => entry.activationStatus === status)
    .map((entry) => entry.poolId);
}

export function compactQuoteCapabilityForStatus(
  status: FamePoolActivationStatus,
): FameConsumerQuoteCapability {
  if (status === "reserve-compact-quote-active") {
    return "reserve-compact-quote";
  }
  if (status === "cl-compact-quote-active") {
    return "cl-compact-quote";
  }
  return "none";
}

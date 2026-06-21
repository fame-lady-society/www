export const FAME_POOL_ACTIVATION_SCHEMA_VERSION = 1;
export const FAME_POOL_ACTIVATION_LEDGER_HASH =
  "0x4212d61e225b7504c307c9ea60783147d485ea16e59bd8e0254257b5e6d59842";

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
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
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
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "scale-equalizer-usdc-scale": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
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
  "slipstream-spx-weth": {
    activationStatus: "producer-unrepresented",
    producerRegistryPresence: "producer-unrepresented",
    reason:
      "Upstream Slipstream pool is not represented in the producer pool-state registry.",
  },
  "slipstream-usdc-frxusd": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "slipstream-usdc-weth-100": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "slipstream-usdc-weth-migrating-50": {
    activationStatus: "blocked",
    producerRegistryPresence: "producer-unrepresented",
    reason:
      "Aerodrome migrating pool belongs to the migration factory and must stay blocked until factory and tick-spacing assumptions are reviewed.",
  },
  "slipstream-zora-usdc": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "slipstream-zora-weth": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "uniswap-v2-fame-direct": {
    activationStatus: "reserve-compact-quote-active",
    producerRegistryPresence: "present",
    reason: "Reserve pool is active for compact quote rows.",
  },
  "uniswap-v2-usdc-weth": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "uniswap-v3-usdc-weth-30bps": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "uniswap-v3-usdc-weth-5bps": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "uniswap-v3-zora-usdc": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "uniswap-v3-zora-weth": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "uniswap-v4-basedflick-zora": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "uniswap-v4-usdc-eth": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
  },
  "uniswap-v4-zora-eth": {
    activationStatus: "tracked-only",
    producerRegistryPresence: "present",
    reason:
      "Non-direct FAME pool disabled to keep producer and quote traffic scoped to direct FAME pairs.",
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

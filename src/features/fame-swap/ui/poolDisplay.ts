import type { VenueFamilyName } from "../router/types";

export interface FamePoolDisplayMetadata {
  poolId: string | null;
  displayName: string;
  venueLabel: string;
  poolTypeLabel: string;
  pairLabel: string;
  reviewed: boolean;
}

type ReviewedFamePoolDisplayMetadata = Omit<
  FamePoolDisplayMetadata,
  "poolId" | "displayName" | "reviewed"
> & {
  displayName?: string;
};

const POOL_DISPLAY_METADATA = {
  "scale-equalizer-frxusd-fame": {
    venueLabel: "Scale Equalizer",
    poolTypeLabel: "Solidly volatile pool",
    pairLabel: "frxUSD/FAME",
  },
  "scale-equalizer-scale-fame": {
    venueLabel: "Scale Equalizer",
    poolTypeLabel: "Solidly volatile pool",
    pairLabel: "SCALE/FAME",
  },
  "scale-equalizer-usdc-frxusd": {
    venueLabel: "Scale Equalizer",
    poolTypeLabel: "Solidly stable pool",
    pairLabel: "USDC/frxUSD",
  },
  "scale-equalizer-usdc-scale": {
    venueLabel: "Scale Equalizer",
    poolTypeLabel: "Solidly volatile pool",
    pairLabel: "USDC/SCALE",
  },
  "scale-equalizer-weth-fame": {
    venueLabel: "Scale Equalizer",
    poolTypeLabel: "Solidly volatile pool",
    pairLabel: "WETH/FAME",
  },
  "slipstream-basedflick-fame": {
    venueLabel: "Aerodrome Slipstream",
    poolTypeLabel: "Concentrated liquidity pool",
    pairLabel: "basedflick/FAME",
  },
  "slipstream-usdc-frxusd": {
    venueLabel: "Aerodrome Slipstream",
    poolTypeLabel: "Concentrated liquidity pool",
    pairLabel: "USDC/frxUSD",
  },
  "slipstream-zora-usdc": {
    venueLabel: "Aerodrome Slipstream",
    poolTypeLabel: "Concentrated liquidity pool",
    pairLabel: "ZORA/USDC",
  },
  "slipstream-zora-weth": {
    venueLabel: "Aerodrome Slipstream",
    poolTypeLabel: "Concentrated liquidity pool",
    pairLabel: "ZORA/WETH",
  },
  "uniswap-v2-fame-direct": {
    venueLabel: "Uniswap v2",
    poolTypeLabel: "Constant product pool",
    pairLabel: "WETH/FAME",
  },
  "uniswap-v3-zora-usdc": {
    venueLabel: "Uniswap v3",
    poolTypeLabel: "Concentrated liquidity pool",
    pairLabel: "ZORA/USDC",
  },
  "uniswap-v3-zora-weth": {
    venueLabel: "Uniswap v3",
    poolTypeLabel: "Concentrated liquidity pool",
    pairLabel: "ZORA/WETH",
  },
  "uniswap-v4-basedflick-zora": {
    venueLabel: "Uniswap v4",
    poolTypeLabel: "Hook pool",
    pairLabel: "basedflick/ZORA",
  },
  "uniswap-v4-zora-eth": {
    venueLabel: "Uniswap v4",
    poolTypeLabel: "PoolManager pool",
    pairLabel: "ZORA/ETH",
  },
} as const satisfies Record<string, ReviewedFamePoolDisplayMetadata>;

function displayNameForMetadata(
  metadata: ReviewedFamePoolDisplayMetadata,
): string {
  return metadata.displayName ?? `${metadata.venueLabel} ${metadata.pairLabel}`;
}

function titleizePoolId(poolId: string): string {
  return poolId
    .split("-")
    .map((part) => {
      if (part === "v2" || part === "v3" || part === "v4") return part;
      if (part === "usdc") return "USDC";
      if (part === "weth") return "WETH";
      if (part === "eth") return "ETH";
      if (part === "zora") return "ZORA";
      if (part === "fame") return "FAME";
      if (part === "frxusd") return "frxUSD";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function venueFallbackLabel(venue: VenueFamilyName): string {
  if (venue === "UniswapV2") return "Uniswap v2";
  if (venue === "UniswapV3") return "Uniswap v3";
  if (venue === "UniswapV4") return "Uniswap v4";
  if (venue === "Solidly") return "Solidly";
  if (venue === "Slipstream" || venue === "Slipstream2") {
    return "Aerodrome Slipstream";
  }

  return venue;
}

export function poolDisplayMetadata(
  poolId: string | undefined,
  venue: VenueFamilyName,
): FamePoolDisplayMetadata {
  if (!poolId) {
    return {
      poolId: null,
      displayName: venueFallbackLabel(venue),
      venueLabel: venueFallbackLabel(venue),
      poolTypeLabel: "Pool",
      pairLabel: "Pair unavailable",
      reviewed: false,
    };
  }

  const metadata = POOL_DISPLAY_METADATA[poolId];
  if (metadata) {
    return {
      poolId,
      displayName: displayNameForMetadata(metadata),
      venueLabel: metadata.venueLabel,
      poolTypeLabel: metadata.poolTypeLabel,
      pairLabel: metadata.pairLabel,
      reviewed: true,
    };
  }

  return {
    poolId,
    displayName: titleizePoolId(poolId),
    venueLabel: venueFallbackLabel(venue),
    poolTypeLabel: "Pool",
    pairLabel: "Pair unavailable",
    reviewed: false,
  };
}

export function poolDisplayName(
  poolId: string | undefined,
  venue: VenueFamilyName,
): string {
  return poolDisplayMetadata(poolId, venue).displayName;
}

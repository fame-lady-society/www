import type { VenueFamilyName } from "../router/types";

const POOL_LABELS: Record<string, string> = {
  "scale-equalizer-frxusd-fame": "Scale Equalizer frxUSD/FAME",
  "scale-equalizer-usdc-frxusd": "Scale Equalizer USDC/frxUSD",
  "scale-equalizer-weth-fame": "Scale Equalizer WETH/FAME",
  "slipstream-basedflick-fame": "Aerodrome Slipstream basedflick/FAME",
  "slipstream-usdc-frxusd": "Aerodrome Slipstream USDC/frxUSD",
  "uniswap-v2-fame-direct": "Uniswap v2 WETH/FAME",
  "uniswap-v3-zora-usdc": "Uniswap v3 ZORA/USDC",
  "uniswap-v3-zora-weth": "Uniswap v3 ZORA/WETH",
  "uniswap-v4-basedflick-zora": "Uniswap v4 basedflick/ZORA",
  "uniswap-v4-zora-eth": "Uniswap v4 ZORA/ETH",
};

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

export function poolDisplayName(
  poolId: string | undefined,
  venue: VenueFamilyName,
): string {
  if (!poolId) return venue;
  return POOL_LABELS[poolId] ?? titleizePoolId(poolId);
}

import type { Chain } from "viem";
import { base } from "viem/chains";

export function withFameForkRpc<Chains extends readonly [Chain, ...Chain[]]>(
  chains: Chains,
  rpcUrl: string | null,
): Chains {
  if (!rpcUrl) return chains;
  return chains.map((chain) =>
    chain.id === base.id
      ? {
          ...chain,
          rpcUrls: {
            ...chain.rpcUrls,
            default: { http: [rpcUrl] },
          },
        }
      : chain,
  ) as unknown as Chains;
}

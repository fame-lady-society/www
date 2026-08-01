import { getAddress, isAddress, type Address, type Chain } from "viem";
import { base } from "viem/chains";

export function resolveFameForkAccount({
  enabled,
  account,
}: {
  enabled: boolean;
  account: string | undefined;
}): Address | null {
  const candidate = account?.trim();
  if (!enabled || !candidate || !isAddress(candidate, { strict: false })) {
    return null;
  }
  return getAddress(candidate);
}

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

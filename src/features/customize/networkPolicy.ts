import { mainnet, sepolia } from "viem/chains";

export type CustomizeNetwork = "mainnet" | "sepolia";

export function resolveCustomizeNetworkPolicy(
  network: CustomizeNetwork,
  connectedChainId: number | undefined,
) {
  const targetChainId = network === "sepolia" ? sepolia.id : mainnet.id;

  return {
    targetChainId,
    shouldOfferSwitch:
      connectedChainId !== undefined && connectedChainId !== targetChainId,
  } as const;
}

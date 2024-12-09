import { redirect } from "next/navigation"
import { } from "connectkit";
import { FC } from "react";
import { useSwitchChain, useChainId, useChains } from "wagmi";
import { sepolia, base } from "viem/chains";

export const SwitchToChain: FC<{
  chainIds: (typeof sepolia | typeof base)[];
}> = ({ chainIds }) => {
  const switchChain = useSwitchChain();

};

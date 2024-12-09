"use client";

import { FC, useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useRouter, usePathname } from "next/navigation";

function chainIdToChainName(chainId: number) {
  switch (chainId) {
    case 11155111: return "sepolia";
    case 8453: return "base";
    case 1: return "mainnet";
  }
}

export const RedirectWhenConnected: FC<{
  pathPrefix: string;
  toChain: number;
}> = ({ pathPrefix, toChain }) => {
  const { isConnected, address, isConnecting } = useAccount();
  const chainId = useChainId();
  const {
    chains,
    switchChainAsync,
    isSuccess,
  } = useSwitchChain();
  const chain = chains.find((c) => c.id === toChain);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (toChain && chain && !isSuccess && toChain !== chainId && address) {
      switchChainAsync({ chainId: toChain }).then((newChain) => {
        if (newChain) {
          router.replace(`/${chainIdToChainName(newChain.id)}/${pathPrefix}/${address}`);
        }
      });
    }
  }, [toChain, chain, isSuccess, chainId, switchChainAsync, router, pathPrefix, address]);

  useEffect(() => {
    const possiblePath = `/${chainIdToChainName(chainId)}/${pathPrefix}/${address}`;
    if (isConnected && address && pathname !== possiblePath) {
      router.replace(possiblePath);
    }
  }, [isConnected, address, pathname, pathPrefix, isConnecting, router, chainId]);

  return null;
};

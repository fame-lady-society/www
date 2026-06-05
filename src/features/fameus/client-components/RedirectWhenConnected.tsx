"use client";

import { FC, useEffect, useState } from "react";
import { useSwitchChain, useChains } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
import { useRouter, usePathname } from "next/navigation";

function chainIdToChainName(chainId: number) {
  switch (chainId) {
    case 11155111:
      return "sepolia";
    case 8453:
      return "base";
    case 1:
      return "mainnet";
  }
}

export const RedirectWhenConnected: FC<{
  pathPrefix: string;
  pathPostfix?: string;
  toChain: number;
}> = ({ pathPrefix, pathPostfix, toChain }) => {
  const [targetChainId, setTargetChainId] = useState<number | undefined>(
    toChain,
  );
  const { isConnected, address, chainId: connectedChainId } = useAccount();
  const chains = useChains();
  const {
    mutateAsync: switchChainAsync,
    isSuccess,
    isPending,
  } = useSwitchChain({
    mutation: {
      onMutate(variables) {
        setTargetChainId(variables.chainId);
      },
      onError(error, variables, context) {
        setTargetChainId(toChain);
      },
      onSettled(data, error, variables, context) {},
    },
  });
  const chain = chains.find((c) => c.id === toChain);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      !isPending &&
      targetChainId &&
      chain &&
      !isSuccess &&
      targetChainId !== connectedChainId &&
      address
    ) {
      console.log("switching chain", targetChainId);
      switchChainAsync({ chainId: targetChainId }).then((newChain) => {
        const chainName = chainIdToChainName(newChain?.id ?? targetChainId);
        if (chainName) {
          router.replace(
            `/${chainName}/${pathPrefix ? pathPrefix + "/" : ""}${address}${pathPostfix ? "/" + pathPostfix : ""}`,
          );
        }
      });
    }
  }, [
    targetChainId,
    chain,
    isSuccess,
    connectedChainId,
    switchChainAsync,
    router,
    pathPrefix,
    address,
    isPending,
    pathPostfix,
  ]);

  useEffect(() => {
    const chainName = chainIdToChainName(toChain);
    if (!chainName) return;
    const possiblePath = `/${chainName}/${pathPrefix ? pathPrefix + "/" : ""}${address}${pathPostfix ? "/" + pathPostfix : ""}`;
    if (
      isConnected &&
      address &&
      connectedChainId === toChain &&
      pathname !== possiblePath
    ) {
      console.log(
        `redirecting to ${possiblePath} with chainId ${connectedChainId}`,
      );
      router.replace(possiblePath);
    }
  }, [
    isConnected,
    address,
    pathname,
    pathPrefix,
    router,
    connectedChainId,
    toChain,
    pathPostfix,
  ]);

  return null;
};

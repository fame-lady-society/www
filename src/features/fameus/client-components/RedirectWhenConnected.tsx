"use client";

import { FC, useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
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
  toChain: number;
}> = ({ pathPrefix, toChain }) => {
  const [targetChainId, setTargetChainId] = useState<number | undefined>(
    toChain,
  );
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { chains, switchChainAsync, isSuccess, isPending } = useSwitchChain({
    mutation: {
      onMutate(variables) {
        console.log("onMutate", variables);
        setTargetChainId(variables.chainId);
      },
      onError(error, variables, context) {
        console.log("onError", error, variables, context);
        setTargetChainId(toChain);
      },
      onSettled(data, error, variables, context) {
        console.log("onSettled", data, error, variables, context);
      },
    },
  });
  const chain = chains.find((c) => c.id === toChain);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("useEffect", targetChainId, chain, isSuccess, chainId);
    if (
      !isPending &&
      targetChainId &&
      chain &&
      !isSuccess &&
      targetChainId !== chainId &&
      address
    ) {
      switchChainAsync({ chainId: targetChainId }).then((newChain) => {
        if (newChain) {
          router.replace(
            `/${chainIdToChainName(newChain.id)}/${pathPrefix}/${address}`,
          );
        }
      });
    }
  }, [
    targetChainId,
    chain,
    isSuccess,
    chainId,
    switchChainAsync,
    router,
    pathPrefix,
    address,
    isPending,
  ]);

  useEffect(() => {
    const possiblePath = `/${chainIdToChainName(chainId)}/${pathPrefix}/${address}`;
    if (isConnected && address && pathname !== possiblePath) {
      router.replace(possiblePath);
    }
  }, [isConnected, address, pathname, pathPrefix, router, chainId]);

  return null;
};

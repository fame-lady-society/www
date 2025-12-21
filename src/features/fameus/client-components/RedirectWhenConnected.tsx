"use client";

import { FC, useEffect, useState } from "react";
import { useSwitchChain, useChains, useChainId } from "wagmi";
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
  const { isConnected, address } = useAccount();
  const chains = useChains();
  const chainId = useChainId();
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
      targetChainId !== chainId &&
      address
    ) {
      console.log("switching chain", targetChainId);
      switchChainAsync({ chainId: targetChainId }).then((newChain) => {
        if (newChain) {
          router.replace(
            `/${chainIdToChainName(newChain.id)}/${pathPrefix ? pathPrefix + "/" : ""}${address}${pathPostfix ? "/" + pathPostfix : ""}`,
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
    pathPostfix,
  ]);

  useEffect(() => {
    const possiblePath = `/${chainIdToChainName(chainId)}/${pathPrefix ? pathPrefix + "/" : ""}${address}${pathPostfix ? "/" + pathPostfix : ""}`;
    if (isConnected && address && pathname !== possiblePath) {
      console.log(`redirecting to ${possiblePath} with chainId ${chainId}`);
      router.replace(possiblePath);
    }
  }, [
    isConnected,
    address,
    pathname,
    pathPrefix,
    router,
    chainId,
    pathPostfix,
  ]);

  return null;
};

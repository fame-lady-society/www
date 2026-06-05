"use client";

import { FC, useEffect, useState } from "react";
import { useAccount } from "@/hooks/useAccount";
import { useSwitchChain } from "wagmi";
import { useRouter, usePathname } from "next/navigation";

export const RedirectWhenConnected: FC<{
  pathPrefix: string;
  pathPostfix?: string;
  toChain: number;
}> = ({ pathPrefix, pathPostfix, toChain }) => {
  const [targetChainId, setTargetChainId] = useState<number | undefined>(
    toChain,
  );
  const { isConnected, address, chainId: connectedChainId } = useAccount();
  const { chains, switchChainAsync, isSuccess, isPending } = useSwitchChain({
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
        if (newChain) {
          router.replace(
            `${pathPrefix ? pathPrefix + "/" : ""}${address}${pathPostfix ? "/" + pathPostfix : ""}`,
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
    const possiblePath = `${pathPrefix ? pathPrefix + "/" : ""}${address}${pathPostfix ? "/" + pathPostfix : ""}`;
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

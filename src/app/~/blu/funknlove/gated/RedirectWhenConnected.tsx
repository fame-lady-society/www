"use client";

import { FC, useEffect, useState } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
import { useRouter, usePathname } from "next/navigation";
import { useSIWE } from "connectkit";

export const RedirectWhenConnected: FC<{
  pathPrefix: string;
  pathPostfix?: string;
  toChain: number;
}> = ({ pathPrefix, pathPostfix, toChain }) => {
  const [targetChainId, setTargetChainId] = useState<number | undefined>(
    toChain,
  );
  const { isConnected, address } = useAccount();
  const { isSignedIn } = useSIWE();

  const chainId = useChainId();
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
      targetChainId !== chainId &&
      address &&
      isSignedIn
    ) {
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
    chainId,
    switchChainAsync,
    router,
    pathPrefix,
    address,
    isPending,
    pathPostfix,
    isSignedIn,
  ]);

  useEffect(() => {
    const possiblePath = `${pathPrefix ? pathPrefix + "/" : ""}${address}${pathPostfix ? "/" + pathPostfix : ""}`;
    if (isConnected && address && pathname !== possiblePath && isSignedIn) {
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
    isSignedIn,
  ]);

  return null;
};

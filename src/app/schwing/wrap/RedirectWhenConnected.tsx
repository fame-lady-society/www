"use client";

import { FC, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { useRouter, usePathname } from "next/navigation";

export const RedirectWhenConnected: FC<{
  pathPrefix: string;
  pathPostfix?: string;
}> = ({ pathPrefix, pathPostfix }) => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    const possiblePath = `/${pathPrefix ? pathPrefix + "/" : ""}${address}${pathPostfix ? "/" + pathPostfix : ""}`;
    if (isConnected && address && pathname !== possiblePath) {
      router.replace(possiblePath);
    }
  }, [isConnected, address, pathname, pathPrefix, router, chainId, pathPostfix]);

  return null;
};

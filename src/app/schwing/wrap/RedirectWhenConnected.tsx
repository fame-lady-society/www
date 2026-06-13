"use client";

import { FC, useEffect } from "react";
import { useAccount } from "@/hooks/useAccount";
import { useRouter, usePathname } from "next/navigation";

export const RedirectWhenConnected: FC<{
  pathPrefix: string;
  pathPostfix?: string;
}> = ({ pathPrefix, pathPostfix }) => {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const possiblePath = `/${pathPrefix ? pathPrefix + "/" : ""}${address}${pathPostfix ? "/" + pathPostfix : ""}`;
    if (isConnected && address && pathname !== possiblePath) {
      router.replace(possiblePath);
    }
  }, [
    isConnected,
    address,
    pathname,
    pathPrefix,
    router,
    pathPostfix,
  ]);

  return null;
};

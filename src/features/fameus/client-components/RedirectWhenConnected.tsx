"use client";

import React, { FC, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter, usePathname } from "next/navigation";

export const RedirectWhenConnected: FC<{
  pathPrefix: string;
}> = ({ pathPrefix }) => {
  const { isConnected, address, isConnecting } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isConnecting) return;

    const possiblePath = `${pathPrefix}/${address}`;

    if (isConnected && address && pathname !== possiblePath) {
      router.push(possiblePath);
    } else if (
      (!isConnected || !address) &&
      pathname?.startsWith(`${pathPrefix}/`)
    ) {
      router.push(pathPrefix);
    }
  }, [isConnected, address, pathname, pathPrefix, isConnecting, router]);

  return null;
};

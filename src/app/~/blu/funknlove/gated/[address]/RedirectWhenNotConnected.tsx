"use client";

import { FC, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useSIWE } from "connectkit";

export const RedirectWhenNotConnected: FC<{
  toGo: string;
  toChain: number;
}> = ({ toGo }) => {
  const { isConnected } = useAccount();
  const { isSignedIn } = useSIWE();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected || !isSignedIn) {
      router.push(toGo);
    }
  }, [isConnected, isSignedIn, router, toGo]);

  return null;
};

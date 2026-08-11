"use client";

import { FC, useEffect } from "react";
import { useAccount } from "@/hooks/useAccount";
import { useRouter } from "next/navigation";

export const RedirectWhenNotConnected: FC<{
  toGo: string;
  toChain: number;
}> = ({ toGo }) => {
  const { isConnected, isSignedIn } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected || !isSignedIn) {
      router.push(toGo);
    }
  }, [isConnected, isSignedIn, router, toGo]);

  return null;
};

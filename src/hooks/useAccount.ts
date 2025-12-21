"use client";

import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import type { sdk } from "@farcaster/miniapp-sdk";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export function useAccount() {
  const {
    address: wagmiAddress,
    isConnected,
    isConnecting,
    chain,
  } = useConnection();
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [miniAppContext, setMiniAppContext] = useState<Awaited<
    Awaited<(typeof sdk)["context"]>
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadMiniApp = async () => {
      if (typeof window === "undefined") return;

      import("@farcaster/miniapp-sdk").then(({ sdk }) => {
        if (cancelled) return;
        sdk.actions.ready().then(() => {
          if (cancelled) return;
          setIsMiniApp(true);
          sdk.context.then((context) => {
            if (cancelled) return;
            setMiniAppContext(context);
          });
        });
      });
    };
    loadMiniApp();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    address: wagmiAddress,
    isConnected,
    isConnecting,
    baseUrl,
    chain,
    chainId: chain?.id,
    isMiniApp,
    miniAppContext,
  };
}

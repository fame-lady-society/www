"use client";

import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { useSiweSession } from "@/context/SiweSession";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

type MiniAppContext = unknown;
type FarcasterMiniAppSdk = {
  actions: {
    ready: () => Promise<void>;
  };
  context: Promise<MiniAppContext>;
  isInMiniApp: () => Promise<boolean>;
};

export function useAccount() {
  const {
    address: wagmiAddress,
    isConnected,
    isConnecting,
    chain,
    chainId,
  } = useConnection();
  const [isMiniApp, setIsMiniApp] = useState(false);
  const { isSignedIn, signIn } = useSiweSession();
  const [miniAppContext, setMiniAppContext] = useState<MiniAppContext | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const loadMiniApp = async () => {
      try {
        const { sdk }: { sdk: FarcasterMiniAppSdk } = await import(
          "@farcaster/miniapp-sdk"
        );
        const isInMiniApp = await sdk.isInMiniApp();
        if (cancelled || !isInMiniApp) return;

        await sdk.actions.ready();
        if (cancelled) return;

        setIsMiniApp(true);
        const context = await sdk.context;
        if (cancelled) return;

        setMiniAppContext(context);
      } catch {
        if (cancelled) return;
      }
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
    chainId,
    isMiniApp,
    miniAppContext,
    isSignedIn,
    signIn,
  };
}

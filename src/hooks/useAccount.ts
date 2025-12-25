"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { SIWESession, useSIWE } from "connectkit";
import { StatusState } from "connectkit/build/siwe/SIWEContext";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

type HookProps = {
  isSignedIn: boolean;
  data?: SIWESession;
  status: StatusState;
  error?: Error | any;
  isRejected: boolean;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isReady: boolean;
  reset: () => void;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<boolean>;
};

export function useAccount() {
  const {
    address: wagmiAddress,
    isConnected,
    isConnecting,
    chain,
  } = useConnection();
  const [isMiniApp, setIsMiniApp] = useState(false);
  const { isSignedIn, signIn: signInSIWE } = useSIWE() as HookProps;
  const [miniAppContext, setMiniAppContext] = useState<Awaited<
    Awaited<(typeof sdk)["context"]>
  > | null>(null);

  const signIn = useCallback(async () => {
    if (isSignedIn) return true;
    const success = await signInSIWE();
    return success;
  }, [isSignedIn, signInSIWE]);

  useEffect(() => {
    let cancelled = false;
    const loadMiniApp = async () => {
      if (typeof window === "undefined") return;

      if (cancelled) return;
      sdk.actions.ready().then(() => {
        if (cancelled) return;
        setIsMiniApp(true);
        sdk.context.then((context) => {
          if (cancelled) return;
          setMiniAppContext(context);
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
    isSignedIn,
    signIn,
  };
}

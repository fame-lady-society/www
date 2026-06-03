"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { type SIWESession, useSIWE } from "connectkit";
import {
  getAuthSession,
  setAuthSession,
  withAuthHeaders,
} from "@/utils/authToken";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

type MiniAppContext = unknown;
type FarcasterMiniAppSdk = {
  actions: {
    ready: () => Promise<void>;
  };
  context: Promise<MiniAppContext>;
  isInMiniApp: () => Promise<boolean>;
};

type StatusState = "ready" | "loading" | "success" | "rejected" | "error";

type HookProps = {
  isSignedIn: boolean;
  data?: SIWESession;
  status: StatusState;
  error?: unknown;
  isRejected: boolean;
  isError: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isReady: boolean;
  reset: () => void;
  signIn?: () => Promise<unknown>;
  signOut: () => Promise<boolean>;
};

type SiweSessionResponse = {
  token?: string;
  expiresAt?: number;
};

async function restoreAuthSessionFromSiwe(): Promise<boolean> {
  let response: Response;
  try {
    response = await fetch("/siwe", {
      headers: withAuthHeaders(),
    });
  } catch {
    return false;
  }

  if (!response.ok) return false;

  const body = (await response.json()) as SiweSessionResponse;
  if (!body.token || typeof body.expiresAt !== "number") return false;

  setAuthSession({ token: body.token, expiresAt: body.expiresAt });
  return true;
}

export function useAccount() {
  const {
    address: wagmiAddress,
    isConnected,
    isConnecting,
    chain,
    chainId,
  } = useConnection();
  const [isMiniApp, setIsMiniApp] = useState(false);
  const { isSignedIn, signIn: signInSIWE } = useSIWE() as HookProps;
  const [miniAppContext, setMiniAppContext] =
    useState<MiniAppContext | null>(null);

  const signIn = useCallback(async () => {
    if (getAuthSession()?.token) return true;
    if (isSignedIn && (await restoreAuthSessionFromSiwe())) return true;
    if (!signInSIWE) return false;
    await signInSIWE();
    return getAuthSession()?.token ? true : await restoreAuthSessionFromSiwe();
  }, [isSignedIn, signInSIWE]);

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

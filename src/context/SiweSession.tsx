"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SiweMessage } from "siwe";
import { getAddress } from "viem";
import { useConnection, useConnectionEffect, useSignMessage } from "wagmi";
import { SiweAttemptCoordinator } from "./siweLifecycle";
import { fetchSiwe } from "./siweFetch";

const SIWE_API_PATH = "/siwe";

export type SiweSessionStatus =
  | "checking"
  | "ready"
  | "signing"
  | "signed_in"
  | "rejected"
  | "error";

export type SiweSession = {
  address: `0x${string}`;
  chainId: number;
  expiresAt: number;
};

type SiweSessionContextValue = {
  status: SiweSessionStatus;
  session: SiweSession | null;
  error: string | null;
  isSignedIn: boolean;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const SiweSessionContext = createContext<SiweSessionContextValue | null>(null);

function sameAddress(left: string | undefined, right: string | undefined) {
  if (!left || !right) return false;
  try {
    return getAddress(left) === getAddress(right);
  } catch {
    return false;
  }
}

function isWalletRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: number; name?: string };
  return (
    candidate.code === 4001 ||
    candidate.name === "UserRejectedRequestError" ||
    candidate.name === "UserRejectedRequestErrorType"
  );
}

async function readPublicError(response: Response): Promise<string> {
  const fallback = `SIWE request failed (${response.status})`;
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export function SiweSessionProvider({
  children,
  enabled = false,
  authChains,
}: PropsWithChildren<{
  enabled?: boolean;
  authChains: readonly number[];
}>) {
  const { address, chainId, isConnected } = useConnection();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<SiweSessionStatus>(
    enabled ? "checking" : "ready",
  );
  const [session, setSession] = useState<SiweSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const coordinatorRef = useRef(new SiweAttemptCoordinator());
  const serverCleanupRef = useRef<Promise<void>>(Promise.resolve());
  const previousAddressRef = useRef<string | undefined>(undefined);
  const liveAddressRef = useRef(address);
  const mountedRef = useRef(true);
  liveAddressRef.current = address;

  const clearClientSession = useCallback(() => {
    setSession(null);
    setError(null);
    setStatus("ready");
  }, []);

  const deleteServerSession = useCallback(
    async (attempt?: {
      address: string;
      nonce?: string;
      expiresAt?: number;
    }) => {
      const response = await fetchSiwe(SIWE_API_PATH, {
        method: "DELETE",
        credentials: "same-origin",
        ...(attempt && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attempt),
        }),
      });
      if (!response.ok) throw new Error(await readPublicError(response));
    },
    [],
  );

  const queueServerCleanup = useCallback(
    (attempt?: { address: string; nonce?: string; expiresAt?: number }) => {
      const cleanup = serverCleanupRef.current
        .catch(() => undefined)
        .then(() => deleteServerSession(attempt));
      serverCleanupRef.current = cleanup;
      return cleanup;
    },
    [deleteServerSession],
  );

  const signOut = useCallback(async () => {
    coordinatorRef.current.invalidate();
    clearClientSession();
    try {
      await queueServerCleanup();
    } catch (signOutError) {
      if (!mountedRef.current) return;
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Unable to clear the server session.",
      );
      setStatus("error");
    }
  }, [clearClientSession, queueServerCleanup]);

  const restoreSession = useCallback(async () => {
    if (coordinatorRef.current.hasInFlightAttempt()) return false;
    const epoch = coordinatorRef.current.currentEpoch();
    if (!enabled || !isConnected || !address) {
      if (mountedRef.current) clearClientSession();
      return false;
    }

    setStatus("checking");
    try {
      await serverCleanupRef.current.catch(() => undefined);
      const response = await fetchSiwe(SIWE_API_PATH, {
        credentials: "same-origin",
      });
      if (!coordinatorRef.current.isCurrent(epoch) || !mountedRef.current) {
        return false;
      }
      if (response.status === 401) {
        clearClientSession();
        return false;
      }
      if (!response.ok) throw new Error(await readPublicError(response));

      const restored = (await response.json()) as SiweSession;
      if (!sameAddress(restored.address, address)) {
        await queueServerCleanup({
          address: restored.address,
          expiresAt: restored.expiresAt,
        });
        if (coordinatorRef.current.isCurrent(epoch) && mountedRef.current) {
          clearClientSession();
        }
        return false;
      }

      if (!coordinatorRef.current.isCurrent(epoch) || !mountedRef.current) {
        return false;
      }
      setSession({ ...restored, address: getAddress(restored.address) });
      setError(null);
      setStatus("signed_in");
      return true;
    } catch (restoreError) {
      if (!coordinatorRef.current.isCurrent(epoch) || !mountedRef.current) {
        return false;
      }
      setSession(null);
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to restore the SIWE session.",
      );
      setStatus("error");
      return false;
    }
  }, [address, clearClientSession, enabled, isConnected, queueServerCleanup]);

  const signIn = useCallback((): Promise<boolean> => {
    if (!enabled || !isConnected || !address || !chainId) {
      setError("Connect a wallet before signing in.");
      setStatus("error");
      return Promise.resolve(false);
    }
    if (!authChains.includes(chainId)) {
      setError("Switch to a supported network before signing in.");
      setStatus("error");
      return Promise.resolve(false);
    }
    if (session && sameAddress(session.address, address)) {
      return Promise.resolve(true);
    }

    const signingAddress = getAddress(address);
    const signingChainId = chainId;
    return coordinatorRef.current.run(async (epoch) => {
      setError(null);
      setStatus("signing");
      try {
        await serverCleanupRef.current.catch(() => undefined);
        if (!coordinatorRef.current.isCurrent(epoch)) return false;

        const nonceResponse = await fetchSiwe(SIWE_API_PATH, {
          method: "PUT",
          credentials: "same-origin",
        });
        if (!nonceResponse.ok) {
          throw new Error(await readPublicError(nonceResponse));
        }
        const { nonce } = (await nonceResponse.json()) as { nonce?: string };
        if (!nonce) throw new Error("The SIWE server returned no nonce.");

        const message = new SiweMessage({
          nonce,
          chainId: signingChainId,
          address: signingAddress,
          version: "1",
          uri: window.location.origin,
          domain: window.location.host,
          statement: "Sign In With Ethereum to prove you control this wallet.",
        }).prepareMessage();
        const signature = await signMessageAsync({ message });

        if (
          !coordinatorRef.current.isCurrent(epoch) ||
          !mountedRef.current ||
          !sameAddress(signingAddress, liveAddressRef.current)
        ) {
          await queueServerCleanup({ address: signingAddress, nonce });
          return false;
        }

        const verifyResponse = await fetchSiwe(SIWE_API_PATH, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, signature }),
        });
        if (!verifyResponse.ok) {
          throw new Error(await readPublicError(verifyResponse));
        }
        const verified = (await verifyResponse.json()) as SiweSession;

        if (
          !coordinatorRef.current.isCurrent(epoch) ||
          !mountedRef.current ||
          !sameAddress(verified.address, liveAddressRef.current)
        ) {
          await queueServerCleanup({
            address: signingAddress,
            nonce,
            expiresAt: verified.expiresAt,
          });
          return false;
        }

        setSession({ ...verified, address: getAddress(verified.address) });
        setStatus("signed_in");
        return true;
      } catch (signInError) {
        if (!coordinatorRef.current.isCurrent(epoch) || !mountedRef.current) {
          return false;
        }
        setSession(null);
        if (isWalletRejection(signInError)) {
          setError("Signature request rejected.");
          setStatus("rejected");
        } else {
          setError(
            signInError instanceof Error
              ? signInError.message
              : "Unable to sign in with Ethereum.",
          );
          setStatus("error");
        }
        return false;
      }
    });
  }, [
    address,
    authChains,
    chainId,
    enabled,
    isConnected,
    queueServerCleanup,
    session,
    signMessageAsync,
  ]);

  const signInRef = useRef(signIn);
  useEffect(() => {
    signInRef.current = signIn;
  }, [signIn]);

  useConnectionEffect({
    onConnect({ isReconnected }) {
      if (enabled && !isReconnected) void signInRef.current();
    },
    onDisconnect() {
      if (enabled) void signOut();
    },
  });

  useEffect(() => {
    const coordinator = coordinatorRef.current;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      coordinator.invalidate();
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      coordinatorRef.current.invalidate();
      clearClientSession();
      return;
    }
    if (isConnected && address) void restoreSession();
    else clearClientSession();
  }, [address, clearClientSession, enabled, isConnected, restoreSession]);

  useEffect(() => {
    const previousAddress = previousAddressRef.current;
    previousAddressRef.current = address;
    if (
      enabled &&
      previousAddress &&
      address &&
      !sameAddress(previousAddress, address)
    ) {
      void signOut();
    }
  }, [address, enabled, signOut]);

  useEffect(() => {
    if (!session) return;
    const remainingMs = Math.max(0, session.expiresAt - Date.now());
    const timeout = window.setTimeout(() => {
      coordinatorRef.current.invalidate();
      clearClientSession();
    }, remainingMs);
    return () => window.clearTimeout(timeout);
  }, [clearClientSession, session]);

  const value = useMemo<SiweSessionContextValue>(
    () => ({
      status,
      session,
      error,
      isSignedIn:
        status === "signed_in" && sameAddress(session?.address, address),
      signIn,
      signOut,
    }),
    [address, error, session, signIn, signOut, status],
  );

  return (
    <SiweSessionContext.Provider value={value}>
      {children}
    </SiweSessionContext.Provider>
  );
}

export function useSiweSession(): SiweSessionContextValue {
  const context = useContext(SiweSessionContext);
  if (!context) {
    throw new Error("useSiweSession must be used within SiweSessionProvider.");
  }
  return context;
}

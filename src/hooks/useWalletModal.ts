"use client";

import { useAppKit, useAppKitState } from "@reown/appkit/react";
import { useCallback, useEffect, useRef, useState } from "react";

const WALLET_MODAL_LOAD_TIMEOUT_MS = 15_000;

export function useWalletModal() {
  const { open, close } = useAppKit();
  const state = useAppKitState();
  const [error, setError] = useState<string | null>(null);
  const openPromiseRef = useRef<Promise<unknown> | null>(null);

  const openConnect = useCallback(() => {
    if (openPromiseRef.current) return openPromiseRef.current;
    setError(null);
    const promise = open({ view: "Connect", namespace: "eip155" })
      .catch((cause) => {
        setError("Unable to open wallet options. Try again.");
        throw cause;
      })
      .finally(() => {
        openPromiseRef.current = null;
      });
    openPromiseRef.current = promise;
    return promise;
  }, [open]);

  const directoryIsLoading = state.loading && !state.connectingWallet;
  useEffect(() => {
    if (!directoryIsLoading) return;
    const timeout = window.setTimeout(() => {
      void close();
      setError("Wallet options took too long to load. Try again.");
    }, WALLET_MODAL_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [close, directoryIsLoading]);

  return {
    openConnect,
    close,
    error,
    isOpen: state.open,
    isInitialized: state.initialized,
    isLoading: !error && (state.loading || Boolean(state.connectingWallet)),
  };
}

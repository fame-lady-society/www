"use client";

import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { useConnection, useSwitchChain } from "wagmi";
import { base } from "viem/chains";

export function CreatorBaseNetworkGate({ children }: PropsWithChildren) {
  const { isConnected, chainId } = useConnection();
  const { mutateAsync: switchChain } = useSwitchChain();
  const [retryCount, setRetryCount] = useState(0);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const requestedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || chainId === base.id) {
      requestedRef.current = null;
      return;
    }

    const requestKey = `${chainId}:${retryCount}`;
    if (requestedRef.current === requestKey) return;
    requestedRef.current = requestKey;
    setSwitchError(null);

    void switchChain({ chainId: base.id }).catch((error: unknown) => {
      setSwitchError(
        error instanceof Error
          ? error.message
          : "Unable to switch to Base.",
      );
    });
  }, [chainId, isConnected, retryCount, switchChain]);

  if (!isConnected || chainId === base.id) return children;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
      {switchError ? (
        <>
          <h1 className="text-2xl font-semibold">Base is required</h1>
          <p className="mt-3 text-gray-600">
            Switch to Base to load Creator Portal token images and tools.
          </p>
          <p className="mt-2 text-sm text-red-600">{switchError}</p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-5 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Try switching again
          </button>
        </>
      ) : (
        <p role="status" aria-live="polite">
          Switching to Base to load the Creator Portal…
        </p>
      )}
    </div>
  );
}

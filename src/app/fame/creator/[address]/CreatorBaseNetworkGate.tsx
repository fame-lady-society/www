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
        error instanceof Error ? error.message : "Unable to switch to Base.",
      );
    });
  }, [chainId, isConnected, retryCount, switchChain]);

  if (!isConnected || chainId === base.id) return children;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-[#f4eee2]">
      {switchError ? (
        <>
          <h1 className="text-2xl font-semibold">Base is required</h1>
          <p className="mt-3 text-[#bdb4a4]">
            Switch to Base to load Creator Portal token images and tools.
          </p>
          <p className="mt-2 text-sm text-[#efc1b8]">{switchError}</p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="fame-action fame-focus mt-5 bg-[#c9aa67] px-4 py-2 font-bold text-[#0d0c0a] hover:bg-[#dfc584]"
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

"use client";

import { ConnectKitButton, useSIWE } from "connectkit";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function ConnectCard() {
  const { isSignedIn, signIn } = useSIWE();

  const [hasRendered, setHasRendered] = useState(false);
  const { isConnected, isConnecting: accountConnecting } = useAccount();

  useEffect(() => {
    setHasRendered(true);
  }, []);

  if (!hasRendered || accountConnecting) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white/5 rounded-lg p-8 text-center max-w-md">
          <CircularProgress size={60} />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <ConnectKitButton.Custom>
        {({ show, isConnecting }) => {
          return (
            <>
              {!isConnecting && (
                <>
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="bg-white/5 rounded-lg p-8 text-center max-w-md">
                      <h2 className="text-2xl font-semibold mb-4">
                        Connect Your Wallet
                      </h2>
                      <p className="text-gray-400 mb-6">
                        Connect your wallet to access the token gated content
                      </p>
                      <button
                        onClick={show}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        CONNECT
                      </button>
                    </div>
                  </div>
                </>
              )}
              {isConnecting && <CircularProgress size={60} />}
            </>
          );
        }}
      </ConnectKitButton.Custom>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white/5 rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Sign In With Ethereum</h2>
          <p className="text-gray-400 mb-6">
            Please sign in with your Ethereum wallet to access the content
          </p>
          <button
            onClick={() => signIn?.()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            SIGN IN WITH ETHEREUM
          </button>
        </div>
      </div>
    );
  }

  return null;
}

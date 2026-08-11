"use client";

import { WalletConnectControl } from "@/components/WalletConnectControl";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect, useState } from "react";
import { useAccount } from "@/hooks/useAccount";

export function ConnectCard() {
  const [hasRendered, setHasRendered] = useState(false);
  const {
    isConnected,
    isConnecting: accountConnecting,
    isSignedIn,
    signIn,
  } = useAccount();

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
      <WalletConnectControl>
        {({ open, isConnecting }) => {
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
                        onClick={open}
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
      </WalletConnectControl>
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
            onClick={() => void signIn()}
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

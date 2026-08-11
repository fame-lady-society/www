"use client";

import { WalletConnectControl } from "@/components/WalletConnectControl";
import { useAccount } from "@/hooks/useAccount";

export function PleaseConnectYourWallet() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return <p className="text-center">Touch anywhere to continue</p>;
  }

  return (
    <WalletConnectControl>
      {({ open }) => {
        return (
          <button
            className="rounded-lg border border-gray-200 p-4 text-center mx-auto block"
            onClick={open}
          >
            Please connect your wallet
          </button>
        );
      }}
    </WalletConnectControl>
  );
}

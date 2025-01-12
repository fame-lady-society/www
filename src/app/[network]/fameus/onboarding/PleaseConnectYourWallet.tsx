"use client";

import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";

export function PleaseConnectYourWallet() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return <p className="text-center">Touch anywhere to continue</p>;
  }

  return (
    <ConnectKitButton.Custom>
      {({ show }) => {
        return (
          <button
            className="rounded-lg border border-gray-200 p-4 text-center mx-auto block"
            onClick={show}
          >
            Please connect your wallet
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
}

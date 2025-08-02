"use client";
import { AppMain } from "@/layouts/AppMain";
import { ChainSelector } from "../ChainSelector";
import { useAccount, useChainId } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { base } from "viem/chains";
import { ConnectKitButton } from "connectkit";

export default function OnBoardingPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && chainId === base.id) {
      router.push("/fame/creator");
    }
  }, [isConnected, chainId, router]);

  const isOnCorrectNetwork = chainId === base.id;

  return (
    <AppMain title="Connect Wallet" isDao headerRight={<ChainSelector />}>
      <div className="w-full pl-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">
            Connect Your Wallet
          </h1>

          {!isConnected ? (
            <div className="text-center mb-8">
              <p className="text-lg mb-6">
                Please connect your wallet to access the FAME Creator Portal.
              </p>
              <ConnectKitButton />
            </div>
          ) : (
            <div className="text-center mb-8">
              <p className="text-lg mb-6">
                Wallet connected! Now switch to Base network to continue.
              </p>
              <div className="flex justify-center">
                <ChainSelector />
              </div>
            </div>
          )}

          {isConnected && !isOnCorrectNetwork && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
              <p className="font-medium">
                Please switch to Base network to continue.
              </p>
            </div>
          )}

          {isConnected && isOnCorrectNetwork && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <p className="font-medium">
                Perfect! You&apos;re connected and on the correct network.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppMain>
  );
}

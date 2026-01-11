"use client";
import { AppMain } from "@/layouts/AppMain";
import { VideoWipeInteraction } from "./VideoWipeInteraction";
import { ChainSelector } from "./ChainSelector";
import { useAccount } from "@/hooks/useAccount";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHasCreatorRole } from "./[address]/useHasCreatorRole";
import { base } from "viem/chains";

const videoWipeUrl = "/videos/wipe-1.mp4";

export default function CreatorPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const roles = useHasCreatorRole(address);

  useEffect(() => {
    if (isConnected && address) {
      router.push(`/fame/creator/${address}`);
    }
  }, [isConnected, address, router]);

  return (
    <>
      <AppMain
        title="FAME Creator Portal"
        mobileTitle="Create"
        isDao
        headerRight={<ChainSelector />}
      >
        <VideoWipeInteraction
          videoUrl={videoWipeUrl}
          redirectPath={`/fame/creator/on-boarding`}
          redirectWhenConnectedPath={`/fame/creator/${address}`}
          mustBeConnected={true}
        >
          <div className="w-full pl-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-6 text-center">
                FAME Creator Portal
              </h1>
              <p className="text-lg text-left mb-6">
                Welcome to the FAME Creator Portal. This is where creators can
                manage metadata for their $FAME Society NFTs by banishing tokens
                to different pools.
              </p>
              <p className="text-lg text-left mb-6">
                Connect your wallet and ensure you&apos;re on Base network to
                continue.
              </p>
              <p className="text-lg text-left mb-6">
                Touch anywhere to continue.
              </p>
            </div>
          </div>
        </VideoWipeInteraction>
      </AppMain>
    </>
  );
}

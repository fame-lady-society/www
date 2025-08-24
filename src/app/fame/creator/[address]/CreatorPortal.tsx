"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useHasCreatorRole } from "./useHasCreatorRole";
import { TokenSelection } from "./TokenSelection";
import { MetadataSwap } from "./MetadataSwap";

interface CreatorPortalProps {
  address: `0x${string}`;
  tokenIds: bigint[];
  burnPool: Array<{ tokenId: number; uri: string }>;
  nextArtPoolIndex: number;
  nextMintPoolIndex: number;
  mintPool: Array<{ tokenId: number; uri: string }>;
  artPool: Record<number, string>;
}

export function CreatorPortal({
  address,
  tokenIds,
  burnPool,
  nextArtPoolIndex,
  nextMintPoolIndex,
  mintPool,
  artPool,
}: CreatorPortalProps) {
  const { address: connectedAddress } = useAccount();
  const router = useRouter();
  const roles = useHasCreatorRole(address);
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);

  // Redirect if not connected or not the correct address
  if (!connectedAddress || connectedAddress !== address) {
    router.push("/fame/creator");
    return null;
  }

  // Redirect if user has no relevant roles
  const hasAnyRole = !!(
    roles?.isCreator ||
    roles?.isBanisher ||
    roles?.isArtPoolManager
  );

  if (!hasAnyRole) {
    return (
      <div className="w-full pl-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">Access Denied</h1>
          <p className="text-lg text-center mb-6">
            You&apos;re missing permissions for this Creator Portal.
          </p>
          <div className="text-center">
            <button
              onClick={() => router.push("/fame/creator")}
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pl-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">
          FAME Creator Portal
        </h1>
        <p className="text-lg text-center mb-8">
          Select a token to swap its metadata with another pool.
        </p>

        {selectedTokenId === null ? (
          <TokenSelection
            tokenIds={tokenIds}
            onTokenSelected={setSelectedTokenId}
          />
        ) : (
          <MetadataSwap
            selectedTokenId={Number(selectedTokenId)}
            burnPool={burnPool}
            nextArtPoolIndex={nextArtPoolIndex}
            nextMintPoolIndex={nextMintPoolIndex}
            mintPool={mintPool}
            artPool={artPool}
            roles={roles}
            onBack={() => setSelectedTokenId(null)}
          />
        )}
      </div>
    </div>
  );
}

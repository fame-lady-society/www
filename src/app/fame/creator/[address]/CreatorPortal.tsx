"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@/hooks/useAccount";
import { useRouter } from "next/navigation";
import { isAddressEqual } from "viem";
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
  const { address: connectedAddress, isConnecting } = useAccount();
  const router = useRouter();
  const roles = useHasCreatorRole(address);
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const isConnectedAddress = Boolean(
    connectedAddress && isAddressEqual(connectedAddress, address),
  );

  useEffect(() => {
    if (isConnecting) return;

    // Redirect if not connected or not the correct address
    if (!isConnectedAddress) {
      router.push("/fame/creator");
    }
  }, [isConnecting, isConnectedAddress, router]);

  useEffect(() => {
    if (!roles.isError || !roles.errorMessage) return;

    console.error("Creator Portal role read failed", roles.errorMessage);
  }, [roles.errorMessage, roles.isError]);

  if (!isConnectedAddress) {
    return null;
  }

  if (roles.isLoading || roles.isPending) {
    return (
      <div className="w-full pl-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">
            Checking Permissions
          </h1>
          <p className="text-lg text-center mb-6">
            Verifying Creator Portal roles on Base.
          </p>
        </div>
      </div>
    );
  }

  if (roles.isError) {
    return (
      <div className="w-full pl-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">
            Could Not Check Access
          </h1>
          <p className="text-lg text-center mb-6">
            We could not verify this wallet&apos;s Creator Portal permissions on
            Base. This is a read failure, not a confirmed missing-role denial.
          </p>
          {roles.errorMessage && (
            <p className="text-sm text-center mb-6 text-gray-400">
              Read failure: {roles.errorMessage}
            </p>
          )}
          <div className="text-center">
            <button
              onClick={() => void roles.refetch()}
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!roles.hasAnyRole) {
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
            address={address}
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

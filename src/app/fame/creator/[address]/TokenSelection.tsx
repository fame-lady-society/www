"use client";
import { useState } from "react";
import { SelectableGrid } from "./SelectableGrid";

interface TokenSelectionProps {
  tokenIds: bigint[];
  onTokenSelected: (tokenId: bigint) => void;
}

export function TokenSelection({
  tokenIds,
  onTokenSelected,
}: TokenSelectionProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);

  const handleTokenSelected = (tokenId: bigint) => {
    setSelectedTokenId(tokenId);
    onTokenSelected(tokenId);
  };

  const handleTokenUnselected = (tokenId: bigint) => {
    setSelectedTokenId(null);
  };

  if (tokenIds.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No NFTs Found</h2>
        <p className="text-lg text-gray-600">
          You don&apos;t own any $FAME Society NFTs that can be used for
          metadata swapping.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Select a Token</h2>
      <p className="text-lg mb-6">
        Choose one of your $FAME Society NFTs to swap its metadata.
      </p>

      <SelectableGrid
        tokenIds={tokenIds}
        selectedTokenIds={selectedTokenId ? [selectedTokenId] : []}
        pendingTokenIds={[]}
        onTokenSelected={handleTokenSelected}
        onTokenUnselected={handleTokenUnselected}
      />
    </div>
  );
}

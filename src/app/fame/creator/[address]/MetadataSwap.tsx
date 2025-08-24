"use client";
import { useState, useCallback } from "react";
import { useSwapMetadata } from "./useSwapMetadata";
import { base } from "viem/chains";
import { TransactionsModal, Transaction } from "@/components/TransactionsModal";
import { SwapModeGrid } from "./SwapModeGrid";
import { TokenPoolGrid } from "./TokenPoolGrid";
import { SwapMode } from "./SwapModeToken";
import MetadataIrysUploader from "@/components/MetadataIrysUploader";

interface MetadataSwapProps {
  selectedTokenId: number;
  burnPool: Array<{ tokenId: number; uri: string }>;
  nextArtPoolIndex: number;
  nextMintPoolIndex: number;
  mintPool: Array<{ tokenId: number; uri: string }>;
  artPool: Record<number, string>; // tokenId -> uri
  roles?: {
    isCreator?: boolean;
    isBanisher?: boolean;
    isArtPoolManager?: boolean;
    raw?: number;
  };
  onBack: () => void;
}

export function MetadataSwap({
  selectedTokenId,
  burnPool,
  nextArtPoolIndex,
  nextMintPoolIndex,
  mintPool,
  artPool,
  roles,
  onBack,
}: MetadataSwapProps) {
  const [swapMode, setSwapMode] = useState<SwapMode | null>(null);
  const [artPoolUrl, setArtPoolUrl] = useState("");
  const [endOfMintUrl, setEndOfMintUrl] = useState("");
  const [updateMetadataUrl, setUpdateMetadataUrl] = useState("");
  const [selectedBurnTokenId, setSelectedBurnTokenId] = useState<bigint | null>(
    null,
  );
  const [selectedMintTokenId, setSelectedMintTokenId] = useState<bigint | null>(
    null,
  );

  const {
    transactionState,
    banishToArtPool,
    banishToBurnPool,
    banishToMintPool,
    banishToEndOfMintPool,
    updateMetadata,
    closeTransactionModal,
    onTransactionConfirmed,
  } = useSwapMetadata(base.id);

  const [showUploaderFor, setShowUploaderFor] = useState<
    null | "art" | "end" | "update"
  >(null);

  const defaultTemplate = useCallback(
    (imageUrl: string) =>
      JSON.stringify({
        name: `FAME Society #${selectedTokenId}`,
        image: imageUrl,
        description:
          "Experience the innovative $FAME token from the Fame Lady Society, a DN404 project seamlessly integrating ERC20 and ERC721 standards. Each $FAME token is part of a revolutionary system where owning multiples of 1 million $FAME automatically mints a rare and exclusive Society NFT to your wallet. These NFTs, backed by 1 million $FAME tokens each, merge the worlds of liquidity and ownership, offering both stability and exclusivity.\n\nWhen you hold a Society NFT, you're not just an owner; you're part of a vibrant, empowering community dedicated to transparency, community governance, and women's empowerment in Web3. Selling any portion of the associated 1 million $FAME will cause the NFT to vanish, reflecting the unique balance of value and rarity within the Fame Lady Society ecosystem.\n\nThe Fame Lady Society, born from the pioneering all-female generative PFP project, continues to push boundaries by promoting true decentralization and sustainability. Fame Lady Society's mission is to transform Web3 into 'webWE,' ensuring every member has a voice in shaping the future. Join us in this exciting journey and redefine how NFTs and tokens can be traded and gamified.",
      }),
    [selectedTokenId],
  );

  const handleSubmit = async () => {
    if (!swapMode) return;

    try {
      switch (swapMode) {
        case "art":
          if (!artPoolUrl.trim()) {
            alert("Please enter a metadata URL");
            return;
          }
          await banishToArtPool(BigInt(selectedTokenId), artPoolUrl.trim());
          break;
        case "end":
          if (!endOfMintUrl.trim()) {
            alert("Please enter a metadata URL");
            return;
          }
          await banishToEndOfMintPool(
            BigInt(selectedTokenId),
            endOfMintUrl.trim(),
          );
          break;
        case "update":
          if (!updateMetadataUrl.trim()) {
            alert("Please enter a metadata URL");
            return;
          }
          await updateMetadata(
            BigInt(selectedTokenId),
            updateMetadataUrl.trim(),
          );
          break;
        case "burn":
          if (!selectedBurnTokenId) {
            alert("Please select a burn pool token");
            return;
          }
          await banishToBurnPool(BigInt(selectedTokenId), selectedBurnTokenId);
          break;
        case "mint":
          if (!selectedMintTokenId) {
            alert("Please select a mint pool token");
            return;
          }
          await banishToMintPool(BigInt(selectedTokenId), selectedMintTokenId);
          break;
      }
    } catch (error) {
      console.error("Error during metadata swap:", error);
    }
  };

  const resetForm = () => {
    setSwapMode(null);
    setArtPoolUrl("");
    setSelectedBurnTokenId(null);
    setSelectedMintTokenId(null);
  };

  const handleSwapModeSelected = (mode: SwapMode) => {
    setSwapMode(mode);
  };

  const handleSwapModeUnselected = () => {
    setSwapMode(null);
  };

  const handleBurnTokenSelected = (tokenId: bigint) => {
    setSelectedBurnTokenId(tokenId);
  };

  const handleBurnTokenUnselected = () => {
    setSelectedBurnTokenId(null);
  };

  const handleMintTokenSelected = (tokenId: bigint) => {
    setSelectedMintTokenId(tokenId);
  };

  const handleMintTokenUnselected = () => {
    setSelectedMintTokenId(null);
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 mr-4"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold">
          Swap Metadata for Token #{selectedTokenId}
        </h2>
      </div>

      {swapMode === null ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-4">Choose Swap Type:</h3>

          <SwapModeGrid
            nextArtPoolIndex={nextArtPoolIndex}
            nextMintPoolIndex={nextMintPoolIndex}
            selectedSwapMode={swapMode}
            onSwapModeSelected={handleSwapModeSelected}
            onSwapModeUnselected={handleSwapModeUnselected}
            roles={roles}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              {swapMode === "art" && "Art Pool Swap"}
              {swapMode === "burn" && "Burn Pool Swap"}
              {swapMode === "mint" && "Mint Pool Swap"}
            </h3>
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Change Type
            </button>
          </div>

          {swapMode === "art" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Metadata URL:
                </label>
                <input
                  type="url"
                  value={artPoolUrl}
                  onChange={(e) => setArtPoolUrl(e.target.value)}
                  placeholder="https://example.com/metadata.json"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                <div className="mt-2">
                  <button
                    className="px-3 py-1 mr-2 bg-indigo-600 text-white rounded"
                    onClick={() => setShowUploaderFor("art")}
                  >
                    Generate from image
                  </button>
                  {showUploaderFor === "art" && (
                    <div className="mt-3">
                      <MetadataIrysUploader
                        template={defaultTemplate}
                        onComplete={(txid) => {
                          setArtPoolUrl(`https://gateway.irys.xyz/${txid}`);
                          setShowUploaderFor(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {swapMode === "end" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Metadata URL (End of Mint):
                </label>
                <input
                  type="url"
                  value={endOfMintUrl}
                  onChange={(e) => setEndOfMintUrl(e.target.value)}
                  placeholder="https://example.com/metadata.json"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                <div className="mt-2">
                  <button
                    className="px-3 py-1 mr-2 bg-indigo-600 text-white rounded"
                    onClick={() => setShowUploaderFor("end")}
                  >
                    Generate from image
                  </button>
                  {showUploaderFor === "end" && (
                    <div className="mt-3">
                      <MetadataIrysUploader
                        template={defaultTemplate}
                        onComplete={(txid) => {
                          setEndOfMintUrl(`https://gateway.irys.xyz/${txid}`);
                          setShowUploaderFor(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {swapMode === "update" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Metadata URL (Update):
                </label>
                <input
                  type="url"
                  value={updateMetadataUrl}
                  onChange={(e) => setUpdateMetadataUrl(e.target.value)}
                  placeholder="https://example.com/metadata.json"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                <div className="mt-2">
                  <button
                    className="px-3 py-1 mr-2 bg-indigo-600 text-white rounded"
                    onClick={() => setShowUploaderFor("update")}
                  >
                    Generate from image
                  </button>
                  {showUploaderFor === "update" && (
                    <div className="mt-3">
                      <MetadataIrysUploader
                        template={defaultTemplate}
                        onComplete={(txid) => {
                          setUpdateMetadataUrl(
                            `https://gateway.irys.xyz/${txid}`,
                          );
                          setShowUploaderFor(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {swapMode === "burn" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Burn Pool Token:
                </label>
              </div>
            </div>
          )}

          {swapMode === "mint" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Mint Pool Token:
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={
                (swapMode === "art" && !artPoolUrl.trim()) ||
                (swapMode === "end" && !endOfMintUrl.trim()) ||
                (swapMode === "update" && !updateMetadataUrl.trim()) ||
                (swapMode === "burn" && !selectedBurnTokenId) ||
                (swapMode === "mint" && !selectedMintTokenId)
              }
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Submit Swap
            </button>
          </div>

          {swapMode === "burn" && (
            <TokenPoolGrid
              tokens={burnPool}
              selectedTokenId={selectedBurnTokenId}
              onTokenSelected={handleBurnTokenSelected}
              onTokenUnselected={handleBurnTokenUnselected}
              poolType="burn"
            />
          )}

          {swapMode === "mint" && (
            <TokenPoolGrid
              tokens={mintPool}
              selectedTokenId={selectedMintTokenId}
              onTokenSelected={handleMintTokenSelected}
              onTokenUnselected={handleMintTokenUnselected}
              poolType="mint"
            />
          )}
        </div>
      )}

      <TransactionsModal
        open={transactionState.transactionModelOpen}
        onClose={closeTransactionModal}
        transactions={transactionState.activeTransactionHashList}
        onTransactionConfirmed={onTransactionConfirmed}
        topContent={
          <p className="mb-4">
            This transaction will swap the metadata of the selected token.
          </p>
        }
      />
    </div>
  );
}

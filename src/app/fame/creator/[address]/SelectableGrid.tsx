import { useClient } from "wagmi";
import { SelectableToken } from "./SelectableToken";
import { useCallback, useEffect, useState } from "react";
import { readContract } from "viem/actions";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { base } from "viem/chains";
import { creatorArtistMagicAbi } from "@/wagmi";

export const SelectableGrid = ({
  tokenIds,
  burnPool,
  mintPool,
  selectedTokenIds,
  pendingTokenIds,
  onTokenSelected,
  onTokenUnselected,
}: {
  tokenIds: bigint[];
  selectedTokenIds: bigint[];
  pendingTokenIds: bigint[];
  burnPool?: { tokenId: bigint; uri: string }[];
  mintPool?: { tokenId: bigint; uri: string }[];
  onTokenSelected: (tokenId: bigint) => void;
  onTokenUnselected: (tokenId: bigint) => void;
}) => {
  const client = useClient();
  const [images, setImages] = useState<Record<number, string>>({});
  const fetchImage = useCallback(
    async (tokenId: bigint) => {
      const tokenIdIndex = Number(tokenId);
      if (!client) throw new Error("Client not available");
      const response = await readContract(client, {
        address: creatorArtistMagicAddress(base.id),
        abi: creatorArtistMagicAbi,
        functionName: "tokenURI",
        args: [tokenId],
      }).then((uri) => fetch(uri));
      const { image } = await response.json();
      return image;
    },
    [client],
  );

  useEffect(() => {
    // Use artPool and burnPool to prime the images, then fetch the rest
    const fetchImages = async () => {
      const poolIds = new Set([
        ...(mintPool?.map(({ tokenId }) => Number(tokenId)) ?? []),
        ...(burnPool?.map(({ tokenId }) => Number(tokenId)) ?? []),
      ]);
      const idsToFetch = tokenIds.filter(
        (tokenId) => !poolIds.has(Number(tokenId)),
      );
      const imagePromises = idsToFetch.map(async (tokenId) => {
        const image = await fetchImage(tokenId);
        return { tokenId: Number(tokenId), image };
      });
      const results = await Promise.all(imagePromises);
      const newImages: Record<number, string> = {};
      for (const { tokenId, image } of results) {
        newImages[tokenId] = image;
      }
      setImages((prev) => ({ ...prev, ...newImages }));
    };
    if (tokenIds.length > 0) void fetchImages();
    setImages((prev) => {
      const updatedImages = { ...prev };
      burnPool?.forEach(({ tokenId, uri }) => {
        updatedImages[Number(tokenId)] = uri;
      });
      mintPool?.forEach(({ tokenId, uri }) => {
        updatedImages[Number(tokenId)] = uri;
      });
      return updatedImages;
    });
  }, [burnPool, fetchImage, mintPool, tokenIds]);

  return (
    <div className="flex flex-wrap gap-4">
      {tokenIds.map((tokenId) => (
        <SelectableToken
          key={tokenId.toString()}
          tokenId={tokenId}
          imageUrl={images[Number(tokenId)] || ""}
          onTokenSelected={onTokenSelected}
          onTokenUnselected={onTokenUnselected}
          isSelected={selectedTokenIds.includes(tokenId)}
          isPending={pendingTokenIds.includes(tokenId)}
        />
      ))}
    </div>
  );
};

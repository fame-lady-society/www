import { FC, useCallback, useState } from "react";
import cn from "classnames";
import NextImage from "next/image";
import { FlowerSelect } from "@/components/FlowerSelect";

const ImageForToken: FC<{
  tokenId: bigint;
  uri: string;
  onClick: () => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
  isSelected: boolean;
}> = ({ tokenId, uri, onClick, onHoverIn, onHoverOut, isSelected }) => {
  return (
    <NextImage
      src={uri}
      alt={`Token ${tokenId.toString()}`}
      width={120}
      height={120}
      onClick={onClick}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      className={cn(
        "border-4 transition-all duration-300 rounded-md cursor-pointer",
        isSelected ? "border-red-400" : "border-transparent",
      )}
    />
  );
};

export const TokenPoolToken = ({
  tokenId,
  uri,
  poolType,
  onTokenSelected,
  onTokenUnselected,
  isSelected,
}: {
  tokenId: bigint;
  uri: string;
  poolType: "burn" | "mint";
  onTokenSelected: (tokenId: bigint) => void;
  onTokenUnselected: () => void;
  isSelected: boolean;
}) => {
  const [hasHovered, setHasHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (isSelected) {
      onTokenUnselected();
    } else {
      onTokenSelected(tokenId);
    }
  }, [isSelected, onTokenSelected, onTokenUnselected, tokenId]);

  const handleHoverIn = useCallback(() => {
    setHasHovered(true);
  }, []);

  const handleHoverOut = useCallback(() => {
    setHasHovered(false);
  }, []);

  return (
    <div className="relative">
      <ImageForToken
        tokenId={tokenId}
        uri={uri}
        onClick={handleClick}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        isSelected={isSelected || hasHovered}
      />
      <FlowerSelect isSelected={isSelected} />
    </div>
  );
};

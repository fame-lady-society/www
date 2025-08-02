import { FC, useCallback, useState } from "react";
import cn from "classnames";
import NextImage from "next/image";
import { FlowerSelect } from "@/components/FlowerSelect";

const BASE_URL = "https://fame.support/thumb/";

const ImageForToken: FC<{
  imageUrl: string;
  onClick: () => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
  isSelected: boolean;
}> = ({ imageUrl, onClick, onHoverIn, onHoverOut, isSelected }) => {
  return (
    <NextImage
      src={imageUrl}
      alt="FAMEus"
      width={400}
      height={400}
      onClick={onClick}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      className={cn(
        "border-4 transition-all duration-300",
        isSelected && "border-red-400",
        !isSelected && "border-transparent",
      )}
    />
  );
};

export const SelectableToken = ({
  tokenId,
  imageUrl,
  onTokenSelected,
  onTokenUnselected,
  isSelected,
  isPending,
}: {
  tokenId: bigint;
  imageUrl: string;
  onTokenSelected: (tokenId: bigint) => void;
  onTokenUnselected: (tokenId: bigint) => void;
  isSelected: boolean;
  isPending: boolean;
}) => {
  const [hasHovered, setHasHovered] = useState(false);
  const handleClick = useCallback(() => {
    if (isSelected) {
      onTokenUnselected(tokenId);
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
        imageUrl={imageUrl}
        onClick={handleClick}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        isSelected={isSelected || hasHovered}
      />
      <FlowerSelect isSelected={isSelected} />
      {isPending && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

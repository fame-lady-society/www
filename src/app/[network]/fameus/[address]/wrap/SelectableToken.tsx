import { FC, useCallback, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import cn from "classnames";
import NextImage from "next/image";
import { FlowerSelect } from "@/components/FlowerSelect";

const BASE_URL = "https://fame.support/thumb/";

const ImageForToken: FC<{
  tokenId: bigint;
  onClick: () => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
  isSelected: boolean;
}> = ({ tokenId, onClick, onHoverIn, onHoverOut, isSelected }) => {
  return (
    <NextImage
      src={`${BASE_URL}${tokenId.toString()}`}
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
  onTokenSelected,
  onTokenUnselected,
  isSelected,
  isPending,
}: {
  tokenId: bigint;
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
        tokenId={tokenId}
        onClick={handleClick}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        isSelected={isSelected || hasHovered}
      />
      <FlowerSelect isSelected={isSelected} />
      {isPending && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <CircularProgress />
        </div>
      )}
    </div>
  );
};

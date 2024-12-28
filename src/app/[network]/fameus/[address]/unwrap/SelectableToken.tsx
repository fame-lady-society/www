import { FC, useCallback, useState } from "react";
import cn from "classnames";
import NextImage from "next/image";

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
        "border-4 border-transparent transition-all duration-300",
        isSelected && "border-red-400",
      )}
    />
  );
};

export const SelectableToken = ({
  tokenId,
  onTokenSelected,
  onTokenUnselected,
  isSelected,
}: {
  tokenId: bigint;
  onTokenSelected: (tokenId: bigint) => void;
  onTokenUnselected: (tokenId: bigint) => void;
  isSelected: boolean;
}) => {
  const handleClick = useCallback(() => {
    if (isSelected) {
      onTokenUnselected(tokenId);
    } else {
      onTokenSelected(tokenId);
    }
  }, [isSelected, onTokenSelected, onTokenUnselected, tokenId]);

  const handleHoverIn = useCallback(() => {
    // TODO: Add hover in effect
  }, []);

  const handleHoverOut = useCallback(() => {
    // TODO: Add hover out effect
  }, []);

  return (
    <ImageForToken
      tokenId={tokenId}
      onClick={handleClick}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      isSelected={isSelected}
    />
  );
};

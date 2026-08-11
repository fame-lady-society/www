import { useCallback } from "react";

import { SelectableTokenTile } from "@/components/SelectableTokenTile";

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
    <SelectableTokenTile
      tokenId={tokenId}
      label="Schwing token"
      onClick={handleClick}
      onMouseEnter={handleHoverIn}
      onMouseLeave={handleHoverOut}
      isHighlighted={isSelected}
    />
  );
};

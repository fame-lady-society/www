import { useCallback, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { FlowerSelect } from "@/components/FlowerSelect";
import { SelectableTokenTile } from "@/components/SelectableTokenTile";

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
      <SelectableTokenTile
        tokenId={tokenId}
        label="Society"
        onClick={handleClick}
        onMouseEnter={handleHoverIn}
        onMouseLeave={handleHoverOut}
        isHighlighted={isSelected || hasHovered}
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

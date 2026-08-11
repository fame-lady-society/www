import { useCallback, useState } from "react";
import cn from "classnames";
import LockIcon from "@mui/icons-material/LockOutlined";
import UnlockIcon from "@mui/icons-material/LockOpenOutlined";
import CircularProgress from "@mui/material/CircularProgress";

import { FlowerSelect } from "@/components/FlowerSelect";
import { SelectableTokenTile } from "@/components/SelectableTokenTile";
import { zeroAddress } from "viem";

export const SelectableToken = ({
  tokenId,
  isLocked,
  guardianAddress,
  onTokenSelected,
  onTokenUnselected,
  isSelected,
  isPending,
}: {
  tokenId: bigint;
  isLocked: boolean;
  guardianAddress: string | null;
  onTokenSelected: (tokenId: bigint) => void;
  onTokenUnselected: (tokenId: bigint) => void;
  isSelected: boolean;
  isPending: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasHovered, setHasHovered] = useState(false);
  const handleClick = useCallback(() => {
    if (isPending) {
      return;
    }

    if (isSelected) {
      onTokenUnselected(tokenId);
    } else {
      onTokenSelected(tokenId);
    }
  }, [isPending, isSelected, onTokenSelected, onTokenUnselected, tokenId]);

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
        label="Governance Society"
        onClick={handleClick}
        onMouseEnter={handleHoverIn}
        onMouseLeave={handleHoverOut}
        isHighlighted={isSelected || hasHovered}
      />
      <FlowerSelect isSelected={isSelected} />
      {isLocked ? (
        <LockIcon
          className="absolute top-2 right-2 border-2 border-white rounded-full p-1 bg-transparent"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          onClick={() => setIsVisible(!isVisible)}
        />
      ) : (
        <UnlockIcon
          className="absolute top-2 right-2 border-2 border-white rounded-full p-1 bg-transparent"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          onClick={() => setIsVisible(!isVisible)}
        />
      )}
      {isVisible && (
        <div
          className={cn(
            "absolute z-10 right-8 top-2 p-2 mt-2 pl-4 text-sm text-white bg-gray-800 rounded-lg shadow-lg",
            guardianAddress !== null && guardianAddress !== zeroAddress
              ? "w-128"
              : "w-64",
          )}
        >
          {guardianAddress === null && !isLocked
            ? "This token is not locked"
            : (guardianAddress === zeroAddress || guardianAddress === null) &&
                isLocked
              ? "This token is locked by you"
              : `This token is locked by ${guardianAddress}`}
        </div>
      )}
      {isPending && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <CircularProgress />
        </div>
      )}
    </div>
  );
};

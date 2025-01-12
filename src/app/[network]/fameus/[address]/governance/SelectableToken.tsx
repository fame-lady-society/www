import { FC, useCallback, useState } from "react";
import cn from "classnames";
import LockIcon from "@mui/icons-material/LockOutlined";
import UnlockIcon from "@mui/icons-material/LockOpenOutlined";
import NextImage from "next/image";

import { FlowerSelect } from "@/components/FlowerSelect";
import { zeroAddress } from "viem";

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
  isLocked,
  guardianAddress,
  onTokenSelected,
  onTokenUnselected,
  isSelected,
}: {
  tokenId: bigint;
  isLocked: boolean;
  guardianAddress: string | null;
  onTokenSelected: (tokenId: bigint) => void;
  onTokenUnselected: (tokenId: bigint) => void;
  isSelected: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
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
          {guardianAddress === null
            ? "This token is not locked"
            : guardianAddress === zeroAddress
              ? "This token is locked by you"
              : `This token is locked by ${guardianAddress}`}
        </div>
      )}
    </div>
  );
};

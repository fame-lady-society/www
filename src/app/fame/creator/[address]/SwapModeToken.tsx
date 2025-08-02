import { FC, useCallback, useState } from "react";
import cn from "classnames";

type SwapMode = "art" | "burn" | "mint";

const SwapModeCard: FC<{
  mode: SwapMode;
  title: string;
  description: string;
  color: string;
  hoverColor: string;
  index?: number;
  onClick: () => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
  isSelected: boolean;
}> = ({
  mode,
  title,
  description,
  color,
  hoverColor,
  index,
  onClick,
  onHoverIn,
  onHoverOut,
  isSelected,
}) => {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      className={cn(
        "p-6 border-2 rounded-lg text-left transition-all duration-300 cursor-pointer",
        color,
        hoverColor,
        isSelected && "bg-opacity-10",
        !isSelected && "bg-opacity-0",
      )}
    >
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
      {index !== undefined && (
        <div className="mt-2 text-xs text-gray-500">
          Next available: #{index}
        </div>
      )}
    </div>
  );
};

export const SwapModeToken = ({
  mode,
  title,
  description,
  color,
  hoverColor,
  index,
  onSwapModeSelected,
  onSwapModeUnselected,
  isSelected,
}: {
  mode: SwapMode;
  title: string;
  description: string;
  color: string;
  hoverColor: string;
  index?: number;
  onSwapModeSelected: (mode: SwapMode) => void;
  onSwapModeUnselected: () => void;
  isSelected: boolean;
}) => {
  const [hasHovered, setHasHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (isSelected) {
      onSwapModeUnselected();
    } else {
      onSwapModeSelected(mode);
    }
  }, [isSelected, onSwapModeSelected, onSwapModeUnselected, mode]);

  const handleHoverIn = useCallback(() => {
    setHasHovered(true);
  }, []);

  const handleHoverOut = useCallback(() => {
    setHasHovered(false);
  }, []);

  return (
    <div className="relative">
      <SwapModeCard
        mode={mode}
        title={title}
        description={description}
        color={color}
        hoverColor={hoverColor}
        index={index}
        onClick={handleClick}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        isSelected={isSelected || hasHovered}
      />
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      )}
    </div>
  );
};

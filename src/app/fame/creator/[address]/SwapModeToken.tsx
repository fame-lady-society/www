import { FC, useCallback, useState } from "react";
import cn from "classnames";

export type SwapMode = "art" | "burn" | "mint" | "end" | "update";

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
  disabled?: boolean;
  tooltip?: string;
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
  disabled,
  tooltip,
}) => {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      title={tooltip}
      aria-disabled={disabled}
      className={cn(
        "p-6 border-2 rounded-lg text-left transition-all duration-300",
        color,
        hoverColor,
        isSelected && "bg-opacity-10",
        !isSelected && "bg-opacity-0",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
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
  disabled,
  tooltip,
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
  disabled?: boolean;
  tooltip?: string;
}) => {
  const [hasHovered, setHasHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (isSelected) {
      onSwapModeUnselected();
    } else {
      onSwapModeSelected(mode);
    }
  }, [isSelected, onSwapModeSelected, onSwapModeUnselected, mode, disabled]);

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

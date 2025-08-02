import { SwapModeToken } from "./SwapModeToken";

type SwapMode = "art" | "burn" | "mint";

export const SwapModeGrid = ({
  nextArtPoolIndex,
  nextMintPoolIndex,
  selectedSwapMode,
  onSwapModeSelected,
  onSwapModeUnselected,
}: {
  nextArtPoolIndex: number;
  nextMintPoolIndex: number;
  selectedSwapMode: SwapMode | null;
  onSwapModeSelected: (mode: SwapMode) => void;
  onSwapModeUnselected: () => void;
}) => {
  const swapModes: Array<{
    mode: SwapMode;
    title: string;
    description: string;
    color: string;
    hoverColor: string;
    index?: number;
  }> = [
    {
      mode: "art",
      title: "Art Pool",
      description:
        "Add custom metadata URL. The original metadata goes to the art pool.",
      color: "border-blue-500",
      hoverColor: "hover:bg-blue-50",
    },
    {
      mode: "burn",
      title: "Burn Pool",
      description: `Swap with metadata from a burned token #${nextArtPoolIndex}.`,
      color: "border-red-500",
      hoverColor: "hover:bg-red-50",
      index: nextArtPoolIndex,
    },
    {
      mode: "mint",
      title: "Mint Pool",
      description: `Swap with metadata from an unminted token #${nextMintPoolIndex}.`,
      color: "border-green-500",
      hoverColor: "hover:bg-green-50",
      index: nextMintPoolIndex,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {swapModes.map(
        ({ mode, title, description, color, hoverColor, index }) => (
          <SwapModeToken
            key={mode}
            mode={mode}
            title={title}
            description={description}
            color={color}
            hoverColor={hoverColor}
            index={index}
            onSwapModeSelected={onSwapModeSelected}
            onSwapModeUnselected={onSwapModeUnselected}
            isSelected={selectedSwapMode === mode}
          />
        ),
      )}
    </div>
  );
};

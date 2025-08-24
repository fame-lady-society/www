import { SwapModeToken } from "./SwapModeToken";

type SwapMode = "art" | "burn" | "mint" | "end" | "update";

export const SwapModeGrid = ({
  nextArtPoolIndex,
  nextMintPoolIndex,
  selectedSwapMode,
  onSwapModeSelected,
  onSwapModeUnselected,
  roles,
}: {
  nextArtPoolIndex: number;
  nextMintPoolIndex: number;
  selectedSwapMode: SwapMode | null;
  onSwapModeSelected: (mode: SwapMode) => void;
  onSwapModeUnselected: () => void;
  roles?: {
    isCreator?: boolean;
    isBanisher?: boolean;
    isArtPoolManager?: boolean;
  };
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
    {
      mode: "end",
      title: "End of Mint Pool",
      description:
        "Add custom metadata URL. The original metadata goes to the end of mint pool.",
      color: "border-yellow-500",
      hoverColor: "hover:bg-yellow-50",
    },
    {
      mode: "update",
      title: "Update Metadata",
      description: "Replace metadata for a token without consuming pools.",
      color: "border-indigo-500",
      hoverColor: "hover:bg-indigo-50",
    },
  ];

  const allowed = (mode: SwapMode) => {
    const isCreator = Boolean(roles?.isCreator);
    const isBanisher = Boolean(roles?.isBanisher);
    const isArtPoolManager = Boolean(roles?.isArtPoolManager);

    switch (mode) {
      case "art":
        return isCreator || isArtPoolManager;
      case "burn":
      case "mint":
      case "end":
        return isCreator || isBanisher;
      case "update":
        return isCreator;
      default:
        return false;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {swapModes
        .filter((s) => allowed(s.mode))
        .map(({ mode, title, description, color, hoverColor, index }) => {
          const isAllowed = allowed(mode);
          let tooltip: string | undefined = undefined;
          if (!isAllowed) {
            switch (mode) {
              case "art":
                tooltip = "Requires CREATOR or ART_POOL_MANAGER role";
                break;
              case "burn":
              case "mint":
              case "end":
                tooltip = "Requires CREATOR or BANISHER role";
                break;
              case "update":
                tooltip = "Requires CREATOR role";
                break;
            }
          }

          return (
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
              disabled={!isAllowed}
              tooltip={tooltip}
            />
          );
        })}
    </div>
  );
};

import cn from "classnames";

export const SelectableTokenTile = ({
  tokenId,
  label,
  isHighlighted,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  tokenId: bigint;
  label: string;
  isHighlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => (
  <button
    type="button"
    aria-label={`${label} ${tokenId.toString()}`}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={cn(
      "flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-md border-4 bg-gray-900 text-white transition-all duration-300",
      isHighlighted ? "border-red-400" : "border-transparent",
    )}
  >
    <span className="text-xs uppercase tracking-widest text-gray-400">
      {label}
    </span>
    <span className="mt-2 text-2xl font-semibold">#{tokenId.toString()}</span>
  </button>
);

import { SelectableToken } from "./SelectableToken";

export const SelectableGrid = ({
  tokenIds,
  selectedTokenIds,
  onTokenSelected,
  onTokenUnselected,
}: {
  tokenIds: bigint[];
  selectedTokenIds: bigint[];
  onTokenSelected: (tokenId: bigint) => void;
  onTokenUnselected: (tokenId: bigint) => void;
}) => {
  return (
    <div className="flex flex-wrap gap-4">
      {tokenIds.map((tokenId) => (
        <SelectableToken
          key={tokenId.toString()}
          tokenId={tokenId}
          onTokenSelected={onTokenSelected}
          onTokenUnselected={onTokenUnselected}
          isSelected={selectedTokenIds.includes(tokenId)}
        />
      ))}
    </div>
  );
};

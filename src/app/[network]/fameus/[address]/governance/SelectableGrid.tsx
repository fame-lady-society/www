import { SelectableToken } from "./SelectableToken";

export const SelectableGrid = ({
  tokenIds,
  lockStatuses,
  guardianAddresses,
  selectedTokenIds,
  onTokenSelected,
  onTokenUnselected,
}: {
  tokenIds: bigint[];
  lockStatuses: boolean[];
  guardianAddresses: (string | null)[];
  selectedTokenIds: bigint[];
  onTokenSelected: (tokenId: bigint) => void;
  onTokenUnselected: (tokenId: bigint) => void;
}) => {
  return (
    <div className="flex flex-wrap gap-4">
      {tokenIds.map((tokenId, index) => (
        <SelectableToken
          key={tokenId.toString()}
          tokenId={tokenId}
          onTokenSelected={onTokenSelected}
          onTokenUnselected={onTokenUnselected}
          isSelected={selectedTokenIds.includes(tokenId)}
          isLocked={lockStatuses[index]}
          guardianAddress={guardianAddresses[index]}
        />
      ))}
    </div>
  );
};

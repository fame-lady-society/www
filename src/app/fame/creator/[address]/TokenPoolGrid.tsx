import { TokenPoolToken } from "./TokenPoolToken";

export const TokenPoolGrid = ({
  tokens,
  selectedTokenId,
  onTokenSelected,
  onTokenUnselected,
  poolType,
}: {
  tokens: Array<{ tokenId: number; uri: string }>;
  selectedTokenId: bigint | null;
  onTokenSelected: (tokenId: bigint) => void;
  onTokenUnselected: () => void;
  poolType: "burn" | "mint";
}) => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
      {tokens.map(({ tokenId, uri }) => (
        <TokenPoolToken
          key={tokenId}
          tokenId={BigInt(tokenId)}
          uri={uri}
          poolType={poolType}
          onTokenSelected={onTokenSelected}
          onTokenUnselected={onTokenUnselected}
          isSelected={selectedTokenId === BigInt(tokenId)}
        />
      ))}
    </div>
  );
};

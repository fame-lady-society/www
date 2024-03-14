import { FC } from "react";
import { SepoliaSelectWrap } from "./SepoliaSelectWrap";
import { MainnetSelectWrap } from "./MainnetSelectWrap";
import { useAccount } from "wagmi";

export const WrapCard: FC<{ minTokenId: number; maxTokenId: number }> = ({
  minTokenId,
  maxTokenId,
}) => {
  const { chain: currentChain } = useAccount();
  return (() => {
    switch (currentChain?.id) {
      case 11155111:
        return (
          <SepoliaSelectWrap minTokenId={minTokenId} maxTokenId={maxTokenId} />
        );
      case 1:
        return (
          <MainnetSelectWrap minTokenId={minTokenId} maxTokenId={maxTokenId} />
        );
      default:
        return null;
    }
  })();
};

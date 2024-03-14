import { FC } from "react";
import { SepoliaSelectWrap } from "./SepoliaSelectWrap";
import { MainnetSelectWrap } from "./MainnetSelectWrap";
import { useChainId } from "wagmi";

export const BetaWrapCard: FC<{ minTokenId: number; maxTokenId: number }> = ({
  minTokenId,
  maxTokenId,
}) => {
  const chainId = useChainId();
  return (() => {
    switch (chainId) {
      case 11155111:
        return (
          <SepoliaSelectWrap  />
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

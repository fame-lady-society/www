import { FC } from "react";
import { SepoliaTurboWrap } from "./SepoliaTurboWrap";
import { MainnetTurboWrap } from "./MainnetTurboWrap";
import { useChainId } from "wagmi";

export const BetaTurboWrap: FC<{}> = () => {
  const chainId = useChainId();
  return (() => {
    switch (chainId) {
      case 11155111:
        return <SepoliaTurboWrap />;
      case 1:
        return <MainnetTurboWrap />;
      default:
        return null;
    }
  })();
};

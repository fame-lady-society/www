import { FC } from "react";
import { SepoliaTurboWrap } from "./SepoliaTurboWrap";
import { MainnetTurboWrap } from "./MainnetTurboWrap";
import { useAccount } from "wagmi";

export const TurboWrap: FC<{}> = () => {
  const { chain: currentChain } = useAccount();
  return (() => {
    switch (currentChain?.id) {
      case 11155111:
        return <SepoliaTurboWrap />;
      case 1:
        return <MainnetTurboWrap />;
      default:
        return null;
    }
  })();
};

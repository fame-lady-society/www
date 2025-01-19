import { FC } from "react";
import { useTotalSupply } from "./useTotalSupply";
import { polygonAmoy } from "viem/chains";

export const MintAvailable: FC<{ chainId: typeof polygonAmoy.id }> = ({
  chainId,
}) => {
  const { data: totalSupply } = useTotalSupply(chainId);
  return (
    typeof totalSupply === "bigint" && (
      <p>{(69n - totalSupply).toString()} / 69 available</p>
    )
  );
};

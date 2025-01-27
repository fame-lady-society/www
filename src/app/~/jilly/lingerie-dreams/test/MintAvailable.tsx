import { FC } from "react";
import { formatUnits } from "viem";
import { useTotalSupply } from "./useTotalSupply";
import { polygonAmoy } from "viem/chains";
import { useMintPrice } from "./useMintPrice";

export const MintAvailable: FC<{ chainId: typeof polygonAmoy.id }> = ({
  chainId,
}) => {
  const { data: totalSupply } = useTotalSupply(chainId);
  const { data: mintPrice } = useMintPrice(chainId);

  return (
    <>
      {typeof totalSupply === "bigint" && (
        <p>{(69n - totalSupply).toString()} / 69 available</p>
      )}
      {typeof mintPrice === "bigint" && (
        <p className="mb-4">Mint price: {formatUnits(mintPrice, 18)} MATIC</p>
      )}
    </>
  );
};

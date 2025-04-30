import { FC } from "react";
import { formatUnits } from "viem";
import { useTotalSupply } from "./hooks/useTotalSupply";
import { polygon, polygonAmoy } from "viem/chains";
import { useMintPrice } from "./hooks/useMintPrice";

export const MintAvailable: FC<{
  chainId: typeof polygonAmoy.id | typeof polygon.id;
}> = ({ chainId }) => {
  const { data: totalSupply, isLoading: isLoadingTotalSupply } =
    useTotalSupply(chainId);
  const {
    data: { bronzePrice, silverPrice, goldPrice } = {},
    isLoading: isLoadingPrices,
  } = useMintPrice(chainId);

  return (
    <>
      {isLoadingTotalSupply || isLoadingPrices ? (
        <>
          <p className="animate-pulse bg-gray-200 h-6 w-48 rounded mb-2"></p>
          <p className="animate-pulse bg-gray-200 h-6 w-64 rounded mb-4"></p>
          <p className="animate-pulse bg-gray-200 h-6 w-64 rounded mb-4"></p>
          <p className="animate-pulse bg-gray-200 h-6 w-64 rounded mb-4"></p>
        </>
      ) : (
        <>
          {typeof totalSupply === "bigint" && (
            <p>{(69n - totalSupply).toString()} / 69 available</p>
          )}
          {typeof bronzePrice === "bigint" && (
            <p className="mb-4">
              Mint price: {formatUnits(bronzePrice, 18)} ETH
            </p>
          )}
          {typeof silverPrice === "bigint" && (
            <p className="mb-4">
              Mint price: {formatUnits(silverPrice, 18)} ETH
            </p>
          )}
          {typeof goldPrice === "bigint" && (
            <p className="mb-4">Mint price: {formatUnits(goldPrice, 18)} ETH</p>
          )}
        </>
      )}
    </>
  );
};

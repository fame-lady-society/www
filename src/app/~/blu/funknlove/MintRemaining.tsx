"use client";
import { FC } from "react";
import { formatUnits } from "viem";
import { useTotalSupply } from "./hooks/useTotalSupply";
import { sepolia, mainnet } from "viem/chains";
import { useMintPrice } from "./hooks/useMintPrice";
import { useBalance } from "wagmi";
import { funknloveAddressForChain } from "./contracts";

export const MintAvailable: FC<{
  chainId: typeof sepolia.id | typeof mainnet.id;
}> = ({ chainId }) => {
  const {
    data: { bronzeSupply, silverSupply, goldSupply } = {
      bronzeSupply: 0n,
      silverSupply: 0n,
      goldSupply: 0n,
    },
    isLoading: isLoadingTotalSupply,
  } = useTotalSupply(chainId);
  const {
    bronzePrice,
    silverPrice,
    goldPrice,
    isLoading: isLoadingPrices,
  } = useMintPrice(chainId);
  const { data: balance } = useBalance({
    address: funknloveAddressForChain(chainId),
    chainId,
  });
  return (
    <>
      {isLoadingTotalSupply || isLoadingPrices ? (
        <>
          <p className="animate-pulse bg-gray-200 h-6 w-64 rounded mb-4"></p>
          <p className="animate-pulse bg-gray-200 h-6 w-64 rounded mb-4"></p>
          <p className="animate-pulse bg-gray-200 h-6 w-64 rounded mb-4"></p>
          <p className="animate-pulse bg-gray-200 h-6 w-64 rounded mb-4"></p>
        </>
      ) : (
        <>
          {typeof balance?.value === "bigint" && (
            <p className="mb-4">
              <span className="font-bold">Total raised:</span>{" "}
              {formatUnits(balance.value, 18)} ETH
            </p>
          )}
          {typeof bronzePrice === "bigint" &&
            typeof bronzeSupply === "bigint" && (
              <span className="mb-4 flex flex-row justify-between w-full">
                <p className="">
                  <span className="font-bold">Minted:</span>{" "}
                  {bronzeSupply.toString()}
                </p>
                <p className="">{formatUnits(bronzePrice, 18)} ETH</p>
              </span>
            )}
          {typeof silverPrice === "bigint" &&
            typeof silverSupply === "bigint" && (
              <span className="mb-4 flex flex-row justify-between w-full">
                <p className="">
                  <span className="font-bold">Minted:</span>{" "}
                  {silverSupply.toString()}
                </p>
                <p className="">{formatUnits(silverPrice, 18)} ETH</p>
              </span>
            )}
          {typeof goldPrice === "bigint" && typeof goldSupply === "bigint" && (
            <span className="mb-4 flex flex-row justify-between w-full">
              <p className="">
                <span className="font-bold">Minted:</span>{" "}
                {goldSupply.toString()}
              </p>
              <p className="">{formatUnits(goldPrice, 18)} ETH</p>
            </span>
          )}
        </>
      )}
    </>
  );
};

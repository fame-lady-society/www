"use client";
import { FC } from "react";
import { formatUnits } from "viem";
import { useTotalSupply } from "./hooks/useTotalSupply";
import { sepolia, mainnet } from "viem/chains";
import { useMintPrice } from "./hooks/useMintPrice";
import { useBalance } from "wagmi";
import { funknloveAddressForChain } from "./contracts";
import NextImage from "next/image";
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
              <span className="mb-4 flex flex-row items-start w-full">
                <NextImage
                  src="/~/blu/funknlove/bronzefnl.png"
                  alt="Bronze"
                  width={48}
                  height={48}
                />
                <p className="ml-4">
                  <span className="font-bold">Bronze minted:</span>{" "}
                  {bronzeSupply.toString()}
                </p>
                <div className="flex-grow" />
                <p className="">{formatUnits(bronzePrice, 18)} ETH</p>
              </span>
            )}
          {typeof silverPrice === "bigint" &&
            typeof silverSupply === "bigint" && (
              <span className="mb-4 flex flex-row items-start w-full">
                <NextImage
                  src="/~/blu/funknlove/silverfnl.png"
                  alt="Silver"
                  width={48}
                  height={48}
                />
                <p className="ml-4">
                  <span className="font-bold">Silver minted:</span>{" "}
                  {silverSupply.toString()}
                </p>
                <div className="flex-grow" />
                <p className="">{formatUnits(silverPrice, 18)} ETH</p>
              </span>
            )}
          {typeof goldPrice === "bigint" && typeof goldSupply === "bigint" && (
            <span className="mb-4 flex flex-row items-start w-full">
              <NextImage
                src="/~/blu/funknlove/goldfnl.png"
                alt="Gold"
                width={48}
                height={48}
              />
              <p className="ml-4">
                <span className="font-bold">Gold minted:</span>{" "}
                {goldSupply.toString()}
              </p>
              <div className="flex-grow" />
              <p className="">{formatUnits(goldPrice, 18)} ETH</p>
            </span>
          )}
        </>
      )}
    </>
  );
};

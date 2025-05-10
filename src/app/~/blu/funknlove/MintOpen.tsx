"use client";

import { FC, useEffect, useMemo, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { CountDown } from "@/components/CountDown";
import { MintAvailable } from "./MintRemaining";
import { sepolia, mainnet } from "viem/chains";
import { Mint } from "./Mint";
import {
  useReadFunknloveGetEndTime,
  useReadFunknloveGetStartTime,
} from "@/wagmi";
import { funknloveAddressForChain } from "./contracts";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";

export const MintOpen: FC<{
  chainId: typeof sepolia.id | typeof mainnet.id;
}> = ({ chainId }) => {
  const { data: startTime, isLoading: isLoadingStartTime } =
    useReadFunknloveGetStartTime({
      address: funknloveAddressForChain(chainId),
      chainId,
    });
  const { data: endTime, isLoading: isLoadingEndTime } =
    useReadFunknloveGetEndTime({
      address: funknloveAddressForChain(chainId),
      chainId,
    });

  const [lastChecked, setLastChecked] = useState(new Date().getTime());
  useEffect(() => {
    const interval = setInterval(() => {
      setLastChecked(new Date().getTime());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const startDateTime = useMemo(() => {
    if (!startTime) return null;
    return new Date(Number(startTime) * 1000);
  }, [startTime]);
  const notYet = startDateTime && startDateTime.getTime() > lastChecked;

  return (
    <>
      {isLoadingStartTime ? (
        <div className="flex justify-center items-center">
          <CircularProgress />
        </div>
      ) : (
        <>
          {(() => {
            const now = lastChecked;
            const start = startDateTime?.getTime() || 0;
            const end = endTime ? Number(endTime) * 1000 : 0;

            if (now < start) {
              return (
                <>
                  <p className="text-lg mb-4">Mint opens in:</p>
                  <CountDown endDate={startDateTime!} />
                  <div className="h-24" />
                </>
              );
            } else if (now >= start && now <= end) {
              return (
                <>
                  <p className="text-lg mb-4">Mint closes in:</p>
                  <CountDown endDate={new Date(end)} />
                  <div className="h-12" />
                  <MintAvailable chainId={chainId} />
                  <Mint chainId={chainId} />
                  <div className="h-24" />
                </>
              );
            } else {
              return (
                <>
                  <p className="text-lg mb-4">Mint has ended</p>
                  <div className="h-24" />
                  {typeof balance?.value === "bigint" && (
                    <p className="mb-4">
                      <span className=" text-xl font-bold">Total raised:</span>{" "}
                      1.17177 ETH ETH
                    </p>
                  )}
                </>
              );
            }
          })()}
        </>
      )}
    </>
  );
};

"use client";

import { FC, useEffect, useMemo, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { CountDown } from "@/components/CountDown";
import { MintAvailable } from "./MintRemaining";
import { sepolia, mainnet } from "viem/chains";
import { Mint } from "./Mint";
import { useReadFunknloveGetStartTime } from "@/wagmi";
import { funknloveAddressForChain } from "./contracts";

export const MintOpen: FC<{
  chainId: typeof sepolia.id | typeof mainnet.id;
}> = ({ chainId }) => {
  const { data: startTime, isLoading: isLoadingStartTime } =
    useReadFunknloveGetStartTime({
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
          {notYet && startDateTime ? (
            <>
              <p className="text-lg mb-4">Mint opens in:</p>
              <CountDown endDate={startDateTime} />
              <div className="h-24" />
            </>
          ) : (
            <>
              <MintAvailable chainId={chainId} />
              <Mint chainId={chainId} />
              <div className="h-24" />
            </>
          )}
        </>
      )}
    </>
  );
};

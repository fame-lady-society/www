"use client";

import { FC, useEffect, useMemo, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { useIsMintOpen } from "./hooks/useIsMintOpen";
import { CountDown } from "@/components/CountDown";
import { MintAvailable } from "./MintRemaining";
import { polygon, polygonAmoy } from "viem/chains";
import { Mint } from "./Mint";

export const MintOpen: FC<{
  chainId: typeof polygonAmoy.id | typeof polygon.id;
}> = ({ chainId }) => {
  const { data: startTime, isLoading: isLoadingStartTime } =
    useIsMintOpen(chainId);
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
        <div className="flex justify-center items-center h-screen">
          <CircularProgress />
        </div>
      ) : (
        <>
          {notYet && startDateTime ? (
            <>
              <p className="text-lg mb-4">Mint opens in:</p>
              <CountDown endDate={startDateTime} />
            </>
          ) : (
            <>
              <MintAvailable chainId={chainId} />
              <Mint chainId={chainId} />
            </>
          )}
        </>
      )}
    </>
  );
};

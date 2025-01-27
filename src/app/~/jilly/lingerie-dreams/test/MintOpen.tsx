"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useIsMintOpen } from "./useIsMintOpen";
import { CountDown } from "@/components/CountDown";
import { MintAvailable } from "./MintAvailable";
import { polygonAmoy } from "viem/chains";
import { Mint } from "./Mint";

export const MintOpen: FC<{ chainId: typeof polygonAmoy.id }> = ({
  chainId,
}) => {
  const { data: startTime } = useIsMintOpen(chainId);
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
  );
};

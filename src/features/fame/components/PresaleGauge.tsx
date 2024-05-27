import React, { FC } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import { ContributionGauge } from "./ContributionGauge";
import { useChainId, useReadContracts } from "wagmi";
import { fameSaleAbi } from "@/wagmi";
import { formatEther } from "viem";
import { fameSaleAddress } from "../contract";

export const PresaleGauge: FC<{}> = () => {
  const chainId = useChainId() as 11155111 | 8453;
  const { data: [totalSupply, maxRaise] = [] } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "fameTotalSupply",
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "maxRaise",
      },
    ],
  });

  const totalContributed = totalSupply ? Number(formatEther(totalSupply)) : 0;
  const max = maxRaise ? Number(formatEther(maxRaise)) : 6;

  return (
    <Card>
      <CardHeader title="Presale progress" />
      <CardContent>
        <ContributionGauge
          value={totalContributed}
          step={0.5}
          min={0}
          max={max}
          formatStepLabel={(value) => `${value} E`}
        />
      </CardContent>
    </Card>
  );
};

import React, { FC } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import { ContributionGauge } from "./ContributionGauge";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import {
  fameSaleAbi,
  fameSaleAddress,
  fameSaleTokenAbi,
  fameSaleTokenAddress,
} from "@/wagmi";
import { formatEther } from "viem";

export const PersonalGauge: FC<{}> = () => {
  const chainId = useChainId();
  const { address } = useAccount();
  const { data: [balance, maxBuy] = [] } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        abi: fameSaleTokenAbi,
        address: fameSaleTokenAddress[chainId],
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress[chainId],
        functionName: "maxBuy",
      },
    ],
  });

  const totalContributed = balance ? Number(formatEther(balance)) : 0;
  const max = maxBuy ? Number(formatEther(maxBuy)) : 0;

  return (
    <Card>
      <CardHeader title="Your contribution" />
      <CardContent>
        <ContributionGauge
          value={totalContributed}
          step={0.01}
          min={0}
          max={max}
          formatStepLabel={(value) => `${value} E`}
        />
      </CardContent>
    </Card>
  );
};

import React, { FC } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useReadContracts, useChainId, useAccount } from "wagmi";
import { fameSaleAbi, fameSaleTokenAbi } from "@/wagmi";
import { useProof } from "../hooks/useProof";
import { fameSaleAddress, fameSaleTokenAddress } from "../contract";

export const AllowedCard: FC<{}> = () => {
  const chainId = useChainId() as 11155111 | 8453;
  const { address } = useAccount();
  const { proof } = useProof();
  const {
    data: [allowed, paused, remaining, balance, maxBuy] = [],
    isSuccess,
    isError,
    error,
  } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "canProve",
        args: proof && address ? [proof, address] : undefined,
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "isPaused",
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "raiseRemaining",
      },
      {
        abi: fameSaleTokenAbi,
        address: fameSaleTokenAddress(chainId),
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "maxBuy",
      },
    ],
  });

  const { data } = useReadContracts({
    contracts: [
      {
        chainId,
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "canProve",
        args: proof && address ? [proof, address] : undefined,
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "isPaused",
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "raiseRemaining",
      },
      {
        abi: fameSaleTokenAbi,
        address: fameSaleTokenAddress(chainId),
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "maxBuy",
      },
    ],
  });

  return (
    <Card>
      <CardHeader title="Presale status" />
      <CardContent>
        {isSuccess && (
          <>
            {typeof balance !== "undefined" &&
              typeof maxBuy !== "undefined" &&
              balance < maxBuy && (
                <Typography variant="body1">
                  {allowed
                    ? "You are allowed to participate in the presale."
                    : "Your address is not allowed to participate in the presale."}
                </Typography>
              )}

            {typeof balance !== "undefined" &&
              typeof maxBuy !== "undefined" &&
              balance >= maxBuy && (
                <Typography variant="body1">
                  You have already contributed the maximum amount.
                </Typography>
              )}
            {typeof remaining !== "undefined" && remaining > 0n && (
              <Typography variant="body1">
                {paused
                  ? "The presale is paused."
                  : "The presale is currently running."}
              </Typography>
            )}
            {typeof remaining !== "undefined" && remaining === 0n && (
              <Typography variant="body1">The presale is full.</Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

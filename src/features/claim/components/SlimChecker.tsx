import { FC, useState } from "react";
import Card, { CardProps } from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { formatUnits, isAddress } from "viem";
import { useAllocation } from "../hooks/useAllocation";
import { useAccount, useEnsAddress } from "wagmi";

function formatUnit(amount: bigint) {
  return Math.floor(Number(formatUnits(amount, 18)));
}

const NotConnected: FC = () => {
  return (
    <>
      <CardHeader title="Token Claim Simulator" />
      <CardContent>
        <Typography variant="body1">
          Please connect your wallet to simulate token claims.
        </Typography>
      </CardContent>
    </>
  );
};

export const SlimChecker: FC<
  {
    ageBoost: number;
    rankBoost: number;
  } & CardProps
> = ({ ageBoost, rankBoost, ...cardProps }) => {
  const { address } = useAccount();

  const { fls, hunnys, mermaids, metavixens, squad, total } = useAllocation({
    address,
    rankBoost,
    ageBoost,
  });

  return (
    <Card {...cardProps}>
      {!address ? (
        <NotConnected />
      ) : (
        <>
          <CardHeader title="Token Claim Simulator" />
          <CardContent>
            <Typography variant="body1" marginY={2}>
              Rank Boost
            </Typography>

            <Typography variant="body1">
              Fame Lady Society: {formatUnit(fls).toLocaleString()}
            </Typography>
            <Typography variant="body1">
              Fame Lady Squad (if wrapped): {formatUnit(squad).toLocaleString()}
            </Typography>
            <Typography variant="body1">
              Hunnys: {formatUnit(hunnys).toLocaleString()}
            </Typography>
            <Typography variant="body1">
              Mermaids: {formatUnit(mermaids).toLocaleString()}
            </Typography>
            <Typography variant="body1">
              Metavixens: {formatUnit(metavixens).toLocaleString()}
            </Typography>
            <Typography variant="body1">
              Total $FAME: {formatUnit(total).toLocaleString()}
            </Typography>
            <Typography variant="body1">
              Total $FAME NFTs: {Math.floor(formatUnit(total) / 1_000_000)}
            </Typography>
          </CardContent>
        </>
      )}
    </Card>
  );
};

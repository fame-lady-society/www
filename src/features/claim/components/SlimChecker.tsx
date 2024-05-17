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

export const SlimChecker: FC<
  {
    ageBoost: number;
    rankBoost: number;
  } & CardProps
> = ({ ageBoost, rankBoost, ...cardProps }) => {
  const { address: wagmiAddress } = useAccount();
  const [address, setAddress] = useState("");
  const { data: ensAddress } = useEnsAddress({
    name: address,
  });

  const addressToUse = ensAddress || address;

  const { fls, hunnys, mermaids, metavixens } = useAllocation({
    address: isAddress(addressToUse) ? addressToUse : undefined,
    rankBoost,
    ageBoost,
  });

  return (
    <Card {...cardProps}>
      <CardHeader title="Token Claim Simulator" />
      <CardContent>
        <TextField
          label="Address"
          value={address || wagmiAddress}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
        />
        <Typography variant="body1" marginY={2}>
          Rank Boost
        </Typography>

        <Typography variant="body1">Address: {ensAddress}</Typography>
        <Typography variant="body1">
          FLS: {formatUnit(fls).toLocaleString()}
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
          Total $FAME:{" "}
          {formatUnit(fls + hunnys + mermaids + metavixens).toLocaleString()}
        </Typography>
        <Typography variant="body1">
          Total $FAME NFTs:{" "}
          {Math.floor(
            formatUnit(fls + hunnys + mermaids + metavixens) / 1_000_000,
          )}
        </Typography>
      </CardContent>
    </Card>
  );
};

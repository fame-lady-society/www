import React, { FC } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useWriteFameVestingRelease } from "@/wagmi";
import { fameVestingFromNetwork } from "./contracts";
import { formatFame } from "@/utils/fame";
import { useReleasableAmount } from "./hooks/useReleasableAmount";
import { useChainId } from "wagmi";
import { base } from "viem/chains";

export const ClaimCard: FC<{}> = ({}) => {
  const { isLoading, releasableAmount, vestingScheduleId } =
    useReleasableAmount();
  const { writeContract } = useWriteFameVestingRelease();
  return (
    <Card sx={{ p: 2 }}>
      <CardHeader title="claim your $FAME" />
      <CardContent>
        {isLoading ? (
          <Typography variant="body2" color="textSecondary" component="p">
            you have {<CircularProgress size="small" />} tokens to claim
          </Typography>
        ) : (
          <Typography variant="body2" color="textSecondary" component="p">
            you have {formatFame(releasableAmount ?? 0n)} tokens to claim
          </Typography>
        )}
      </CardContent>
      <CardActionArea>
        <Button
          onClick={() => {
            const address = fameVestingFromNetwork(base.id);
            if (vestingScheduleId && releasableAmount && address) {
              writeContract({
                chainId: base.id,
                address,
                args: [vestingScheduleId, releasableAmount],
              });
            }
          }}
        >
          Claim
        </Button>
      </CardActionArea>
    </Card>
  );
};

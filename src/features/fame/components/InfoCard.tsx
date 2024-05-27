import React, { FC } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { WrappedLink } from "@/components/WrappedLink";

export const InfoCard: FC<{}> = () => {
  return (
    <Card>
      <CardHeader title="Important info" />
      <CardContent sx={{ my: 1 }}>
        <Typography variant="h5" sx={{ mb: 1 }} width="100%">
          No expectation of profit
        </Typography>
        <Typography variant="body1" width="100%">
          Presale participants agree that they are purchasing locked and vested
          tokens for the purpose of seeding liquidity for the $FAME token. There
          is no expectation of profit and no guarantee of any return.
        </Typography>
        <Typography variant="h5" sx={{ my: 1 }} width="100%">
          No ETA for $FAME launch
        </Typography>
        <Typography variant="body1" width="100%">
          Funds contributed to the presale will be used to seed liquidity for
          the launch of $FAME. There is no ETA for the launch of $FAME. The{" "}
          <WrappedLink href="https://app.safe.global/home?safe=base:0xafC3194EE6139fadD53ED20571F2C78a7e47Cb93">
            2 of 3 multisig
          </WrappedLink>{" "}
          is responsible for the launch of $FAME or refund of presale funds.
        </Typography>
        <Typography variant="h5" sx={{ my: 1 }} width="100%">
          Funds are locked
        </Typography>
        <Typography variant="body1" width="100%">
          Presale deposits are non-refundable except by action of a{" "}
          <WrappedLink href="https://app.safe.global/home?safe=base:0xafC3194EE6139fadD53ED20571F2C78a7e47Cb93">
            2 of 3 multisig
          </WrappedLink>
          . After the launch of $FAME, purchased $FAME tokens will be locked
          with a 2 week 10% cliff and 90 day linear vesting period.
        </Typography>
      </CardContent>
    </Card>
  );
};

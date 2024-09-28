"use client";
import {
  FC,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
  MouseEventHandler,
  ReactNode,
} from "react";
import { Box, Toolbar } from "@mui/material";

import Button from "@mui/material/Button";
import { AppBar } from "@/features/appbar/components/appBar";
import Typography from "@mui/material/Typography";
import { useReleasableAmount } from "@/features/claim/hooks/useReleasableAmount";
import { ClaimModal } from "@/features/claim/ClaimModal";

export const Main: FC<
  PropsWithChildren<{
    menu?: ReactNode;
    title?: ReactNode;
    right?: ReactNode;
    disableConnect?: boolean;
  }>
> = ({ children, disableConnect, menu, title, right }) => {
  const { releasableAmount } = useReleasableAmount();
  const [claimFameOpen, setClaimFameOpen] = useState(false);
  return (
    <>
      <ClaimModal
        open={claimFameOpen}
        onClose={() => setClaimFameOpen(false)}
      />
      <Box
        component="main"
        sx={{
          backgroundColor: "background.default",
        }}
      >
        <AppBar
          menu={menu}
          title={
            <>
              {title}
              {releasableAmount! > 0n && (
                <Button
                  onClick={() => setClaimFameOpen(true)}
                  variant="outlined"
                  sx={{ ml: 2 }}
                >
                  <Typography variant="h5" component="h1">
                    Claim $FAME
                  </Typography>
                </Button>
              )}
            </>
          }
          right={right}
          disableConnect={disableConnect}
        />
        {children}
      </Box>
    </>
  );
};

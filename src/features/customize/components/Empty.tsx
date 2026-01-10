"use client";
import React, { FC } from "react";
import { WrappedLink } from "@/components/WrappedLink";
import { OpenSeaIcon } from "@/components/icons/opensea";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid2 from "@mui/material/Unstable_Grid2";
import { useAccount } from "@/hooks/useAccount";
import { ConnectKitButton, useSIWE } from "connectkit";

const NotConnected: FC<{}> = () => {
  return (
    <ConnectKitButton.Custom>
      {({ show }) => {
        return (
          <button
            className="rounded-lg border border-gray-200 p-4 text-center mx-auto block"
            onClick={show}
          >
            Connect your wallet to see your Fame Ladies
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};

const NotSignedIn: FC<{}> = () => {
  const { signIn } = useAccount();
  return (
    <button
      className="rounded-lg border border-gray-200 p-4 text-center mx-auto block"
      onClick={() => signIn()}
    >
      Sign in with Ethereum
    </button>
  );
};

export const Empty: FC<{}> = ({}) => {
  const { isSignedIn, isConnected } = useAccount();
  return (
    <Grid2 xs={12} sx={{ mt: 16 }}>
      <Box
        component="div"
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        my={2}
        gap={2}
      >
        {!isConnected && <NotConnected />}
        {!isSignedIn && <NotSignedIn />}
        <WrappedLink href="https://opensea.io/collection/fameladysociety">
          <Box
            component="div"
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <OpenSeaIcon />
            <Typography component="span" color="white">
              Go get a Fame Lady using the{" "}
              <WrappedLink href="/save-a-lady">save a lady</WrappedLink> tool
            </Typography>
          </Box>
        </WrappedLink>
        <Box
          component="div"
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          gap={2}
        >
          <Typography component="span" color="white">
            Have a Fame Lady?
          </Typography>
          <WrappedLink href="/wrap">
            <Typography component="span" color="white">
              Wrap it
            </Typography>
          </WrappedLink>
        </Box>
      </Box>
    </Grid2>
  );
};

import React, { FC } from "react";
import Container from "@mui/material/Container";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useSwitchChain } from "wagmi";
import { useAccount } from "@/hooks/useAccount";

export const UnsupportedNetwork: FC = () => {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const onClick = () => {
    switchChain({
      chainId: 1,
    });
  };
  return (
    <Container>
      <Grid2 container justifyContent="center" spacing={2} sx={{ mt: 16 }}>
        <Grid2>
          <Typography variant="h4" component="h1" gutterBottom>
            Unsupported Network
          </Typography>
          <Typography variant="body1" gutterBottom>
            You are currently on the {chain?.name} network. Please switch to a
            supported network to use this feature.
          </Typography>
          <Button
            variant="contained"
            onClick={onClick}
            sx={{
              backgroundColor: "#ff6b9d !important",
              color: "#fff !important",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#ff8cb5 !important",
              },
            }}
          >
            Switch to Mainnet
          </Button>
        </Grid2>
      </Grid2>
    </Container>
  );
};

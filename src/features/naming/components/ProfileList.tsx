"use client";

import { type FC } from "react";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Link from "next/link";
import { useAllIdentities } from "../hooks/useAllIdentities";
import { useAccount } from "@/hooks/useAccount";
import { ProfileCard } from "./ProfileCard";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";

export interface ProfileListProps {
  network: NetworkType;
}

export const ProfileList: FC<ProfileListProps> = ({ network }) => {
  const { identities, isLoading, totalCount } = useAllIdentities(network);
  const { address, isConnected } = useAccount();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Fame Lady Names
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {totalCount > 0
              ? `${identities.length} registered identities`
              : "No identities registered yet"}
          </Typography>
        </Box>

        {isConnected && (
          <Button
            component={Link}
            href={`/${network}/naming/claim`}
            variant="contained"
            size="large"
            sx={{
              background:
                "linear-gradient(135deg, #ff6b9d 0%, #c44dff 50%, #6b5bff 100%)",
              color: "white",
              fontWeight: 600,
              px: 4,
              "&:hover": {
                background:
                  "linear-gradient(135deg, #ff5a8f 0%, #b33df0 50%, #5a4af0 100%)",
              },
            }}
          >
            Claim Your Name
          </Button>
        )}

        {!isConnected && (
          <Alert severity="info" sx={{ maxWidth: 400 }}>
            Connect your wallet to claim a name and manage your identity.
          </Alert>
        )}
      </Box>

      {/* Empty state */}
      {identities.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 4,
            borderRadius: 2,
            backgroundColor: "rgba(0,0,0,0.02)",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No identities yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Be the first to claim a name and establish your Fame Lady identity!
          </Typography>
          {isConnected && (
            <Button
              component={Link}
              href={`/${network}/naming/claim`}
              variant="outlined"
            >
              Claim the first name
            </Button>
          )}
        </Box>
      )}

      {/* Identity grid */}
      {identities.length > 0 && (
        <Grid2 container spacing={3}>
          {identities.map((identity) => (
            <Grid2 xs={12} sm={6} md={4} lg={3} key={identity.tokenId.toString()}>
              <ProfileCard identity={identity} network={network} />
            </Grid2>
          ))}
        </Grid2>
      )}
    </Box>
  );
};

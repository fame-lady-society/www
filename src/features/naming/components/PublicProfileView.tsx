"use client";

import { type FC } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Link from "next/link";
import EditIcon from "@mui/icons-material/Edit";
import { useIdentity } from "../hooks/useIdentity";
import { useIdentityPermissions } from "../hooks/useIdentityPermissions";
import { useAccount } from "@/hooks/useAccount";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import { encodeIdentifier } from "../utils/networkUtils";
import { PrimaryAddressSelector } from "./PrimaryAddressSelector";

export interface PublicProfileViewProps {
  network: NetworkType;
  identifier: string;
}

export const PublicProfileView: FC<PublicProfileViewProps> = ({
  network,
  identifier,
}) => {
  const { identity, isLoading, notFound } = useIdentity(network, identifier);
  const permissions = useIdentityPermissions(identity);
  const { isConnected } = useAccount();

  if (isLoading) {
    return (
      <Box
        component="div"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !identity) {
    return (
      <Box component="div" sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h5" gutterBottom>
          Identity not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          The identity &ldquo;{identifier}&rdquo; does not exist.
        </Typography>
        <Button component={Link} href={`/${network}/naming`} variant="outlined">
          Back to all identities
        </Button>
      </Box>
    );
  }

  const editUrl = `/${network}/~/edit/${encodeIdentifier(identity.name)}`;

  return (
    <Box component="div" sx={{ maxWidth: 800, mx: "auto" }}>
      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            component="div"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box component="div">
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                {identity.name}
              </Typography>
            </Box>

            <Box component="div" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {permissions.isPrimary && (
                <>
                  <Chip label="You are Primary" color="primary" />
                  <Button
                    component={Link}
                    href={editUrl}
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                  >
                    Edit
                  </Button>
                </>
              )}
              {permissions.isVerifiedNotPrimary && (
                <Chip label="You are Verified" color="success" variant="outlined" />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Basic Info */}
          <Box component="div" sx={{ display: "grid", gap: 2 }}>
            <Box component="div">
              <Typography variant="caption" color="text.secondary">
                Primary Address
              </Typography>
              <Typography
                variant="body1"
                component="div"
                sx={{
                  fontFamily: "monospace",
                  backgroundColor: "rgba(0,0,0,0.05)",
                  p: 1,
                  borderRadius: 1,
                  wordBreak: "break-all",
                }}
              >
                {identity.primaryAddress}
              </Typography>
            </Box>

            <Box component="div">
              <Typography variant="caption" color="text.secondary">
                Bound Gate NFT
              </Typography>
              <Typography variant="body1">
                Token #{identity.primaryTokenId.toString()}
              </Typography>
            </Box>

            {identity.description && (
              <Box component="div">
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">{identity.description}</Typography>
              </Box>
            )}

            {identity.website && (
              <Box component="div">
                <Typography variant="caption" color="text.secondary">
                  Website
                </Typography>
                <Typography
                  variant="body1"
                  component="a"
                  href={
                    identity.website.startsWith("http")
                      ? identity.website
                      : `https://${identity.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "primary.main", textDecoration: "none" }}
                >
                  {identity.website}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Verified Addresses Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Verified Addresses
          </Typography>
          <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {identity.verifiedAddresses.map((addr) => (
              <Box
                component="div"
                key={addr}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1,
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                >
                  {addr}
                </Typography>
                {addr.toLowerCase() === identity.primaryAddress.toLowerCase() && (
                  <Chip label="Primary" size="small" color="primary" />
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Not connected message */}
      {!isConnected && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Connect your wallet to see if you can manage this identity.
        </Alert>
      )}
    </Box>
  );
};

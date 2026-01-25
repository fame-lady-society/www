"use client";

import { type FC, useState } from "react";
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
import { useIdentity } from "../hooks/useIdentity";
import { useIdentityPermissions } from "../hooks/useIdentityPermissions";
import { useAccount } from "@/hooks/useAccount";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import { VerifiedAddressManager } from "./VerifiedAddressManager";
import { MetadataEditor } from "./MetadataEditor";
import { PrimaryNftSelector } from "./PrimaryNftSelector";
import { PrimaryAddressSelector } from "./PrimaryAddressSelector";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export interface ProfilePageProps {
  network: NetworkType;
  identifier: string;
}

export const ProfilePage: FC<ProfilePageProps> = ({ network, identifier }) => {
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
          The identity "{identifier}" does not exist.
        </Typography>
        <Button component={Link} href={`/${network}/naming`} variant="outlined">
          Back to all identities
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                {identity.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Chip
                  label={`Token #${identity.tokenId.toString()}`}
                  size="small"
                  variant="outlined"
                />
                <Chip label="Soulbound" size="small" color="secondary" />
              </Box>
            </Box>

            {permissions.isPrimary && (
              <Chip label="You are Primary" color="primary" />
            )}
            {permissions.canRequestPrimary && (
              <Chip label="You are Verified" color="success" variant="outlined" />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Basic Info */}
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Primary Address
              </Typography>
              <Typography
                variant="body1"
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

            <Box>
              <Typography variant="caption" color="text.secondary">
                Bound Gate NFT
              </Typography>
              <Typography variant="body1">
                Token #{identity.primaryTokenId.toString()}
              </Typography>
            </Box>

            {identity.description && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">{identity.description}</Typography>
              </Box>
            )}

            {identity.website && (
              <Box>
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {identity.verifiedAddresses.map((addr) => (
              <Box
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

      {/* Verified user can request primary transfer */}
      {permissions.canRequestPrimary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              You are a verified address for this identity. You can request to
              become the primary address.
            </Alert>
            <PrimaryAddressSelector
              network={network}
              tokenId={identity.tokenId}
              currentPrimary={identity.primaryAddress}
              primaryTokenId={identity.primaryTokenId}
            />
          </CardContent>
        </Card>
      )}

      {/* Primary user management panel */}
      {permissions.canManage && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Metadata Editor */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Edit Profile
              </Typography>
              <MetadataEditor
                network={network}
                tokenId={identity.tokenId}
                currentDescription={identity.description}
                currentWebsite={identity.website}
              />
            </CardContent>
          </Card>

          {/* Verified Address Manager */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Manage Verified Addresses
              </Typography>
              <VerifiedAddressManager
                network={network}
                tokenId={identity.tokenId}
                verifiedAddresses={identity.verifiedAddresses}
                primaryAddress={identity.primaryAddress}
              />
            </CardContent>
          </Card>

          {/* Primary NFT Selector */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Bound NFT
              </Typography>
              <PrimaryNftSelector
                network={network}
                tokenId={identity.tokenId}
                currentPrimaryTokenId={identity.primaryTokenId}
                verifiedAddresses={identity.verifiedAddresses}
              />
            </CardContent>
          </Card>

          {/* Primary Address Transfer */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transfer Primary Role
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Transfer the primary role to another verified address. The new
                primary will have full control over this identity.
              </Typography>
              <PrimaryAddressSelector
                network={network}
                tokenId={identity.tokenId}
                currentPrimary={identity.primaryAddress}
                primaryTokenId={identity.primaryTokenId}
                verifiedAddresses={identity.verifiedAddresses}
                isPrimaryTransfer
              />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Not connected message */}
      {!isConnected && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Connect your wallet to see if you can manage this identity.
        </Alert>
      )}
    </Box>
  );
};

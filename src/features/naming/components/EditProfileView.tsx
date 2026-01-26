"use client";

import { type FC } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "next/link";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import type { FullIdentity } from "../hooks/useIdentity";
import { VerifiedAddressManager } from "./VerifiedAddressManager";
import { MetadataEditor } from "./MetadataEditor";
import { PrimaryNftSelector } from "./PrimaryNftSelector";
import { PrimaryAddressSelector } from "./PrimaryAddressSelector";
import { encodeIdentifier } from "../utils/networkUtils";
import { useAddressVerificationSession } from "../hooks/useAddressVerificationSession";

export interface EditProfileViewProps {
  network: NetworkType;
  identity: FullIdentity;
}

export const EditProfileView: FC<EditProfileViewProps> = ({
  network,
  identity,
}) => {
  const { session, isSessionForCurrentIdentity } = useAddressVerificationSession(
    network,
    identity.name
  );

  const hasIncompleteVerification =
    session !== null &&
    isSessionForCurrentIdentity &&
    session.currentStep !== "complete";

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
              <Box component="div" sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Chip
                  label={`FLS Identity Token #${identity.tokenId.toString()}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Chip label="Editing" color="warning" />
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
          </Box>
        </CardContent>
      </Card>

      {/* Incomplete verification warning */}
      {hasIncompleteVerification && session && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              component={Link}
              href={`/${network}/~/edit/${identity.name}/add-address/${session.currentStep}`}
              size="small"
              color="inherit"
            >
              Resume
            </Button>
          }
        >
          <Typography variant="body2">
            You have an incomplete address verification in progress for{" "}
            <strong>{session.targetAddress}</strong>.
          </Typography>
        </Alert>
      )}

      {/* Management Cards */}
      <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
              identifier={identity.name}
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
              currentPrimaryTokenId={identity.primaryTokenId}
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
              currentPrimary={identity.primaryAddress}
              primaryTokenId={identity.primaryTokenId}
              verifiedAddresses={identity.verifiedAddresses}
              isPrimaryTransfer
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

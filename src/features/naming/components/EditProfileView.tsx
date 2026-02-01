"use client";

import { type FC } from "react";
import Avatar from "@mui/material/Avatar";
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
import { SocialAttestationsEditor } from "./SocialAttestationsEditor";
import { useAddressVerificationSession } from "../hooks/useAddressVerificationSession";
import { SocialCheckmark } from "./SocialCheckmark";

export interface EditProfileViewProps {
  network: NetworkType;
  identity: FullIdentity;
  onRefetchIdentity?: () => Promise<void> | void;
}

const BASE_IMAGE_URL = "https://fame.support/fls/thumb/";

export const EditProfileView: FC<EditProfileViewProps> = ({
  network,
  identity,
  onRefetchIdentity,
}) => {
  const { session, isSessionForCurrentIdentity } = useAddressVerificationSession(
    network,
    identity.name
  );

  const hasIncompleteVerification =
    session !== null &&
    isSessionForCurrentIdentity &&
    session.currentStep !== "complete";

  const verifiedSocial = identity.socialAttestations.filter(
    (attestation) => attestation.verified,
  );
  const socialHandleLabel = (provider: string) =>
    provider === "x" ? "X" : "Discord";

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
              <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                  {identity.name}
                </Typography>
                {verifiedSocial.length > 0 && <SocialCheckmark />}
              </Box>
              <Box component="div" sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Chip
                  label={`FLS Identity Token #${identity.tokenId.toString()}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
              {verifiedSocial.length > 0 && (
                <Box
                  component="div"
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    flexWrap: "wrap",
                    mt: 1,
                  }}
                >
                  {verifiedSocial.map((attestation) => (
                    <Box
                      component="div"
                      key={attestation.provider}
                      sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {socialHandleLabel(attestation.provider)}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {attestation.handle}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
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

            <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar src={`${BASE_IMAGE_URL}${identity.primaryTokenId}`} sx={{ marginRight: 1 }}/>
              <Box component="div">
                <Typography variant="caption" color="text.secondary">
                  My Fame Lady
                </Typography>
                <Typography variant="body1">
                  Token #{identity.primaryTokenId.toString()}
                </Typography>
              </Box>
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
              href={`/${network}/profile/edit/${identity.name}/add-address/${session.currentStep}`}
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

        {/* Social Attestations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Social Accounts
            </Typography>
            <SocialAttestationsEditor
              network={network}
              identity={identity}
              onRefetchIdentity={onRefetchIdentity}
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

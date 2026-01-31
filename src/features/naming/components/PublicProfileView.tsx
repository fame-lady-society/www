"use client";

import { type FC, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Link from "next/link";
import EditIcon from "@mui/icons-material/Edit";
import { useEnsName } from "wagmi";
import type { Address } from "viem";
import { useIdentity } from "../hooks/useIdentity";
import { useIdentityPermissions } from "../hooks/useIdentityPermissions";
import { useAccount } from "@/hooks/useAccount";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import { encodeIdentifier } from "../utils/networkUtils";
import { PrimaryAddressSelector } from "./PrimaryAddressSelector";
import { SocialCheckmark } from "./SocialCheckmark";
import { mainnet } from "viem/chains";

export interface PublicProfileViewProps {
  network: NetworkType;
  identifier: string;
}

interface VerifiedAddressRowProps {
  address: Address;
  isPrimary: boolean;
}

const VerifiedAddressRow: FC<VerifiedAddressRowProps> = ({ address, isPrimary }) => {
  const { data: ensName } = useEnsName({ address, chainId: mainnet.id });
  const [copied, setCopied] = useState(false);
  const resetTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeout.current !== null) {
        window.clearTimeout(resetTimeout.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (resetTimeout.current !== null) {
        window.clearTimeout(resetTimeout.current);
      }
      resetTimeout.current = window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      // Intentionally ignore clipboard errors.
    }
  };

  return (
    <Tooltip title={copied ? "Copied!" : "Click to copy address"}>
      <Box
        component="div"
        onClick={handleCopy}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1,
          backgroundColor: "rgba(0,0,0,0.02)",
          borderRadius: 1,
          cursor: "copy",
        }}
      >
        <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
            {ensName ?? address}
          </Typography>
          {ensName && (
            <Typography
              variant="caption"
              sx={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "text.secondary",
              }}
            >
              {address}
            </Typography>
          )}
        </Box>
        {isPrimary && <Chip label="Primary" size="small" color="primary" />}
      </Box>
    </Tooltip>
  );
};

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

  const verifiedSocial = identity.socialAttestations.filter(
    (attestation) => attestation.verified,
  );


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
                My Fame Lady
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
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    display: "block",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {identity.website}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Verified Addresses Card */}
      {identity.socialAttestations.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Social Accounts
            </Typography>
            <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {identity.socialAttestations.map((attestation) => (
                <Box
                  component="div"
                  key={attestation.provider}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1,
                    backgroundColor: "rgba(0,0,0,0.02)",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2">
                    {attestation.provider === "x" ? "X" : "Discord"}:{" "}
                    <strong>{attestation.handle}</strong>
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Verified Addresses
          </Typography>
          <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {identity.verifiedAddresses.map((address) => (
              <VerifiedAddressRow
                key={address}
                address={address}
                isPrimary={address.toLowerCase() === identity.primaryAddress.toLowerCase()}
              />
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

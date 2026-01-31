"use client";

import { RedirectType, redirect, useRouter } from "next/navigation";
import { EditProfileView } from "@/features/naming/components/EditProfileView";
import { useIdentity } from "@/features/naming/hooks/useIdentity";
import { useIdentityPermissions } from "@/features/naming/hooks/useIdentityPermissions";
import { useAccount } from "@/hooks/useAccount";
import { useAddressVerificationSession } from "@/features/naming/hooks/useAddressVerificationSession";
import {
  resolveNetwork,
  parseIdentifier,
  encodeIdentifier,
} from "@/features/naming/utils/networkUtils";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "next/link";
import { useEffect } from "react";

export default function EditProfilePage({
  params,
}: {
  params: { network: string; identifier: string };
}) {
  const router = useRouter();
  const { network, identifier } = params;
  const resolvedNetwork = resolveNetwork(network);
  const name = parseIdentifier(identifier);
  const { address: connectedAddress, isConnected } = useAccount();

  const { identity, isLoading, notFound, refetchIdentity } = useIdentity(
    resolvedNetwork ?? "base-sepolia",
    name
  );
  const permissions = useIdentityPermissions(identity);
  const { session, isSessionForCurrentIdentity } = useAddressVerificationSession(
    resolvedNetwork ?? "base-sepolia",
    name
  );

  // Only redirect if connected to a wallet that's NOT the primary address
  // AND NOT the target address in an active session for THIS identity
  useEffect(() => {
    if (!isLoading && identity && isConnected && connectedAddress) {
      const isPrimaryAddress = connectedAddress.toLowerCase() === identity.primaryAddress.toLowerCase();
      const isTargetAddress = isSessionForCurrentIdentity && session && 
        connectedAddress.toLowerCase() === session.targetAddress.toLowerCase();
      
      if (!isPrimaryAddress && !isTargetAddress) {
        router.replace(`/${network}/~/${encodeIdentifier(name)}`);
      }
    }
  }, [isLoading, identity, isConnected, connectedAddress, isSessionForCurrentIdentity, session, network, name, router]);

  if (!resolvedNetwork) {
    return (
      <Alert severity="error">
        Invalid network. Please select a valid network.
      </Alert>
    );
  }

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
        <Alert severity="error" sx={{ mb: 3 }}>
          Identity &ldquo;{name}&rdquo; not found.
        </Alert>
        <Button
          component={Link}
          href={`/${network}/naming`}
          variant="outlined"
        >
          Back to all identities
        </Button>
      </Box>
    );
  }

  // Show edit view with warnings if not connected or no permission
  // User might need to reconnect to continue their work
  const isTargetAddress = connectedAddress && isSessionForCurrentIdentity && session && 
    connectedAddress.toLowerCase() === session.targetAddress.toLowerCase();

  return (
    <Box component="div">
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please connect your wallet to edit this profile.
        </Alert>
      )}

      {isConnected && !permissions.canManage && !isTargetAddress && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You do not have permission to edit this profile. Only the primary
          address can edit.
        </Alert>
      )}

      {isTargetAddress && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are connected as the target address for verification. Switch to the 
          primary address ({identity.primaryAddress.slice(0, 6)}...{identity.primaryAddress.slice(-4)}) 
          to manage this profile.
        </Alert>
      )}

      <EditProfileView
        network={resolvedNetwork}
        identity={identity}
        onRefetchIdentity={refetchIdentity}
      />
    </Box>
  );
}

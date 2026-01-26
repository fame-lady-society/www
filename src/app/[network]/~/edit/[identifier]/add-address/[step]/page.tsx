"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "next/link";
import { useIdentity } from "@/features/naming/hooks/useIdentity";
import { useIdentityPermissions } from "@/features/naming/hooks/useIdentityPermissions";
import { useAccount } from "@/hooks/useAccount";
import { useAddressVerificationSession } from "@/features/naming/hooks/useAddressVerificationSession";
import {
  resolveNetwork,
  parseIdentifier,
  encodeIdentifier,
} from "@/features/naming/utils/networkUtils";
import { StartStep } from "@/features/naming/components/AddAddressWizard/StartStep";
import { SignStep } from "@/features/naming/components/AddAddressWizard/SignStep";
import { SubmitStep } from "@/features/naming/components/AddAddressWizard/SubmitStep";
import { CompleteStep } from "@/features/naming/components/AddAddressWizard/CompleteStep";

type WizardStep = "start" | "sign" | "submit" | "complete";

const VALID_STEPS: WizardStep[] = ["start", "sign", "submit", "complete"];

function isValidStep(step: string): step is WizardStep {
  return VALID_STEPS.includes(step as WizardStep);
}

export default function AddAddressWizardPage({
  params,
}: {
  params: { network: string; identifier: string; step: string };
}) {
  const router = useRouter();
  const { network, identifier, step } = params;
  const resolvedNetwork = resolveNetwork(network);
  const name = parseIdentifier(identifier);
  const { address: connectedAddress, isConnected } = useAccount();

  const { identity, isLoading, notFound } = useIdentity(
    resolvedNetwork ?? "base-sepolia",
    name
  );
  const permissions = useIdentityPermissions(identity);
  const { session, isSessionForCurrentIdentity } = useAddressVerificationSession(
    resolvedNetwork ?? "base-sepolia",
    name
  );

  const editUrl = `/${network}/~/edit/${name}`;
  const wizardBaseUrl = `${editUrl}/add-address`;

  // Only redirect if ALL of these are true:
  // 1. Not loading and identity exists
  // 2. User is connected with a valid address  
  // 3. That wallet is NOT the primary address
  // 4. AND either there's no active session for this identity OR the wallet is not the target address
  useEffect(() => {
    // Don't redirect if no wallet connected or address is undefined
    if (!isLoading && identity && isConnected && connectedAddress) {
      const isPrimaryAddress = connectedAddress.toLowerCase() === identity.primaryAddress.toLowerCase();
      const isTargetAddress = isSessionForCurrentIdentity && session && 
        connectedAddress.toLowerCase() === session.targetAddress.toLowerCase();
      
      // Allow access if user is primary OR if they're the target address in an active session for THIS identity
      if (!isPrimaryAddress && !isTargetAddress) {
        router.replace(`/${network}/~/${encodeIdentifier(name)}`);
      }
    }
    // NOTE: Explicitly not redirecting when isConnected===false or connectedAddress===undefined
    // This allows users to disconnect and reconnect without being kicked out
  }, [isLoading, identity, isConnected, connectedAddress, isSessionForCurrentIdentity, session, network, name, router]);

  if (!resolvedNetwork) {
    return (
      <Alert severity="error">
        Invalid network. Please select a valid network.
      </Alert>
    );
  }

  if (!isValidStep(step)) {
    router.replace(`${wizardBaseUrl}/start`);
    return null;
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

  // Determine if connected wallet is the target address for signing
  const isTargetAddress = connectedAddress && isSessionForCurrentIdentity && session && 
    connectedAddress.toLowerCase() === session.targetAddress.toLowerCase();
  
  // Target wallet is only needed for the 'sign' step
  // Redirect target wallet users to the sign step if they try to access start
  if (isTargetAddress && step === "start") {
    router.replace(`${wizardBaseUrl}/sign`);
    return null;
  }

  // Primary wallet is required for 'start' and 'submit' steps
  // Block non-primary wallets from these steps (unless disconnected)
  if (isConnected && !permissions.canManage && !isTargetAddress && (step === "start" || step === "submit")) {
    return (
      <Alert severity="warning">
        You do not have permission to manage this profile. Only the primary
        address can initiate and submit verifications.
      </Alert>
    );
  }

  const stepProps = {
    network: resolvedNetwork,
    identity,
    editUrl,
    wizardBaseUrl,
  };

  switch (step) {
    case "start":
      return <StartStep {...stepProps} />;
    case "sign":
      return <SignStep {...stepProps} />;
    case "submit":
      return <SubmitStep {...stepProps} />;
    case "complete":
      return <CompleteStep {...stepProps} />;
    default:
      return null;
  }
}

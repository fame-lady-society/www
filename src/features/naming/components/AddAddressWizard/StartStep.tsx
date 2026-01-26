"use client";

import { type FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { isAddress } from "viem";
import { useReadContract, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "@/hooks/useAccount";
import { flsNamingAbi, flsNamingAddress } from "@/wagmi";
import { useAddressVerificationSession } from "../../hooks/useAddressVerificationSession";
import { getChainId } from "../../utils/networkUtils";
import { WizardLayout } from "./WizardLayout";
import type { WizardStepProps } from "./types";

// Minimal ABI for nonces function (since wagmi hasn't been regenerated yet)
const noncesAbi = [
  {
    type: "function",
    name: "nonces",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const StartStep: FC<WizardStepProps> = ({
  network,
  identity,
  editUrl,
  wizardBaseUrl,
}) => {
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = getChainId(network);
  const contractAddress = flsNamingAddress[chainId as keyof typeof flsNamingAddress];

  const { session, createSession, setStep, clearSession, isSessionForCurrentIdentity } =
    useAddressVerificationSession(network, identity.name);

  const [targetAddress, setTargetAddress] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // If there's an existing session for this identity, offer to resume
  const hasExistingSession =
    session !== null && isSessionForCurrentIdentity && session.currentStep !== "start";

  // Fetch nonce for the target address
  const { data: nonce, isLoading: isLoadingNonce } = useReadContract({
    address: contractAddress,
    abi: noncesAbi,
    functionName: "nonces",
    args: isAddress(targetAddress) ? [targetAddress as `0x${string}`] : undefined,
    chainId,
    query: {
      enabled: isAddress(targetAddress),
    },
  });

  // Check if address is already verified
  const { data: existingTokenId } = useReadContract({
    address: contractAddress,
    abi: flsNamingAbi,
    functionName: "addressToTokenId",
    args: isAddress(targetAddress) ? [targetAddress as `0x${string}`] : undefined,
    chainId,
    query: {
      enabled: isAddress(targetAddress),
    },
  });

  const isAddressAlreadyLinked = existingTokenId !== undefined && existingTokenId !== 0n;
  const isPrimaryAddress =
    targetAddress.toLowerCase() === identity.primaryAddress.toLowerCase();
  const isAlreadyVerified = identity.verifiedAddresses.some(
    (addr) => addr.toLowerCase() === targetAddress.toLowerCase()
  );

  const canProceed =
    isAddress(targetAddress) &&
    !isAddressAlreadyLinked &&
    !isPrimaryAddress &&
    !isAlreadyVerified &&
    nonce !== undefined &&
    connectedAddress?.toLowerCase() === identity.primaryAddress.toLowerCase();

  const handleAddressChange = (value: string) => {
    setTargetAddress(value);
    setValidationError(null);
  };

  const handleContinue = () => {
    setValidationError(null);

    if (!connectedAddress) {
      setValidationError("Please connect your primary wallet to continue");
      return;
    }

    if (connectedAddress.toLowerCase() !== identity.primaryAddress.toLowerCase()) {
      setValidationError("Please connect with the primary wallet to continue");
      return;
    }

    if (!isAddress(targetAddress)) {
      setValidationError("Please enter a valid Ethereum address");
      return;
    }

    if (isPrimaryAddress) {
      setValidationError("Cannot add the primary address as a verified address");
      return;
    }

    if (isAlreadyVerified) {
      setValidationError("This address is already verified for this identity");
      return;
    }

    if (isAddressAlreadyLinked) {
      setValidationError("This address is already linked to another identity");
      return;
    }

    if (nonce === undefined) {
      setValidationError("Unable to fetch nonce. Please try again.");
      return;
    }

    setIsCreating(true);

    try {
      createSession({
        network,
        identifier: identity.name,
        tokenId: identity.tokenId,
        primaryAddress: identity.primaryAddress,
        targetAddress: targetAddress as `0x${string}`,
        nonce,
      });

      // Update session to sign step before navigating
      setStep("sign");
      router.push(`${wizardBaseUrl}/sign`);
    } catch (error) {
      setValidationError("Failed to create session. Please try again.");
      setIsCreating(false);
    }
  };

  const handleResume = () => {
    if (session) {
      router.push(`${wizardBaseUrl}/${session.currentStep}`);
    }
  };

  const handleStartOver = () => {
    clearSession();
  };

  // Pre-populate from existing session if resuming at start
  useEffect(() => {
    if (session && isSessionForCurrentIdentity && session.currentStep === "start") {
      setTargetAddress(session.targetAddress);
    }
  }, [session, isSessionForCurrentIdentity]);

  return (
    <WizardLayout
      currentStep="start"
      title="Enter the address to verify"
      description="Enter the Ethereum address you want to add as a verified address for this identity. You will need to sign a message from this address in the next step."
      editUrl={editUrl}
    >
      {hasExistingSession && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            You have an in-progress verification for address:{" "}
            <strong>{session?.targetAddress}</strong>
          </Typography>
          <Box component="div" sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button size="small" variant="contained" onClick={handleResume}>
              Resume
            </Button>
            <Button size="small" variant="outlined" onClick={handleStartOver}>
              Start Over
            </Button>
          </Box>
        </Alert>
      )}

      {!connectedAddress && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Wallet Disconnected</strong>
          </Typography>
          <Typography variant="body2">
            Please connect your primary wallet ({identity.primaryAddress.slice(0, 6)}
            ...{identity.primaryAddress.slice(-4)}) to continue.
          </Typography>
        </Alert>
      )}

      {connectedAddress && connectedAddress.toLowerCase() !== identity.primaryAddress.toLowerCase() && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Wrong Wallet Connected</strong>
          </Typography>
          <Typography variant="body2">
            Please switch to the primary wallet ({identity.primaryAddress.slice(0, 6)}
            ...{identity.primaryAddress.slice(-4)}) to add a verified address.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontFamily: "monospace", fontSize: "0.75rem" }}>
            Currently connected: {connectedAddress}
          </Typography>
        </Alert>
      )}

      <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <TextField
          label="Address to Verify"
          value={targetAddress}
          onChange={(e) => handleAddressChange(e.target.value)}
          fullWidth
          placeholder="0x..."
          error={!!validationError}
          helperText={
            validationError ||
            (isAddress(targetAddress) && isLoadingNonce
              ? "Checking address..."
              : isAddress(targetAddress) && !isLoadingNonce
              ? `Nonce: ${nonce?.toString() ?? "Unknown"}`
              : "Enter the address you want to add")
          }
          disabled={isCreating}
        />

        {isAddressAlreadyLinked && (
          <Alert severity="error">
            This address is already linked to another identity and cannot be added.
          </Alert>
        )}

        {isPrimaryAddress && (
          <Alert severity="error">
            The primary address is already part of this identity.
          </Alert>
        )}

        {isAlreadyVerified && (
          <Alert severity="info">
            This address is already verified for this identity.
          </Alert>
        )}

        <Box component="div" sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleContinue}
            disabled={!canProceed || isCreating || isLoadingNonce}
            endIcon={isCreating ? <CircularProgress size={16} /> : null}
          >
            {isCreating ? "Creating Session..." : "Continue to Sign"}
          </Button>
        </Box>
      </Box>
    </WizardLayout>
  );
};

"use client";

import { type FC, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useSignTypedData, useSwitchChain, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "@/hooks/useAccount";
import { useAddressVerificationSession } from "../../hooks/useAddressVerificationSession";
import {
  useSessionValidation,
  formatTimeRemaining,
} from "../../hooks/useSessionValidation";
import {
  getSessionTokenId,
  getSessionNonce,
} from "../../utils/verificationSession";
import { buildAddVerifiedAddressTypedData, formatTypedDataForDisplay } from "../../utils/eip712";
import { getChainId } from "../../utils/networkUtils";
import { WizardLayout } from "./WizardLayout";
import type { WizardStepProps } from "./types";

type ConnectActionProps = {
  isConnected: boolean;
  autoOpen: boolean;
  onAutoOpenHandled: () => void;
  onDisconnect: () => void;
  shouldShowDisconnect: boolean;
};

const ConnectActionButton: FC<ConnectActionProps> = ({
  isConnected,
  autoOpen,
  onAutoOpenHandled,
  onDisconnect,
  shouldShowDisconnect,
}) => {
  const showRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (autoOpen && showRef.current) {
      showRef.current();
      onAutoOpenHandled();
    }
  }, [autoOpen, onAutoOpenHandled]);

  return (
    <ConnectKitButton.Custom>
      {({ show }) => {
        showRef.current = show;

        if (!isConnected) {
          return (
            <Button variant="outlined" onClick={() => showRef.current?.()}>
              Connect Wallet
            </Button>
          );
        }

        if (!shouldShowDisconnect) return null;

        return (
          <Button variant="outlined" color="error" onClick={onDisconnect}>
            Disconnect Wallet
          </Button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};

export const SignStep: FC<WizardStepProps> = ({
  network,
  identity,
  editUrl,
  wizardBaseUrl,
}) => {
  const router = useRouter();
  const {
    address: connectedAddress,
    chainId: connectedChainId,
    isConnected,
  } = useAccount();
  const { disconnect } = useDisconnect();
  const { session, setSignature, setStep, clearSession, isSessionForCurrentIdentity } =
    useAddressVerificationSession(network, identity.name);

  const { isExpired, timeRemaining, handleExpired } = useSessionValidation(
    session,
    wizardBaseUrl,
    editUrl
  );

  const [signError, setSignError] = useState<string | null>(null);
  const [pendingSign, setPendingSign] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const [autoOpenConnect, setAutoOpenConnect] = useState(false);

  const expectedChainId = getChainId(network);
  const isWrongChain = connectedChainId !== undefined && connectedChainId !== expectedChainId;

  const {
    signTypedData,
    isPending: isSigning,
    error: wagmiSignError,
    reset: resetSign,
  } = useSignTypedData();

  const {
    switchChainAsync,
    isPending: isSwitchingChain,
  } = useSwitchChain();

  const tokenId = session ? getSessionTokenId(session) : BigInt(0);
  const nonce = session ? getSessionNonce(session) : BigInt(0);
  const isTargetWalletConnected =
    session && connectedAddress?.toLowerCase() === session.targetAddress.toLowerCase();

  // Redirect if no valid session
  useEffect(() => {
    if (!session || !isSessionForCurrentIdentity) {
      router.replace(`${wizardBaseUrl}/start`);
    }
  }, [session, isSessionForCurrentIdentity, wizardBaseUrl, router]);

  useEffect(() => {
    if (!isConnected) {
      setAutoOpenConnect(true);
    } else {
      setAutoOpenConnect(false);
    }
  }, [isConnected]);

  // Check if we already have a signature (resume case)
  useEffect(() => {
    if (session?.signature) {
      setSignSuccess(true);
    }
  }, [session?.signature]);

  // Handle signing after chain switch
  useEffect(() => {
    if (pendingSign && !isWrongChain && connectedChainId === expectedChainId && session) {
      setPendingSign(false);
      const sessionTokenId = getSessionTokenId(session);
      const sessionNonce = getSessionNonce(session);
      
      // Trigger sign - don't call handleSign to avoid circular dependency
      const typedData = buildAddVerifiedAddressTypedData(
        network,
        sessionTokenId,
        session.targetAddress,
        sessionNonce
      );

      signTypedData(
        {
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        },
        {
          onSuccess: (signature) => {
            setSignature(signature);
            setStep("submit");
            setSignSuccess(true);
          },
          onError: (error) => {
            setSignError(error.message || "Failed to sign message");
          },
        }
      );
    }
  }, [pendingSign, isWrongChain, connectedChainId, expectedChainId, network, session, signTypedData, setSignature, setStep]);

  if (!session || !isSessionForCurrentIdentity) {
    return (
      <Box
        component="div"
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

  const handleSign = async () => {
    setSignError(null);
    resetSign();

    try {
      // If on wrong chain, switch first
      if (isWrongChain && switchChainAsync) {
        await switchChainAsync({ chainId: expectedChainId });
        // Set flag to trigger sign after chain updates
        setPendingSign(true);
        return;
      }

      const typedData = buildAddVerifiedAddressTypedData(
        network,
        tokenId,
        session.targetAddress,
        nonce
      );

      signTypedData(
        {
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        },
        {
          onSuccess: (signature) => {
            setSignature(signature);
            setStep("submit");
            setSignSuccess(true);
          },
          onError: (error) => {
            setSignError(error.message || "Failed to sign message");
          },
        }
      );
    } catch (error) {
      setPendingSign(false);
      setSignError(
        error instanceof Error ? error.message : "Failed to sign message"
      );
    }
  };

  const handleContinueToSubmit = () => {
    router.push(`${wizardBaseUrl}/submit`);
  };

  const handleCancel = () => {
    clearSession();
    router.push(editUrl);
  };

  const handleBack = () => {
    router.push(`${wizardBaseUrl}/start`);
  };

  return (
    <WizardLayout
      currentStep="sign"
      title="Sign verification message"
      description="Connect the wallet you want to add and sign a message to prove ownership."
      editUrl={editUrl}
    >
      <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Session expiry warning */}
        {isExpired && (
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={handleExpired}>
              Start Over
            </Button>
          }>
            Your session has expired. Please start the verification process again.
          </Alert>
        )}

        {!isExpired && timeRemaining !== null && timeRemaining < 5 * 60 * 1000 && (
          <Alert severity="warning">
            Session expires in {formatTimeRemaining(timeRemaining)}. Please complete soon.
          </Alert>
        )}

        {/* Target address info */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Address to Verify
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
          >
            {session.targetAddress}
          </Typography>
        </Paper>

        {/* Connection status - hide after successful signing */}
        {!signSuccess && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderColor: isTargetWalletConnected ? "success.main" : "warning.main",
              backgroundColor: isTargetWalletConnected
                ? "success.lighter"
                : "warning.lighter",
            }}
          >
            <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isTargetWalletConnected ? (
                <>
                  <CheckCircleIcon color="success" />
                  <Typography variant="body1" color="success.main">
                    Target wallet connected
                  </Typography>
                </>
              ) : (
                <>
                  <ErrorIcon color="warning" />
                  <Typography variant="body1" color="warning.main">
                    Please switch to the target wallet
                  </Typography>
                </>
              )}
            </Box>

            {connectedAddress && !isTargetWalletConnected && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, fontFamily: "monospace" }}
              >
                Currently connected: {connectedAddress}
              </Typography>
            )}

            {!connectedAddress && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No wallet connected. Please connect the target wallet.
              </Typography>
            )}
          </Paper>
        )}

        {/* Connection controls */}
        <Box component="div" sx={{ display: "flex", gap: 2 }}>
          <ConnectActionButton
            isConnected={isConnected}
            autoOpen={autoOpenConnect}
            onAutoOpenHandled={() => setAutoOpenConnect(false)}
            onDisconnect={() => disconnect()}
            shouldShowDisconnect={
              connectedAddress?.toLowerCase() !== session?.targetAddress.toLowerCase()
            }
          />
        </Box>

        {/* Chain warning - hide after signing */}
        {!signSuccess && isWrongChain && (
          <Alert severity="error">
            <Typography variant="body2" gutterBottom>
              <strong>Wrong Network</strong>
            </Typography>
            <Typography variant="body2">
              You are connected to the wrong network. Please switch to{" "}
              <strong>{network}</strong> or click &quot;Sign Message&quot; to switch automatically.
            </Typography>
          </Alert>
        )}

        {/* Instructions - hide after signing */}
        {!signSuccess && !connectedAddress && (
          <Alert severity="warning">
            <Typography variant="body2" gutterBottom>
              <strong>Wallet Disconnected</strong>
            </Typography>
            <Typography variant="body2">
              Please connect the wallet you want to add:
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontFamily: "monospace" }}>
              {session.targetAddress}
            </Typography>
          </Alert>
        )}

        {!signSuccess && connectedAddress && !isTargetWalletConnected && !isWrongChain && (
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Switch to target wallet:</strong>
            </Typography>
            <ol style={{ margin: "8px 0", paddingLeft: "20px" }}>
              <li>Open your wallet app or browser extension</li>
              <li>Switch to the account: {session.targetAddress.slice(0, 8)}...{session.targetAddress.slice(-6)}</li>
              <li>Reconnect to this site if needed</li>
              <li>Click &quot;Sign Message&quot; when ready</li>
            </ol>
          </Alert>
        )}


        {/* Success message */}
        {signSuccess && (
          <Alert severity="success">
            <Typography variant="body2" gutterBottom>
              <strong>Signature Collected Successfully!</strong>
            </Typography>
            <Typography variant="body2">
              Now switch to your primary wallet ({identity.primaryAddress.slice(0, 6)}...
              {identity.primaryAddress.slice(-4)}) to submit the transaction.
            </Typography>
          </Alert>
        )}

        {/* Errors */}
        {(signError || wagmiSignError) && (
          <Alert severity="error" onClose={() => setSignError(null)}>
            {signError || wagmiSignError?.message || "Failed to sign message"}
          </Alert>
        )}

        {/* Actions */}
        <Box component="div" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Button variant="outlined" onClick={handleBack} disabled={signSuccess}>
            Back
          </Button>
          <Box component="div" sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" color="error" onClick={handleCancel}>
              Cancel
            </Button>
            {signSuccess ? (
              <Button
                variant="outlined"
                color="success"
                onClick={handleContinueToSubmit}
              >
                Continue to Submit
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={handleSign}
                disabled={!isTargetWalletConnected || isSigning || isSwitchingChain || pendingSign}
                endIcon={(isSigning || isSwitchingChain || pendingSign) ? <CircularProgress size={16} /> : null}
              >
                {isSwitchingChain ? "Switching Network..." : 
                 pendingSign ? "Preparing..." :
                 isSigning ? "Signing..." : 
                 isWrongChain ? "Switch Network & Sign" :
                 "Sign Message"}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </WizardLayout>
  );
};

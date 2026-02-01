"use client";

import { type FC, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useWaitForTransactionReceipt, useSwitchChain, useDisconnect, useWriteContract } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "@/hooks/useAccount";
import { flsNamingAbi, flsNamingAddress } from "@/wagmi";
import { useAddressVerificationSession } from "../../hooks/useAddressVerificationSession";
import {
  useSessionValidation,
  formatTimeRemaining,
} from "../../hooks/useSessionValidation";
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

export const SubmitStep: FC<WizardStepProps> = ({
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
  const chainId = getChainId(network);
  const { session, setStep, clearSession, isSessionForCurrentIdentity } =
    useAddressVerificationSession(network, identity.name);

  const { isExpired, timeRemaining, handleExpired } = useSessionValidation(
    session,
    wizardBaseUrl,
    editUrl
  );

  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [autoOpenConnect, setAutoOpenConnect] = useState(false);

  const {
    mutate: addVerifiedAddress,
    data: txHash,
    isPending: isSubmitting,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const {
    switchChainAsync,
    isPending: isSwitchingChain,
  } = useSwitchChain();

  // Redirect if no valid session or missing signature
  useEffect(() => {
    if (!session || !isSessionForCurrentIdentity) {
      router.replace(`${wizardBaseUrl}/start`);
      return;
    }
    if (!session.signature) {
      router.replace(`${wizardBaseUrl}/sign`);
    }
  }, [session, isSessionForCurrentIdentity, wizardBaseUrl, router]);

  useEffect(() => {
    if (!isConnected) {
      setAutoOpenConnect(true);
    } else {
      setAutoOpenConnect(false);
    }
  }, [isConnected]);

  // Navigate to complete on success
  useEffect(() => {
    if (isConfirmed) {
      setStep("complete");
      router.push(`${wizardBaseUrl}/complete`);
    }
  }, [isConfirmed, wizardBaseUrl, router, setStep]);



  const isPrimaryWalletConnected =
    connectedAddress?.toLowerCase() === session?.primaryAddress.toLowerCase();
  const isWrongChain =
    connectedChainId !== undefined && connectedChainId !== chainId;

  const handleSubmit = async () => {
    setSubmitError(null);
    resetWrite();

    if (!session?.signature) {
      setSubmitError("No signature found. Please go back and sign again.");
      return;
    }

    if (isWrongChain && switchChainAsync) {
      await switchChainAsync({ chainId });
      setPendingSubmit(true);
      return;
    }

    addVerifiedAddress({
      chainId: chainId,
      args: [session?.targetAddress, session?.signature],
      abi: flsNamingAbi,
      functionName: "addVerifiedAddress" as const,
      address: flsNamingAddress[chainId as keyof typeof flsNamingAddress],
    });
  };

  useEffect(() => {
    if (pendingSubmit && !isWrongChain && connectedChainId === chainId) {
      setPendingSubmit(false);
      if (!session?.signature) {
        setSubmitError("No signature found. Please go back and sign again.");
        return;
      }

      addVerifiedAddress({
        chainId: chainId,
        args: [session.targetAddress, session.signature],
        abi: flsNamingAbi,
        functionName: "addVerifiedAddress" as const,
        address: flsNamingAddress[chainId as keyof typeof flsNamingAddress],
      });
    }
  }, [pendingSubmit, isWrongChain, connectedChainId, chainId, addVerifiedAddress, session]);

  const handleCancel = () => {
    clearSession();
    router.push(editUrl);
  };

  const handleBack = () => {
    router.push(`${wizardBaseUrl}/sign`);
  };

  const error = submitError || writeError?.message || receiptError?.message;
  const isWorking = isSubmitting || isConfirming || isSwitchingChain || pendingSubmit;

  if (!session || !isSessionForCurrentIdentity || !session.signature) {
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
  return (
    <WizardLayout
      currentStep="submit"
      title="Submit transaction"
      description="Switch back to your primary wallet and submit the transaction to add the verified address."
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

        {/* Connection controls */}
        <Box component="div" sx={{ display: "flex", gap: 2 }}>
          <ConnectActionButton
            isConnected={isConnected}
            autoOpen={autoOpenConnect}
            onAutoOpenHandled={() => setAutoOpenConnect(false)}
            onDisconnect={() => disconnect()}
            shouldShowDisconnect={
              connectedAddress?.toLowerCase() !== session.primaryAddress.toLowerCase()
            }
          />
        </Box>

        {/* Wrong chain warning */}
        {isWrongChain && (
          <Alert severity="error">
            <Typography variant="body2" gutterBottom>
              <strong>Wrong Network</strong>
            </Typography>
            <Typography variant="body2">
              You are connected to the wrong network. Please switch to{" "}
              <strong>{network}</strong> or click &quot;Submit Transaction&quot;
              to switch automatically.
            </Typography>
          </Alert>
        )}

        {/* Summary */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Adding Verified Address
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
          >
            {session.targetAddress}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            to identity: <strong>{identity.name}</strong>
          </Typography>
        </Paper>

        {/* Connection status */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderColor: isPrimaryWalletConnected ? "success.main" : "warning.main",
            backgroundColor: isPrimaryWalletConnected
              ? "success.lighter"
              : "warning.lighter",
          }}
        >
          <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isPrimaryWalletConnected ? (
              <>
                <CheckCircleIcon color="success" />
                <Typography variant="body1" color="success.main">
                  Primary wallet connected
                </Typography>
              </>
            ) : !connectedAddress ? (
              <>
                <ErrorIcon color="warning" />
                <Typography variant="body1" color="warning.main">
                  Wallet disconnected - Please reconnect
                </Typography>
              </>
            ) : (
              <>
                <ErrorIcon color="warning" />
                <Typography variant="body1" color="warning.main">
                  Please switch to the primary wallet
                </Typography>
              </>
            )}
          </Box>

          {!connectedAddress && (
            <Box component="div" sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Required wallet:{" "}
                <span style={{ fontFamily: "monospace" }}>
                  {session.primaryAddress}
                </span>
              </Typography>
            </Box>
          )}

          {connectedAddress && !isPrimaryWalletConnected && (
            <Box component="div" sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Currently connected:{" "}
                <span style={{ fontFamily: "monospace" }}>{connectedAddress}</span>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Required:{" "}
                <span style={{ fontFamily: "monospace" }}>
                  {session.primaryAddress}
                </span>
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Instructions for disconnected wallet */}
        {!connectedAddress && (
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Reconnect your primary wallet to continue:</strong>
            </Typography>
            <ol style={{ margin: "8px 0", paddingLeft: "20px" }}>
              <li>Open your wallet app or browser extension</li>
              <li>Connect with: {session.primaryAddress.slice(0, 8)}...{session.primaryAddress.slice(-6)}</li>
              <li>Click &quot;Submit Transaction&quot; when ready</li>
            </ol>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
              Your signature has been saved and will remain valid until you submit.
            </Typography>
          </Alert>
        )}


        {/* Transaction status */}
        {txHash && (
          <Alert severity={isConfirmed ? "success" : "info"}>
            {isConfirming ? (
              <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">
                  Waiting for transaction confirmation...
                </Typography>
              </Box>
            ) : isConfirmed ? (
              <Typography variant="body2">Transaction confirmed!</Typography>
            ) : (
              <Typography variant="body2">Transaction submitted.</Typography>
            )}
            <Typography
              variant="body2"
              sx={{ fontFamily: "monospace", fontSize: "0.75rem", mt: 1 }}
            >
              TX: {txHash}
            </Typography>
          </Alert>
        )}

        {/* Errors */}
        {error && (
          <Alert
            severity="error"
            onClose={() => {
              setSubmitError(null);
              resetWrite();
            }}
            action={
              error.includes("InvalidSignature") ? (
                <Button color="inherit" size="small" onClick={handleExpired}>
                  Start Over
                </Button>
              ) : undefined
            }
          >
            {error.includes("InvalidSignature") ? (
              <>
                <strong>Signature Invalid:</strong> The nonce may have changed since you signed.
                Please start the verification process again.
              </>
            ) : (
              error
            )}
          </Alert>
        )}

        {/* Actions */}
        <Box component="div" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Button variant="outlined" onClick={handleBack} disabled={isWorking}>
            Back
          </Button>
          <Box component="div" sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              disabled={isWorking}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={handleSubmit}
              disabled={!isPrimaryWalletConnected || isWorking}
              endIcon={isWorking ? <CircularProgress size={16} /> : null}
            >
              {isSwitchingChain
                ? "Switching Network..."
                : pendingSubmit
                ? "Preparing..."
                : isSubmitting
                ? "Submitting..."
                : isConfirming
                ? "Confirming..."
                : isWrongChain
                ? "Switch Network & Submit"
                : "Submit Transaction"}
            </Button>
          </Box>
        </Box>
      </Box>
    </WizardLayout>
  );
};

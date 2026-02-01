"use client";

import { type FC, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import DeleteIcon from "@mui/icons-material/Delete";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Link from "next/link";
import { useWaitForTransactionReceipt } from "wagmi";
import { useWriteFlsNamingRemoveVerifiedAddress } from "@/wagmi";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import { useAddressVerificationSession } from "../hooks/useAddressVerificationSession";
import { getChainId, encodeIdentifier } from "../utils/networkUtils";

export interface VerifiedAddressManagerProps {
  network: NetworkType;
  identifier: string;
  verifiedAddresses: readonly `0x${string}`[];
  primaryAddress: `0x${string}`;
}

export const VerifiedAddressManager: FC<VerifiedAddressManagerProps> = ({
  network,
  identifier,
  verifiedAddresses,
  primaryAddress,
}) => {
  const chainId = getChainId(network);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { session, isSessionForCurrentIdentity, clearSession } =
    useAddressVerificationSession(network, identifier);

  const hasIncompleteSession =
    session !== null &&
    isSessionForCurrentIdentity &&
    session.currentStep !== "complete";

  const {
    writeContract: removeAddress,
    data: removeTxHash,
    isPending: isRemovePending,
    error: removeError,
    reset: resetRemove,
  } = useWriteFlsNamingRemoveVerifiedAddress();

  const { isLoading: isRemoveConfirming, isSuccess: isRemoveSuccess } =
    useWaitForTransactionReceipt({ hash: removeTxHash });

  useEffect(() => {
    if (isRemoveSuccess) {
      setSuccessMessage("Address removed successfully!");
      setPendingAddress(null);
      resetRemove();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [isRemoveSuccess, resetRemove]);

  const handleRemoveAddress = (address: `0x${string}`) => {
    setPendingAddress(address);
    removeAddress({
      chainId: chainId,
      args: [address],
    });
  };

  const isWorking = isRemovePending || isRemoveConfirming;

  const addAddressUrl = `/${network}/profile/edit/${encodeIdentifier(identifier)}/add-address/start`;
  const resumeUrl = hasIncompleteSession
    ? `/${network}/profile/edit/${encodeIdentifier(identifier)}/add-address/${session.currentStep}`
    : addAddressUrl;

  return (
    <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {removeError && ( 
        <Alert severity="error" onClose={() => resetRemove()}>
          {removeError.message}
        </Alert>
      )}

      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      {/* In-progress verification notice */}
      {hasIncompleteSession && session && (
        <Alert
          severity="info"
          action={
            <Box component="div" sx={{ display: "flex", gap: 1 }}>
              <Button
                component={Link}
                href={resumeUrl}
                size="small"
                color="inherit"
                startIcon={<PlayArrowIcon />}
              >
                Resume
              </Button>
              <Button size="small" color="inherit" onClick={() => clearSession()}>
                Cancel
              </Button>
            </Box>
          }
        >
          <Typography variant="body2">
            Verification in progress for:{" "}
            <strong>
              {session.targetAddress.slice(0, 8)}...{session.targetAddress.slice(-6)}
            </strong>
          </Typography>
        </Alert>
      )}

      {/* Current addresses */}
      <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {verifiedAddresses.map((addr) => {
          const isPrimary = addr.toLowerCase() === primaryAddress.toLowerCase();
          const isBeingRemoved = pendingAddress?.toLowerCase() === addr.toLowerCase();

          return (
            <Box
              key={addr}
              component="div"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                backgroundColor: "rgba(0,0,0,0.02)",
                borderRadius: 1,
              }}
            >
              <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    wordBreak: "break-all",
                  }}
                >
                  {addr}
                </Typography>
                {isPrimary && (
                  <>
                    <EmojiEventsIcon
                      fontSize="small"
                      color="primary"
                      sx={{ ml: 0.5 }}
                    />
                  </>
                )}
              </Box>

              {!isPrimary && (
                <IconButton
                  size="small"
                  onClick={() => handleRemoveAddress(addr)}
                  disabled={isWorking}
                  color="error"
                >
                  {isBeingRemoved && isWorking ? (
                    <CircularProgress size={20} />
                  ) : (
                    <DeleteIcon fontSize="small" />
                  )}
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Add new address button */}
      <Box component="div" sx={{ display: "flex", justifyContent: "flex-start" }}>
        <Button
          component={Link}
          href={addAddressUrl}
          variant="outlined"
          startIcon={<AddIcon />}
          disabled={isWorking}
        >
          Add Verified Address
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Adding a verified address requires signing a message from that address.
        You will be guided through a multi-step process.
      </Typography>
    </Box>
  );
};

"use client";

import { type FC, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useWaitForTransactionReceipt } from "wagmi";
import { sepolia, mainnet, baseSepolia } from "viem/chains";
import { isAddress } from "viem";
import {
  useWriteFlsNamingAddVerifiedAddress,
  useWriteFlsNamingRemoveVerifiedAddress,
} from "@/wagmi";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";

function getChainId(network: NetworkType): number {
  switch (network) {
    case "sepolia":
      return sepolia.id;
    case "mainnet":
      return mainnet.id;
    case "base-sepolia":
      return baseSepolia.id;
  }
}

export interface VerifiedAddressManagerProps {
  network: NetworkType;
  tokenId: bigint;
  verifiedAddresses: readonly `0x${string}`[];
  primaryAddress: `0x${string}`;
}

export const VerifiedAddressManager: FC<VerifiedAddressManagerProps> = ({
  network,
  tokenId,
  verifiedAddresses,
  primaryAddress,
}) => {
  const chainId = getChainId(network);
  const [newAddress, setNewAddress] = useState("");
  const [pendingAction, setPendingAction] = useState<"add" | "remove" | null>(null);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    writeContract: addAddress,
    data: addTxHash,
    isPending: isAddPending,
    error: addError,
    reset: resetAdd,
  } = useWriteFlsNamingAddVerifiedAddress();

  const {
    writeContract: removeAddress,
    data: removeTxHash,
    isPending: isRemovePending,
    error: removeError,
    reset: resetRemove,
  } = useWriteFlsNamingRemoveVerifiedAddress();

  const { isLoading: isAddConfirming, isSuccess: isAddSuccess } =
    useWaitForTransactionReceipt({ hash: addTxHash });

  const { isLoading: isRemoveConfirming, isSuccess: isRemoveSuccess } =
    useWaitForTransactionReceipt({ hash: removeTxHash });

  useEffect(() => {
    if (isAddSuccess && pendingAction === "add") {
      setSuccessMessage("Address added successfully!");
      setNewAddress("");
      setPendingAction(null);
      setPendingAddress(null);
      resetAdd();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [isAddSuccess, pendingAction, resetAdd]);

  useEffect(() => {
    if (isRemoveSuccess && pendingAction === "remove") {
      setSuccessMessage("Address removed successfully!");
      setPendingAction(null);
      setPendingAddress(null);
      resetRemove();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [isRemoveSuccess, pendingAction, resetRemove]);

  const handleAddAddress = () => {
    setValidationError(null);

    if (!newAddress.trim()) {
      setValidationError("Please enter an address");
      return;
    }

    if (!isAddress(newAddress)) {
      setValidationError("Invalid Ethereum address");
      return;
    }

    const normalizedNew = newAddress.toLowerCase();
    if (
      verifiedAddresses.some((addr) => addr.toLowerCase() === normalizedNew)
    ) {
      setValidationError("This address is already verified");
      return;
    }

    setPendingAction("add");
    setPendingAddress(newAddress);
    addAddress({
      chainId,
      args: [newAddress as `0x${string}`],
    });
  };

  const handleRemoveAddress = (address: `0x${string}`) => {
    setPendingAction("remove");
    setPendingAddress(address);
    removeAddress({
      chainId,
      args: [address],
    });
  };

  const isWorking =
    isAddPending || isRemovePending || isAddConfirming || isRemoveConfirming;
  const error = addError || removeError;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && (
        <Alert
          severity="error"
          onClose={() => {
            resetAdd();
            resetRemove();
          }}
        >
          {error.message}
        </Alert>
      )}

      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      {/* Current addresses */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {verifiedAddresses.map((addr) => {
          const isPrimary = addr.toLowerCase() === primaryAddress.toLowerCase();
          const isBeingRemoved =
            pendingAction === "remove" &&
            pendingAddress?.toLowerCase() === addr.toLowerCase();

          return (
            <Box
              key={addr}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                backgroundColor: "rgba(0,0,0,0.02)",
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                  <Chip label="Primary" size="small" color="primary" />
                )}
              </Box>

              {!isPrimary && (
                <IconButton
                  size="small"
                  onClick={() => handleRemoveAddress(addr)}
                  disabled={isWorking}
                  color="error"
                >
                  {isBeingRemoved ? (
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

      {/* Add new address */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          label="Add Verified Address"
          value={newAddress}
          onChange={(e) => {
            setNewAddress(e.target.value);
            setValidationError(null);
          }}
          fullWidth
          size="small"
          placeholder="0x..."
          disabled={isWorking}
          error={!!validationError}
          helperText={validationError}
        />
        <Button
          variant="contained"
          onClick={handleAddAddress}
          disabled={isWorking || !newAddress.trim()}
          startIcon={
            pendingAction === "add" && isWorking ? (
              <CircularProgress size={16} />
            ) : (
              <AddIcon />
            )
          }
          sx={{ minWidth: 100, height: 40 }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

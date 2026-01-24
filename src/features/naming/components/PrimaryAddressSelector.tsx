"use client";

import { type FC, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useWaitForTransactionReceipt } from "wagmi";
import { sepolia, mainnet, baseSepolia } from "viem/chains";
import { useWriteFlsNamingSetPrimaryAddress } from "@/wagmi";
import { useAccount } from "@/hooks/useAccount";
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

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export interface PrimaryAddressSelectorProps {
  network: NetworkType;
  tokenId: bigint;
  currentPrimary: `0x${string}`;
  primaryTokenId: bigint;
  verifiedAddresses?: readonly `0x${string}`[];
  isPrimaryTransfer?: boolean;
}

export const PrimaryAddressSelector: FC<PrimaryAddressSelectorProps> = ({
  network,
  tokenId,
  currentPrimary,
  primaryTokenId,
  verifiedAddresses,
  isPrimaryTransfer = false,
}) => {
  const chainId = getChainId(network);
  const { address: connectedAddress } = useAccount();
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    writeContract,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteFlsNamingSetPrimaryAddress();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      setSuccessMessage(
        isPrimaryTransfer
          ? "Primary role transferred successfully!"
          : "You are now the primary address!"
      );
      reset();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [isSuccess, reset, isPrimaryTransfer]);

  const handleTransfer = () => {
    if (!selectedAddress) return;

    writeContract({
      chainId,
      args: [selectedAddress as `0x${string}`],
    });
  };

  const handleRequestPrimary = () => {
    if (!connectedAddress) return;

    writeContract({
      chainId,
      args: [connectedAddress],
    });
  };

  const isWorking = isPending || isConfirming;

  // For primary transfer: show dropdown of verified addresses (excluding current primary)
  if (isPrimaryTransfer && verifiedAddresses) {
    const eligibleAddresses = verifiedAddresses.filter(
      (addr) => addr.toLowerCase() !== currentPrimary.toLowerCase()
    );

    if (eligibleAddresses.length === 0) {
      return (
        <Alert severity="info">
          Add more verified addresses before transferring the primary role.
        </Alert>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => reset()}>
            {error.message}
          </Alert>
        )}

        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Alert severity="warning">
          Warning: Transferring the primary role will give full control of this
          identity to the selected address. This action cannot be undone without
          cooperation from the new primary.
        </Alert>

        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Select New Primary Address</InputLabel>
            <Select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              label="Select New Primary Address"
              disabled={isWorking}
            >
              {eligibleAddresses.map((addr) => (
                <MenuItem key={addr} value={addr}>
                  {truncateAddress(addr)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="warning"
            onClick={handleTransfer}
            disabled={!selectedAddress || isWorking}
            startIcon={isWorking ? <CircularProgress size={16} /> : null}
          >
            {isWorking ? "Transferring..." : "Transfer Primary Role"}
          </Button>
        </Box>
      </Box>
    );
  }

  // For verified user requesting to become primary
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => reset()}>
          {error.message}
        </Alert>
      )}

      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <Typography variant="body2" color="text.secondary">
        As a verified address, you can request to become the primary address.
        Note: The bound gate NFT (Token #{primaryTokenId.toString()}) must be
        owned by either you or the current primary for this to succeed.
      </Typography>

      <Button
        variant="contained"
        onClick={handleRequestPrimary}
        disabled={isWorking}
        startIcon={isWorking ? <CircularProgress size={16} /> : null}
        sx={{ alignSelf: "flex-start" }}
      >
        {isWorking ? "Requesting..." : "Become Primary Address"}
      </Button>
    </Box>
  );
};

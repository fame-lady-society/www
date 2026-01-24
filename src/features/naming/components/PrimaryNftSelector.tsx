"use client";

import { type FC, useState, useEffect, useMemo } from "react";
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
import { useWriteFlsNamingSetPrimaryTokenId } from "@/wagmi";
import { useOwnedGateNftTokens, type NetworkType } from "../hooks/useOwnedGateNftTokens";

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

export interface PrimaryNftSelectorProps {
  network: NetworkType;
  tokenId: bigint;
  currentPrimaryTokenId: bigint;
  verifiedAddresses: readonly `0x${string}`[];
}

export const PrimaryNftSelector: FC<PrimaryNftSelectorProps> = ({
  network,
  tokenId,
  currentPrimaryTokenId,
  verifiedAddresses,
}) => {
  const chainId = getChainId(network);
  const [selectedTokenId, setSelectedTokenId] = useState<string>(
    currentPrimaryTokenId.toString()
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get owned tokens - this will return tokens owned by the connected wallet
  // In a more complete implementation, we'd fetch tokens for all verified addresses
  const { data: ownedTokens, isLoading: isLoadingTokens } =
    useOwnedGateNftTokens(network);

  const {
    writeContract,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteFlsNamingSetPrimaryTokenId();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) {
      setSuccessMessage("Primary NFT updated successfully!");
      reset();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [isSuccess, reset]);

  const handleChange = () => {
    if (selectedTokenId === currentPrimaryTokenId.toString()) return;

    writeContract({
      chainId,
      args: [BigInt(selectedTokenId)],
    });
  };

  const isWorking = isPending || isConfirming;
  const hasChanged = selectedTokenId !== currentPrimaryTokenId.toString();

  // Include current token in available options even if not in ownedTokens
  const availableTokens = useMemo(() => {
    const tokens = new Set<number>();
    tokens.add(Number(currentPrimaryTokenId));
    if (ownedTokens) {
      ownedTokens.forEach((t) => tokens.add(t));
    }
    return Array.from(tokens).sort((a, b) => a - b);
  }, [ownedTokens, currentPrimaryTokenId]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && (
        <Alert severity="error" onClose={() => reset()}>
          {error.message}
        </Alert>
      )}

      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <Typography variant="body2" color="text.secondary">
        Select a gate NFT owned by any of your verified addresses to bind to
        this identity. The bound NFT determines your identity's validity.
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
        {isLoadingTokens ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Loading available tokens...</Typography>
          </Box>
        ) : (
          <>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Bound NFT Token</InputLabel>
              <Select
                value={selectedTokenId}
                onChange={(e) => setSelectedTokenId(e.target.value)}
                label="Bound NFT Token"
                disabled={isWorking}
              >
                {availableTokens.map((tid) => (
                  <MenuItem key={tid} value={tid.toString()}>
                    Token #{tid}
                    {tid === Number(currentPrimaryTokenId) && " (current)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleChange}
              disabled={!hasChanged || isWorking}
              startIcon={isWorking ? <CircularProgress size={16} /> : null}
            >
              {isWorking ? "Updating..." : "Update Bound NFT"}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

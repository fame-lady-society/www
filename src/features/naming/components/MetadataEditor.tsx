"use client";

import { type FC, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useWaitForTransactionReceipt } from "wagmi";
import { sepolia, mainnet, baseSepolia } from "viem/chains";
import { useWriteFlsNamingSetMetadata } from "@/wagmi";
import { METADATA_KEYS } from "../hooks/useIdentity";
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

export interface MetadataEditorProps {
  network: NetworkType;
  tokenId: bigint;
  currentDescription: string;
  currentWebsite: string;
}

export const MetadataEditor: FC<MetadataEditorProps> = ({
  network,
  tokenId,
  currentDescription,
  currentWebsite,
}) => {
  const chainId = getChainId(network);
  const [description, setDescription] = useState(currentDescription);
  const [website, setWebsite] = useState(currentWebsite);
  const [pendingField, setPendingField] = useState<"description" | "website" | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    writeContract,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteFlsNamingSetMetadata();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess && pendingField) {
      setSuccessMessage(
        `${pendingField.charAt(0).toUpperCase() + pendingField.slice(1)} updated successfully!`
      );
      setPendingField(null);
      reset();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [isSuccess, pendingField, reset]);

  const handleSaveDescription = () => {
    setPendingField("description");
    writeContract({
      chainId,
      args: [tokenId, METADATA_KEYS.description, description],
    });
  };

  const handleSaveWebsite = () => {
    setPendingField("website");
    writeContract({
      chainId,
      args: [tokenId, METADATA_KEYS.website, website],
    });
  };

  const isWorking = isPending || isConfirming;
  const hasDescriptionChanged = description !== currentDescription;
  const hasWebsiteChanged = website !== currentWebsite;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {error && (
        <Alert severity="error" onClose={() => reset()}>
          {error.message}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success">{successMessage}</Alert>
      )}

      <Box>
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder="Tell the community about yourself..."
          disabled={isWorking}
        />
        <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSaveDescription}
            disabled={!hasDescriptionChanged || isWorking}
            startIcon={
              isWorking && pendingField === "description" ? (
                <CircularProgress size={16} />
              ) : null
            }
          >
            {isWorking && pendingField === "description"
              ? "Saving..."
              : "Save Description"}
          </Button>
        </Box>
      </Box>

      <Box>
        <TextField
          label="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          fullWidth
          placeholder="https://your-website.com"
          disabled={isWorking}
        />
        <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSaveWebsite}
            disabled={!hasWebsiteChanged || isWorking}
            startIcon={
              isWorking && pendingField === "website" ? (
                <CircularProgress size={16} />
              ) : null
            }
          >
            {isWorking && pendingField === "website"
              ? "Saving..."
              : "Save Website"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

"use client";

import { type FC, useMemo } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { PendingChange } from "../hooks/useProfileBatch";

export interface BatchSubmitBarProps {
  pendingChanges: PendingChange[];
  onSubmit: () => void;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
}

export const BatchSubmitBar: FC<BatchSubmitBarProps> = ({
  pendingChanges,
  onSubmit,
  isPending,
  isConfirming,
  isSuccess,
  error,
}) => {
  const isSubmitting = isPending || isConfirming;
  const labels = useMemo(() => {
    const unique = new Set(pendingChanges.map((change) => change.label));
    return Array.from(unique);
  }, [pendingChanges]);

  return (
    <Card sx={{ position: "sticky", bottom: 0, zIndex: 1, mt: 3 }}>
      <CardContent>
        <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">Pending Changes</Typography>
            <Chip label={pendingChanges.length} size="small" />
          </Box>

          {labels.length > 0 ? (
            <Box component="div" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {labels.map((label) => (
                <Chip key={label} label={label} size="small" variant="outlined" />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No changes staged yet. Update your profile details to add them to the batch.
            </Typography>
          )}

          {error && <Alert severity="error">{error.message}</Alert>}
          {isSuccess && <Alert severity="success">Profile updates submitted.</Alert>}
          {isPending && (
            <Alert severity="info">Confirm the transaction in your wallet.</Alert>
          )}
          {isConfirming && (
            <Alert severity="info">Transaction submitted. Waiting for confirmation.</Alert>
          )}

          <Box component="div" sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={onSubmit}
              disabled={pendingChanges.length === 0 || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit All Changes"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

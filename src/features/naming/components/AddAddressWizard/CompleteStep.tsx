"use client";

import { type FC, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Link from "next/link";
import { useAddressVerificationSession } from "../../hooks/useAddressVerificationSession";
import { WizardLayout } from "./WizardLayout";
import type { WizardStepProps } from "./types";

export const CompleteStep: FC<WizardStepProps> = ({
  network,
  identity,
  editUrl,
  wizardBaseUrl,
}) => {
  const router = useRouter();
  const { session, clearSession, isSessionForCurrentIdentity } =
    useAddressVerificationSession(network, identity.name);

  // Clear session after showing completion
  useEffect(() => {
    // Delay clearing to ensure user sees the completion message
    const timeout = setTimeout(() => {
      if (session && isSessionForCurrentIdentity) {
        clearSession();
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [session, isSessionForCurrentIdentity, clearSession]);

  const addedAddress = session?.targetAddress;

  const handleAddAnother = () => {
    clearSession();
    router.push(`${wizardBaseUrl}/start`);
  };

  return (
    <WizardLayout
      currentStep="complete"
      title="Address verified!"
      description="The address has been successfully added to your identity."
      editUrl={editUrl}
    >
      <Box
        component="div"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          py: 4,
        }}
      >
        <CheckCircleOutlineIcon
          sx={{ fontSize: 80, color: "success.main" }}
        />

        <Typography variant="h6" textAlign="center">
          Verification Complete
        </Typography>

        <Typography variant="body1" color="text.secondary" textAlign="center">
          The following address has been added as a verified address for{" "}
          <strong>{identity.name}</strong>
        </Typography>

        {addedAddress && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: "success.lighter",
              borderColor: "success.main",
              width: "100%",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontFamily: "monospace",
                wordBreak: "break-all",
                textAlign: "center",
              }}
            >
              {addedAddress}
            </Typography>
          </Paper>
        )}

        <Box
          component="div"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            maxWidth: 300,
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            component={Link}
            href={editUrl}
            fullWidth
          >
            Return to Profile
          </Button>
          <Button
            variant="outlined"
            onClick={handleAddAnother}
            fullWidth
          >
            Add Another Address
          </Button>
        </Box>
      </Box>
    </WizardLayout>
  );
};

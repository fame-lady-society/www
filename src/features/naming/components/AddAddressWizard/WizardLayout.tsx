"use client";

import { type FC, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const STEPS = [
  { key: "start", label: "Enter Address" },
  { key: "sign", label: "Sign Message" },
  { key: "submit", label: "Submit" },
  { key: "complete", label: "Complete" },
] as const;

export type WizardStepKey = (typeof STEPS)[number]["key"];

function getStepIndex(step: WizardStepKey): number {
  return STEPS.findIndex((s) => s.key === step);
}

export interface WizardLayoutProps {
  currentStep: WizardStepKey;
  title: string;
  description?: string;
  editUrl: string;
  children: ReactNode;
}

export const WizardLayout: FC<WizardLayoutProps> = ({
  currentStep,
  title,
  description,
  editUrl,
  children,
}) => {
  const activeStep = getStepIndex(currentStep);

  return (
    <Box component="div" sx={{ maxWidth: 700, mx: "auto" }}>
      <Box component="div" sx={{ mb: 3 }}>
        <Button
          component={Link}
          href={editUrl}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 2 }}
        >
          Cancel
        </Button>

        <Typography variant="h5" component="h1" gutterBottom>
          Add Verified Address
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((step) => (
            <Step key={step.key}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {description}
            </Typography>
          )}
          {children}
        </CardContent>
      </Card>
    </Box>
  );
};

import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export type AdminGateState =
  | { status: "disconnected"; connectionControl: ReactNode }
  | { status: "checking" }
  | { status: "failure"; onRetry: () => void }
  | { status: "denied" };

export function AdminGate({ state }: { state: AdminGateState }) {
  let title: string;
  let message: string;
  let control: ReactNode = null;
  let isFailure = false;

  switch (state.status) {
    case "disconnected":
      title = "Connect to manage the TEST gallery";
      message =
        "Connect a wallet so the marketplace can resolve its current owner.";
      control = state.connectionControl;
      break;
    case "checking":
      title = "Checking owner access";
      message = "Reading the current marketplace owner from Base Sepolia.";
      break;
    case "failure":
      title = "Could not check access";
      message =
        "The authority read failed. This is a read failure, not a confirmed access denial.";
      isFailure = true;
      control = (
        <Button
          type="button"
          variant="outlined"
          onClick={state.onRetry}
          sx={{ minHeight: 44 }}
        >
          Try again
        </Button>
      );
      break;
    case "denied":
      title = "Access denied";
      message = "This wallet is not the current marketplace owner.";
      break;
  }

  return (
    <Paper
      variant="outlined"
      sx={{ width: "100%", maxWidth: 640, mx: "auto", p: { xs: 3, sm: 4 } }}
      role={isFailure ? "alert" : "status"}
      aria-live={isFailure ? "assertive" : "polite"}
    >
      <Stack spacing={2} alignItems="flex-start">
        <Typography component="h2" variant="h5">
          {title}
        </Typography>
        <Typography color="text.secondary">{message}</Typography>
        {control}
      </Stack>
    </Paper>
  );
}

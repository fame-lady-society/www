"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { base } from "viem/chains";
import { WrappedLink } from "@/components/WrappedLink";
import type {
  PostFixBranch,
  SocietyNftReadinessProjection,
  VerifiedRepairProjection,
} from "../state";
import type { ReadinessTransactionState } from "../transactionState";
import {
  isReadinessTransactionPending,
  readinessTransactionStatusCopy,
} from "../transactionState";
import { useSocietyNftReadiness } from "../hooks/useSocietyNftReadiness";

export type SocietyNftReadinessSurface = "fame" | "swap";

export const SOCIETY_NFT_READINESS_DIALOG_TITLE_ID =
  "society-nft-readiness-dialog-title";
export const SOCIETY_NFT_READINESS_DIALOG_DESCRIPTION_ID =
  "society-nft-readiness-dialog-description";
const SOCIETY_NFT_READINESS_HEADING_ID = "society-nft-readiness-heading";

type VoidAction = () => void | Promise<unknown>;

export function shouldOpenSocietyNftReadinessDialog(
  transactionState: ReadinessTransactionState,
  verifiedRepair: VerifiedRepairProjection,
): verifiedRepair is Extract<VerifiedRepairProjection, { status: "verified" }> {
  return (
    transactionState.status === "confirmed" &&
    verifiedRepair.status === "verified"
  );
}

interface SocietyNftReadinessStatusProps {
  state: ReadinessTransactionState;
}

export function SocietyNftReadinessStatus({
  state,
}: SocietyNftReadinessStatusProps) {
  const copy = readinessTransactionStatusCopy(state);
  if (!copy) return null;

  const isError = state.status === "error";

  return (
    <Stack
      component="section"
      aria-label="Society NFT repair status"
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      spacing={0.5}
      sx={{
        borderInlineStart: "3px solid",
        borderColor: isError ? "error.main" : "divider",
        pl: 1.5,
      }}
    >
      <Typography variant="body2" fontWeight={700}>
        {copy.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {copy.detail}
      </Typography>
      {state.hash ? (
        <Typography variant="body2">
          <Link
            href={`${base.blockExplorers.default.url}/tx/${state.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            View transaction{" "}
            <OpenInNewIcon sx={{ fontSize: "0.85em", verticalAlign: -1 }} />
          </Link>
        </Typography>
      ) : null}
    </Stack>
  );
}

export interface SocietyNftReadinessRailViewProps {
  readiness: SocietyNftReadinessProjection;
  transactionState: ReadinessTransactionState;
  onRepair: VoidAction;
  onRetryDetection: VoidAction;
  onRetryVerification: VoidAction;
}

export function SocietyNftReadinessRailView({
  readiness,
  transactionState,
  onRepair,
  onRetryDetection,
  onRetryVerification,
}: SocietyNftReadinessRailViewProps) {
  const isRepairPending = isReadinessTransactionPending(transactionState);

  if (readiness.status === "error") {
    return (
      <Stack
        component="section"
        aria-label="Society NFT readiness check"
        role="status"
        aria-live="polite"
        spacing={1}
        sx={{
          width: "100%",
          borderBlock: 1,
          borderColor: "divider",
          py: 1.5,
        }}
      >
        <Typography variant="body2" fontWeight={700}>
          We couldn&apos;t check Society NFT settings.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The rest of the FAME experience is still available.
        </Typography>
        <Button
          type="button"
          variant="outlined"
          onClick={onRetryDetection}
          sx={{ minHeight: 44, alignSelf: "flex-start" }}
        >
          Retry readiness check
        </Button>
      </Stack>
    );
  }

  if (readiness.status !== "affected") return null;

  const verificationRetry =
    transactionState.status === "error" &&
    (transactionState.error?.kind === "verification_failed" ||
      transactionState.error?.kind === "verification_mismatch");
  const action = verificationRetry ? onRetryVerification : onRepair;
  const actionLabel = isRepairPending
    ? "Repair in progress"
    : transactionState.status === "error"
      ? verificationRetry
        ? "Try verification again"
        : "Try again"
      : "Enable Society NFT generation";

  return (
    <Stack
      component="aside"
      aria-labelledby={SOCIETY_NFT_READINESS_HEADING_ID}
      aria-busy={isRepairPending || undefined}
      spacing={2}
      sx={(theme) => ({
        width: "100%",
        borderBlock: 1,
        borderInlineStart: "4px solid",
        borderColor: "warning.main",
        backgroundColor: alpha(
          theme.palette.warning.main,
          theme.palette.mode === "dark" ? 0.14 : 0.08,
        ),
        px: { xs: 2, sm: 3 },
        py: 2.5,
      })}
    >
      <Stack spacing={1}>
        <Typography
          id={SOCIETY_NFT_READINESS_HEADING_ID}
          component="h2"
          variant="h6"
          fontWeight={800}
        >
          Society NFT generation is off for this wallet
        </Typography>
        <Typography variant="body2">
          Your account is a smart account. By default, smart accounts do not
          generate Society NFTs.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          While this setting is enabled, holding 1 million $FAME will not
          generate a Society NFT.
        </Typography>
      </Stack>

      <Button
        type="button"
        variant="contained"
        color="warning"
        disabled={isRepairPending}
        onClick={action}
        sx={{ minHeight: 44, alignSelf: "flex-start", fontWeight: 700 }}
      >
        {actionLabel}
      </Button>

      <SocietyNftReadinessStatus state={transactionState} />
    </Stack>
  );
}

export interface SocietyNftReadinessDialogContentProps {
  branch: PostFixBranch;
  surface: SocietyNftReadinessSurface;
  onDone: () => void;
  onContinue: () => void;
}

export function SocietyNftReadinessDialogContent({
  branch,
  surface,
  onDone,
  onContinue,
}: SocietyNftReadinessDialogContentProps) {
  return (
    <>
      <DialogTitle id={SOCIETY_NFT_READINESS_DIALOG_TITLE_ID}>
        Society NFT generation is enabled
      </DialogTitle>
      <DialogContent id={SOCIETY_NFT_READINESS_DIALOG_DESCRIPTION_ID}>
        {branch === "future" ? (
          <DialogContentText>
            Your wallet can now generate Society NFTs. Future qualifying $FAME
            receipts can generate Society NFTs for this wallet.
          </DialogContentText>
        ) : (
          <Stack spacing={1.5}>
            <DialogContentText>
              This change is not retroactive. Because this wallet already holds
              at least 1 million $FAME, it needs another FAME receipt to trigger
              Society NFT reconciliation.
            </DialogContentText>
            <DialogContentText>
              Receiving or self-transferring at least 1 wei of $FAME triggers
              that reconciliation.
            </DialogContentText>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {branch === "future" ? (
          <Button
            type="button"
            variant="contained"
            autoFocus
            onClick={onDone}
            sx={{ minHeight: 44 }}
          >
            Done
          </Button>
        ) : surface === "fame" ? (
          <Button
            component={WrappedLink}
            href="/fame/swap"
            variant="contained"
            autoFocus
            onClick={onContinue}
            sx={{ minHeight: 44 }}
          >
            Buy a tiny amount of $FAME
          </Button>
        ) : (
          <Button
            type="button"
            variant="contained"
            autoFocus
            onClick={onContinue}
            sx={{ minHeight: 44 }}
          >
            Continue to $FAME swap
          </Button>
        )}
      </DialogActions>
    </>
  );
}

export interface SocietyNftReadinessRailProps {
  surface: SocietyNftReadinessSurface;
  onSwapContinue?: () => void;
}

export function SocietyNftReadinessRail({
  surface,
  onSwapContinue,
}: SocietyNftReadinessRailProps) {
  const {
    account,
    readiness,
    transactionState,
    verifiedRepair,
    repair,
    retryDetection,
    retryVerification,
  } = useSocietyNftReadiness();
  const [dialogBranch, setDialogBranch] = useState<PostFixBranch | null>(null);
  const focusAnchorRef = useRef<HTMLSpanElement>(null);
  const focusAfterCloseRef = useRef(false);
  const repairVerified = shouldOpenSocietyNftReadinessDialog(
    transactionState,
    verifiedRepair,
  );

  useEffect(() => {
    setDialogBranch(null);
  }, [account]);

  useEffect(() => {
    if (repairVerified) {
      setDialogBranch(verifiedRepair.branch);
    }
  }, [repairVerified, verifiedRepair]);

  useEffect(() => {
    if (dialogBranch === null && focusAfterCloseRef.current) {
      focusAfterCloseRef.current = false;
      focusAnchorRef.current?.focus();
    }
  }, [dialogBranch]);

  const handleDone = useCallback(() => {
    focusAfterCloseRef.current = true;
    setDialogBranch(null);
  }, []);

  const handleContinue = useCallback(() => {
    setDialogBranch(null);
    if (surface === "swap") onSwapContinue?.();
  }, [onSwapContinue, surface]);

  return (
    <>
      {!repairVerified ? (
        <SocietyNftReadinessRailView
          readiness={readiness}
          transactionState={transactionState}
          onRepair={repair}
          onRetryDetection={retryDetection}
          onRetryVerification={retryVerification}
        />
      ) : null}

      <Dialog
        open={dialogBranch !== null}
        disableEscapeKeyDown
        disableRestoreFocus
        aria-labelledby={SOCIETY_NFT_READINESS_DIALOG_TITLE_ID}
        aria-describedby={SOCIETY_NFT_READINESS_DIALOG_DESCRIPTION_ID}
      >
        {dialogBranch ? (
          <SocietyNftReadinessDialogContent
            branch={dialogBranch}
            surface={surface}
            onDone={handleDone}
            onContinue={handleContinue}
          />
        ) : null}
      </Dialog>

      <Box
        component="span"
        ref={focusAnchorRef}
        tabIndex={-1}
        aria-label="Society NFT readiness update complete"
        sx={{
          position: "fixed",
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />
    </>
  );
}

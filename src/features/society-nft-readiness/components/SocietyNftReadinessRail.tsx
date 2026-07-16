"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Hash } from "viem";
import { base } from "viem/chains";
import type { ReconciledSocietyNft } from "../hooks/useSocietyNftReconciliation";
import { useSocietyNftReconciliation } from "../hooks/useSocietyNftReconciliation";
import type {
  PostFixBranch,
  SocietyNftReadinessProjection,
  VerifiedRepairProjection,
} from "../state";
import type { ReadinessTransactionState } from "../transactionState";
import {
  isReadinessTransactionPending,
  reconciliationTransactionStatusCopy,
  readinessTransactionStatusCopy,
  type ReadinessTransactionStatusCopy,
} from "../transactionState";
import { useSocietyNftReadiness } from "../hooks/useSocietyNftReadiness";

export type SocietyNftReadinessSurface = "fame" | "swap";

export const SOCIETY_NFT_READINESS_DIALOG_TITLE_ID =
  "society-nft-readiness-dialog-title";
export const SOCIETY_NFT_READINESS_DIALOG_DESCRIPTION_ID =
  "society-nft-readiness-dialog-description";
const SOCIETY_NFT_READINESS_HEADING_ID = "society-nft-readiness-heading";
const SOCIETY_NFT_GENERATION_SETTING_VISIBLE = false;

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

interface TransactionStatusPanelProps {
  ariaLabel: string;
  copy: ReadinessTransactionStatusCopy | null;
  state: ReadinessTransactionState;
}

function TransactionStatusPanel({
  ariaLabel,
  copy,
  state,
}: TransactionStatusPanelProps) {
  if (!copy) return null;

  const isError = state.status === "error";

  return (
    <Stack
      component="section"
      aria-label={ariaLabel}
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

interface SocietyNftReadinessStatusProps {
  state: ReadinessTransactionState;
}

export function SocietyNftReadinessStatus({
  state,
}: SocietyNftReadinessStatusProps) {
  return (
    <TransactionStatusPanel
      ariaLabel="Society NFT repair status"
      copy={readinessTransactionStatusCopy(state)}
      state={state}
    />
  );
}

function SocietyNftReconciliationStatus({
  state,
}: SocietyNftReadinessStatusProps) {
  return (
    <TransactionStatusPanel
      ariaLabel="Society NFT reconciliation status"
      copy={reconciliationTransactionStatusCopy(state)}
      state={state}
    />
  );
}

export interface SocietyNftGenerationSettingViewProps {
  generationEnabled: boolean;
  generationRefreshing?: boolean;
  transactionState: ReadinessTransactionState;
  offsetForHeader: boolean;
  onGenerationEnabledChange: (enabled: boolean) => void | Promise<unknown>;
  showTransactionStatus?: boolean;
}

export function SocietyNftGenerationSettingView({
  generationEnabled,
  generationRefreshing = false,
  transactionState,
  offsetForHeader,
  onGenerationEnabledChange,
  showTransactionStatus = true,
}: SocietyNftGenerationSettingViewProps) {
  const pending =
    isReadinessTransactionPending(transactionState) || generationRefreshing;

  return (
    <Stack
      component="section"
      aria-label="Society NFT generation setting"
      spacing={1}
      sx={{
        width: "100%",
        mt: offsetForHeader ? { xs: 7, sm: 8 } : 0,
        borderBlockEnd: 1,
        borderColor: "divider",
        px: { xs: 2, sm: 3 },
        py: 2,
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={generationEnabled}
            disabled={pending}
            onChange={(_, checked) => onGenerationEnabledChange(checked)}
            inputProps={{ "aria-label": "Generate Society NFTs" }}
          />
        }
        label={<Typography fontWeight={700}>Generate Society NFTs</Typography>}
      />
      <Typography variant="body2" color="text.secondary">
        On calls setSkipNFT(false). Off calls setSkipNFT(true). This setting is
        available because the connected wallet is a smart account.
      </Typography>
      {showTransactionStatus ? (
        <SocietyNftReadinessStatus state={transactionState} />
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
          mt: { xs: 7, sm: 8 },
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
    transactionState.error?.kind === "verification_failed";
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
        mt: { xs: 7, sm: 8 },
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
          Until this setting is enabled, holding 1 million $FAME will not
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
  nftDeficit: bigint;
  reconciliationState: ReadinessTransactionState;
  onDone: () => void;
  onReconcile: VoidAction;
}

export function SocietyNftReadinessDialogContent({
  branch,
  nftDeficit,
  reconciliationState,
  onDone,
  onReconcile,
}: SocietyNftReadinessDialogContentProps) {
  const reconciliationPending =
    isReadinessTransactionPending(reconciliationState);
  const mintNotDetected =
    reconciliationState.status === "error" &&
    reconciliationState.error?.kind === "mint_not_detected";
  const nftLabel = `${nftDeficit.toString()} Society NFT${
    nftDeficit === 1n ? "" : "s"
  }`;

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
        ) : branch === "current" ? (
          <DialogContentText>
            Your existing Society NFT balance already matches this wallet&apos;s
            current $FAME balance. Your wallet is ready for future qualifying
            $FAME receipts.
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
            <DialogContentText>
              Based on the current balances, {nftLabel} can be generated.
            </DialogContentText>
            <SocietyNftReconciliationStatus state={reconciliationState} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {branch !== "catch_up" || mintNotDetected ? (
          <Button
            type="button"
            variant="contained"
            autoFocus
            onClick={onDone}
            sx={{ minHeight: 44 }}
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="text"
              disabled={reconciliationPending}
              onClick={onDone}
              sx={{ minHeight: 44 }}
            >
              Not now
            </Button>
            <Button
              type="button"
              variant="contained"
              autoFocus
              disabled={reconciliationPending}
              onClick={onReconcile}
              sx={{ minHeight: 44 }}
            >
              {reconciliationState.status === "error"
                ? "Try 1 wei transfer again"
                : "Transfer 1 wei to myself"}
            </Button>
          </>
        )}
      </DialogActions>
    </>
  );
}

export interface SocietyNftMintedDialogContentProps {
  hash: Hash;
  nfts: ReconciledSocietyNft[];
  onDone: () => void;
}

export function SocietyNftMintedDialogContent({
  hash,
  nfts,
  onDone,
}: SocietyNftMintedDialogContentProps) {
  const plural = nfts.length !== 1;

  return (
    <>
      <DialogTitle id="society-nft-minted-dialog-title">
        Your Society NFT{plural ? "s" : ""} arrived
      </DialogTitle>
      <DialogContent id="society-nft-minted-dialog-description">
        <Stack spacing={2.5}>
          <DialogContentText>
            The 1 wei self-transfer generated {nfts.length} Society NFT
            {plural ? "s" : ""} for this wallet.
          </DialogContentText>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {nfts.map(({ tokenId, metadata }) => (
              <article className="min-w-0 space-y-2" key={tokenId.toString()}>
                <div className="relative aspect-square overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
                  <Image
                    src={metadata.image}
                    alt={metadata.name ?? `Society NFT #${tokenId}`}
                    fill
                    sizes="(max-width: 599px) calc(100vw - 48px), 280px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <Typography fontWeight={700}>
                  {metadata.name ?? `Society NFT #${tokenId}`}
                </Typography>
              </article>
            ))}
          </div>
          <Link
            href={`${base.blockExplorers.default.url}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            View generation transaction{" "}
            <OpenInNewIcon sx={{ fontSize: "0.85em", verticalAlign: -1 }} />
          </Link>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          type="button"
          variant="contained"
          autoFocus
          onClick={onDone}
          sx={{ minHeight: 44 }}
        >
          Done
        </Button>
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
    codeBearingWallet,
    generationEnabled,
    generationRefreshing,
    readiness,
    transactionState,
    verifiedRepair,
    repair,
    setGenerationEnabled,
    retryDetection,
    retryVerification,
  } = useSocietyNftReadiness();
  const {
    transactionState: reconciliationState,
    nfts: reconciledNfts,
    selfTransfer,
    reset: resetReconciliation,
  } = useSocietyNftReconciliation();
  const [dialogRepair, setDialogRepair] = useState<{
    branch: PostFixBranch;
    nftDeficit: bigint;
  } | null>(null);
  const focusAnchorRef = useRef<HTMLSpanElement>(null);
  const focusAfterCloseRef = useRef(false);
  const repairVerified = shouldOpenSocietyNftReadinessDialog(
    transactionState,
    verifiedRepair,
  );
  const mintedDialogOpen =
    reconciliationState.status === "confirmed" &&
    reconciliationState.hash !== null &&
    reconciledNfts.length > 0;

  useEffect(() => {
    setDialogRepair(null);
  }, [account]);

  useEffect(() => {
    if (repairVerified) {
      setDialogRepair({
        branch: verifiedRepair.branch,
        nftDeficit: verifiedRepair.nftDeficit,
      });
    }
  }, [repairVerified, verifiedRepair]);

  useEffect(() => {
    if (mintedDialogOpen) setDialogRepair(null);
  }, [mintedDialogOpen]);

  useEffect(() => {
    if (
      dialogRepair === null &&
      !mintedDialogOpen &&
      focusAfterCloseRef.current
    ) {
      focusAfterCloseRef.current = false;
      if (surface === "swap") {
        onSwapContinue?.();
      } else {
        focusAnchorRef.current?.focus();
      }
    }
  }, [dialogRepair, mintedDialogOpen, onSwapContinue, surface]);

  const handleDone = useCallback(() => {
    focusAfterCloseRef.current = true;
    resetReconciliation();
    setDialogRepair(null);
  }, [resetReconciliation]);

  const handleMintedDone = useCallback(() => {
    focusAfterCloseRef.current = true;
    resetReconciliation();
  }, [resetReconciliation]);

  const settingVisible =
    SOCIETY_NFT_GENERATION_SETTING_VISIBLE &&
    surface === "fame" &&
    codeBearingWallet &&
    generationEnabled !== null;
  const railVisible = !repairVerified && readiness.status !== "unaffected";

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

      {settingVisible ? (
        <SocietyNftGenerationSettingView
          generationEnabled={generationEnabled}
          generationRefreshing={generationRefreshing}
          transactionState={transactionState}
          offsetForHeader={!railVisible}
          onGenerationEnabledChange={setGenerationEnabled}
          showTransactionStatus={readiness.status !== "affected"}
        />
      ) : null}

      <Dialog
        open={dialogRepair !== null && !mintedDialogOpen}
        disableEscapeKeyDown
        disableRestoreFocus
        aria-labelledby={SOCIETY_NFT_READINESS_DIALOG_TITLE_ID}
        aria-describedby={SOCIETY_NFT_READINESS_DIALOG_DESCRIPTION_ID}
      >
        {dialogRepair ? (
          <SocietyNftReadinessDialogContent
            branch={dialogRepair.branch}
            nftDeficit={dialogRepair.nftDeficit}
            reconciliationState={reconciliationState}
            onDone={handleDone}
            onReconcile={selfTransfer}
          />
        ) : null}
      </Dialog>

      <Dialog
        open={mintedDialogOpen}
        disableEscapeKeyDown
        disableRestoreFocus
        fullWidth
        maxWidth="sm"
        aria-labelledby="society-nft-minted-dialog-title"
        aria-describedby="society-nft-minted-dialog-description"
      >
        {reconciliationState.hash && reconciledNfts.length > 0 ? (
          <SocietyNftMintedDialogContent
            hash={reconciliationState.hash}
            nfts={reconciledNfts}
            onDone={handleMintedDone}
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

"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import SyncIcon from "@mui/icons-material/Sync";
import { mainnet, sepolia, baseSepolia } from "viem/chains";
import { WalletConnectButton } from "@/components/WalletConnectControl";
import { useIdentitySync, type SyncStage } from "../hooks/useIdentitySync";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import type { PendingIdentityBurn } from "../services/identitySync";

const statusText: Partial<Record<SyncStage, string>> = {
  checking: "Checking this identity and simulating sync…",
  preparing: "Rechecking ownership and preparing your transaction…",
  signing: "Confirm the sync transaction in your wallet.",
  confirming: "Transaction submitted. Waiting for confirmation…",
  refreshing: "Refreshing the profile…",
};

function IdentityBurnDetails({
  burn,
  explorer,
}: {
  burn: PendingIdentityBurn;
  explorer: string;
}) {
  return (
    <Box
      component="div"
      sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}
    >
      <Box
        component="div"
        sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
      >
        <Avatar
          src={`https://fame.support/fls/thumb/${burn.primaryTokenId}`}
          sx={{ width: 48, height: 48 }}
        />
        <Box component="div">
          <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>
            {burn.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Identity #{burn.tokenId.toString()} · FLS PFP #
            {burn.primaryTokenId.toString()}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        The bound FLS PFP is currently owned by{" "}
        <Link
          href={`${explorer}/address/${burn.tokenOwner}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ overflowWrap: "anywhere" }}
        >
          {burn.tokenOwner}
        </Link>
        .
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        This wallet is not a verified address for this identity. Calling Sync
        will burn the identity NFT, release its name, and remove its linked
        addresses and metadata.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Identity controlled by{" "}
        <Link
          href={`${explorer}/address/${burn.primaryAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ overflowWrap: "anywhere" }}
        >
          {burn.primaryAddress}
        </Link>
        . The FLS PFP NFT remains in its current wallet.
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1 }}
      >
        Checked at block{" "}
        <Link
          href={`${explorer}/block/${burn.blockNumber}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {burn.blockNumber.toString()}
        </Link>
        . Ownership will be checked again before submission.
      </Typography>
    </Box>
  );
}

export function IdentitySyncButton({
  network,
  tokenId,
  refreshProfile,
}: {
  network: NetworkType;
  tokenId: bigint;
  refreshProfile: (minimumBlock?: bigint) => Promise<void>;
}) {
  const sync = useIdentitySync(network, tokenId, refreshProfile);
  const chain =
    network === "mainnet"
      ? mainnet
      : network === "sepolia"
        ? sepolia
        : baseSepolia;
  const explorer = chain.blockExplorers.default.url;
  const submitLabel =
    sync.confirmedBlock !== undefined
      ? "Retry refresh"
      : sync.hash
        ? "Retry receipt check"
        : "Confirm burn";

  return (
    <>
      <Button
        variant="text"
        size="small"
        onClick={() => void sync.start()}
        disabled={sync.open}
        aria-label="Sync identity"
        startIcon={<SyncIcon />}
        sx={{ color: "text.secondary", textTransform: "none", minWidth: 0 }}
      >
        Sync
      </Button>
      <Dialog
        open={sync.open}
        onClose={sync.cancel}
        maxWidth="sm"
        fullWidth
        aria-labelledby="identity-sync-title"
      >
        <DialogTitle id="identity-sync-title">
          {sync.burn ? "Confirm identity sync" : "Sync identity"}
        </DialogTitle>
        <DialogContent>
          {sync.burn && (
            <IdentityBurnDetails burn={sync.burn} explorer={explorer} />
          )}
          {sync.busy && (
            <Box
              component="div"
              sx={{ mt: 2 }}
              role="status"
              aria-live="polite"
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                {statusText[sync.stage]}
              </Typography>
              <LinearProgress aria-label="Sync transaction progress" />
            </Box>
          )}
          {sync.hash && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              <Link
                href={`${explorer}/tx/${sync.hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction
              </Link>
            </Typography>
          )}
          {sync.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {sync.error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={sync.cancel}>
            {sync.busy && sync.stage !== "checking" ? "Close" : "Cancel"}
          </Button>
          {!sync.burn ? (
            <Button onClick={() => void sync.start()} disabled={sync.busy}>
              Retry check
            </Button>
          ) : !sync.address &&
            !sync.hash &&
            sync.confirmedBlock === undefined ? (
            <WalletConnectButton disabled={sync.busy}>
              Connect wallet to confirm
            </WalletConnectButton>
          ) : (
            <Button
              variant="contained"
              color="warning"
              onClick={() => void sync.submit()}
              disabled={sync.busy}
              startIcon={
                sync.busy ? (
                  <CircularProgress color="inherit" size={16} />
                ) : undefined
              }
            >
              {submitLabel}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

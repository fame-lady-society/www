"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { TransactionsModal } from "@/components/TransactionsModal";
import { displaySafeErrorMessage } from "@/features/fame-swap/solver/diagnostics";
import { useCallback, type ReactNode } from "react";
import NextLink from "next/link";
import { baseSepolia } from "viem/chains";
import { usePageAttentionRefresh } from "@/features/society-nft-auction/hooks/usePageAttentionRefresh";
import { useGalleryDiscovery } from "../hooks/useGalleryDiscovery";
import { formatTestAmount } from "../format";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import { useGalleryPurchase } from "../hooks/useGalleryPurchase";
import type { GalleryPurchaseState } from "../transactions/purchaseQueue";
import { AcquiredNftResult } from "./AcquiredNftResult";
import { ListingCard } from "./ListingCard";

export type GalleryViewContentState =
  | { status: "loading" }
  | { status: "failure"; message: string }
  | { status: "empty" }
  | { status: "ready" }
  | { status: "incomplete" };

export function GalleryViewContent({
  state,
  onRefresh,
  children,
}: {
  state: GalleryViewContentState;
  onRefresh?: () => void;
  children?: ReactNode;
}) {
  if (state.status === "loading") {
    return (
      <Paper variant="outlined" sx={{ p: 4 }} role="status" aria-live="polite">
        <Typography component="h2" variant="h5">
          Loading TEST gallery…
        </Typography>
      </Paper>
    );
  }
  if (state.status === "failure") {
    return (
      <Alert
        severity="error"
        role="alert"
        action={
          onRefresh ? (
            <Button
              type="button"
              color="inherit"
              onClick={onRefresh}
              sx={{ minHeight: 44 }}
            >
              Try again
            </Button>
          ) : undefined
        }
      >
        {state.message}
      </Alert>
    );
  }
  if (state.status === "empty") {
    return (
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography component="h2" variant="h5">
          No active TEST listings
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Discovery completed and no gallery-owned token is currently listed.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {state.status === "incomplete" ? (
        <Alert
          severity="warning"
          action={
            onRefresh ? (
              <Button
                type="button"
                color="inherit"
                onClick={onRefresh}
                sx={{ minHeight: 44 }}
              >
                Retry catch-up
              </Button>
            ) : undefined
          }
        >
          Discovery is incomplete. Only listings revalidated against current
          contract state are shown.
        </Alert>
      ) : null}
      {children}
    </Stack>
  );
}

function purchaseStatusCopy(state: GalleryPurchaseState) {
  switch (state.status) {
    case "idle":
      return "Choose a listing to begin.";
    case "preparing":
      return "Reading current TEST price and allowance…";
    case "switching_chain":
      return "Switching your wallet to Base Sepolia…";
    case "simulating":
      return state.transactionKind === "approval"
        ? "Checking the exact TEST approval…"
        : "Checking the gallery purchase with the contract…";
    case "awaiting_wallet":
      return state.transactionKind === "approval"
        ? "Approve the exact TEST total in your wallet."
        : "Confirm the gallery purchase in your wallet.";
    case "confirming_approval":
      return "Waiting for the TEST approval to be confirmed…";
    case "approval_confirmed":
      return `Approval confirmed ${state.approvalConfirmations} block${
        state.approvalConfirmations === 1 ? "" : "s"
      } deep.`;
    case "confirming_fill":
      return "Waiting for the gallery purchase to be confirmed…";
    case "fill_receipt_confirmed":
      return "Gallery purchase confirmed. Verifying what you acquired…";
    case "verifying":
      return "Verifying the receipt events and receipt-block contract state…";
    case "verified":
      return "Purchase verified.";
    case "confirmed_refreshing":
      return "The fill is confirmed. Follow-up contract reads are still unavailable, so verification can be retried.";
    case "confirmed_unverified":
      return (
        state.unverifiedReason ??
        "The fill is confirmed, but its acquisition proof did not reconcile."
      );
    case "outcome_unknown":
      return "The transaction was broadcast, but its receipt could not be confirmed. Check the explorer before trying again.";
    case "error":
      return state.failure
        ? displaySafeErrorMessage(state.failure.cause)
        : "The gallery transaction failed.";
  }
}

export function GalleryPurchaseModalContent({
  state,
  onDone,
  onRetryVerification,
}: {
  state: GalleryPurchaseState;
  onDone: () => void;
  onRetryVerification: () => void;
}) {
  const terminal =
    state.status === "verified" ||
    state.status === "confirmed_refreshing" ||
    state.status === "confirmed_unverified" ||
    state.status === "outcome_unknown" ||
    state.status === "error";
  const severity =
    state.status === "error"
      ? "error"
      : state.status === "verified"
        ? "success"
        : state.status === "outcome_unknown" ||
            state.status === "confirmed_refreshing" ||
            state.status === "confirmed_unverified"
        ? "warning"
        : "info";

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Alert severity={severity}>{purchaseStatusCopy(state)}</Alert>
      {state.status === "verified" && state.acquiredNft ? (
        <AcquiredNftResult result={state.acquiredNft} />
      ) : null}
      {state.fingerprint ? (
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            Token #{state.fingerprint.tokenId.toString()} to{" "}
            {state.fingerprint.recipient}
          </Typography>
          <Typography variant="body2">
            Exact total: {formatTestAmount(state.fingerprint.total)} TEST
          </Typography>
        </Stack>
      ) : null}
      {state.approvalHash ? (
        <Link
          href={`${baseSepolia.blockExplorers.default.url}/tx/${state.approvalHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View TEST approval
        </Link>
      ) : null}
      {state.fillHash ? (
        <Link
          href={`${baseSepolia.blockExplorers.default.url}/tx/${state.fillHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View gallery purchase
        </Link>
      ) : null}
      {terminal ? (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {state.status === "confirmed_refreshing" ? (
            <Button
              type="button"
              variant="contained"
              onClick={onRetryVerification}
            >
              Retry verification
            </Button>
          ) : null}
          <Button type="button" variant="outlined" onClick={onDone}>
            Done
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}

export function GalleryView() {
  const global = useGalleryGlobalState();
  const discovery = useGalleryDiscovery();
  const purchase = useGalleryPurchase();
  const refresh = useCallback(async () => {
    await Promise.all([global.refresh(), discovery.refresh()]);
  }, [discovery, global]);

  usePageAttentionRefresh(refresh);

  let state: GalleryViewContentState;
  let listings: ReactNode = null;
  if (
    global.projection.status === "idle" ||
    global.projection.status === "loading" ||
    discovery.projection.status === "loading"
  ) {
    state = { status: "loading" };
  } else if (global.projection.status === "failure") {
    state = { status: "failure", message: global.projection.message };
  } else if (discovery.projection.status === "failure") {
    state = { status: "failure", message: discovery.projection.message };
  } else if (
    discovery.projection.status === "complete" &&
    discovery.projection.activeTokenIds.length === 0
  ) {
    state = { status: "empty" };
  } else {
    const unit = global.projection.data.unit;
    state = {
      status:
        discovery.projection.status === "discovery_incomplete"
          ? "incomplete"
          : "ready",
    };
    listings =
      discovery.projection.activeTokenIds.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {discovery.projection.activeTokenIds.map((tokenId) => (
            <ListingCard
              key={tokenId.toString()}
              tokenId={tokenId}
              unit={unit}
              onBuy={(exactTokenId, recipient) => {
                void purchase.start(exactTokenId, recipient).then((result) => {
                  if (
                    result.status === "verified" ||
                    result.status === "confirmed_refreshing" ||
                    result.status === "confirmed_unverified"
                  ) {
                    return refresh();
                  }
                });
              }}
            />
          ))}
        </div>
      ) : (
        <Typography color="text.secondary">
          No currently verified active listing is available.
        </Typography>
      );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}
    >
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "flex-end" }}
          spacing={2}
        >
          <div>
            <Typography component="h1" variant="h3">
              TEST gallery
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>
              Buy Society NFTs from the deployed Base Sepolia gallery using
              TEST. Wallet connection is only needed when you buy.
            </Typography>
          </div>
          <Button
            component={NextLink}
            href="/fame/gallery/test/admin"
            variant="text"
          >
            Open admin
          </Button>
        </Stack>

        {purchase.state.status !== "idle" && !purchase.modalOpen ? (
          <Button
            type="button"
            variant="outlined"
            onClick={() => purchase.setModalOpen(true)}
            sx={{ alignSelf: "flex-start" }}
          >
            View purchase
          </Button>
        ) : null}

        <GalleryViewContent
          state={state}
          onRefresh={() => void refresh().catch(() => undefined)}
        >
          {listings}
        </GalleryViewContent>
      </Stack>
      <TransactionsModal
        open={purchase.modalOpen}
        onClose={() => purchase.setModalOpen(false)}
        transactions={purchase.transactions}
        onTransactionConfirmed={() => undefined}
        topContent={
          <GalleryPurchaseModalContent
            state={purchase.state}
            onRetryVerification={() => {
              void purchase.retryVerification().finally(() => refresh());
            }}
            onDone={() => {
              purchase.reset();
              purchase.setModalOpen(false);
            }}
          />
        }
      />
    </Container>
  );
}

"use client";

import MenuList from "@mui/material/MenuList";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ConnectKitButton } from "connectkit";
import { useState, type ReactNode } from "react";
import { base } from "viem/chains";
import { useBalance, useSwitchChain } from "wagmi";
import { DefaultProvider } from "@/context/default";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { Main } from "@/layouts/Main";
import { validateBidAmount } from "../state";
import type { AuctionActiveProjection, AuctionEndedProjection } from "../types";
import { auctionBidFormAfterResult } from "../transactionState";
import { useAuctionClock } from "../hooks/useAuctionClock";
import { useAuctionExecutionEnvironment } from "../hooks/useAuctionExecutionEnvironment";
import { useAuctionTransaction } from "../hooks/useAuctionTransaction";
import { useSocietyNftAuction } from "../hooks/useSocietyNftAuction";
import {
  AuctionActionPanel,
  type AuctionActionWalletStatus,
} from "./AuctionActionPanel";
import { AuctionFameLiquidValue } from "./AuctionFameLiquidValue";
import { AuctionHero } from "./AuctionHero";
import { AuctionTransactionStatus } from "./AuctionTransactionStatus";

function isActionProjection(
  projection: ReturnType<typeof useSocietyNftAuction>["projection"],
): projection is AuctionActiveProjection | AuctionEndedProjection {
  return projection.kind === "active" || projection.kind === "ended_unsettled";
}

function SocietyNftAuctionExperience() {
  const auction = useSocietyNftAuction();
  const actionProjection = isActionProjection(auction.projection)
    ? auction.projection
    : null;
  const clock = useAuctionClock({
    blockTimestamp: auction.blockTimestamp,
    endTime: actionProjection?.endTime ?? null,
    canonicalCanBid: auction.projection.canBid,
    canonicalCanSettle: auction.projection.canSettle,
    refresh: auction.refresh,
  });
  const execution = useAuctionExecutionEnvironment({
    auctionAddress: actionProjection?.auctionAddress ?? null,
    expectedSocietyNft: actionProjection?.societyNft ?? null,
  });
  const walletBalance = useBalance({
    address: execution.account,
    chainId: base.id,
    query: { enabled: execution.environment.status === "ready" },
  });
  const transaction = useAuctionTransaction({
    auctionAddress: actionProjection?.auctionAddress ?? null,
    account: execution.account,
    executionReady:
      execution.environment.canExecute &&
      !auction.isRefreshing &&
      (clock.canBid || clock.canSettle),
    verifyEnvironment: execution.verify,
    refresh: auction.refresh,
  });
  const {
    switchChainAsync,
    isPending: isSwitching,
    error: switchChainError,
  } = useSwitchChain();
  const [bidValue, setBidValue] = useState("");
  const [bidTouched, setBidTouched] = useState(false);
  const minimumNextBid =
    auction.minimumNextBid.status === "ready"
      ? auction.minimumNextBid.value
      : null;

  const bidValidation =
    actionProjection?.kind === "active" && minimumNextBid !== null
      ? validateBidAmount(bidValue, minimumNextBid)
      : null;
  const bidError =
    bidTouched && bidValidation && !bidValidation.valid
      ? bidValidation.message
      : null;

  let walletStatus: AuctionActionWalletStatus;
  switch (execution.environment.status) {
    case "disconnected":
      walletStatus = "disconnected";
      break;
    case "wrong_chain":
      walletStatus = "wrong_chain";
      break;
    case "checking":
      walletStatus = "checking";
      break;
    case "ready":
      walletStatus = "ready";
      break;
    default:
      walletStatus = "blocked";
  }

  const walletMessage =
    switchChainError && execution.environment.status === "wrong_chain"
      ? "The Base network switch was not completed. Try again."
      : actionProjection?.kind === "ended_unsettled" &&
          execution.environment.status === "disconnected"
        ? "Connect your wallet to settle."
        : execution.environment.message;

  let walletControl: ReactNode = undefined;
  switch (execution.environment.status) {
    case "disconnected":
      walletControl = <ConnectKitButton />;
      break;
    case "wrong_chain":
      walletControl = (
        <Button
          type="button"
          variant="outlined"
          disabled={isSwitching}
          onClick={() =>
            void switchChainAsync({ chainId: base.id }).catch(() => undefined)
          }
          sx={{ minHeight: 44 }}
        >
          {isSwitching ? "Switching to Base…" : "Switch to Base"}
        </Button>
      );
      break;
    case "error":
    case "incompatible":
      walletControl = (
        <Button
          type="button"
          variant="outlined"
          onClick={() => void execution.retry()}
          sx={{ minHeight: 44 }}
        >
          Check again
        </Button>
      );
      break;
  }

  const submitBid = async () => {
    setBidTouched(true);
    if (!bidValidation?.valid) return;

    let prepared;
    try {
      prepared = await auction.prepareAction();
    } catch {
      return;
    }
    if (prepared.projection.kind !== "active") {
      return;
    }
    if (prepared.minimumNextBid === null) {
      return;
    }

    const preparedValidation = validateBidAmount(
      bidValue,
      prepared.minimumNextBid,
    );
    if (!preparedValidation.valid) {
      return;
    }

    const result = await transaction.submitBid(preparedValidation.wei);
    if (result.status === "confirmed") {
      await walletBalance.refetch();
    }
    const next = auctionBidFormAfterResult(
      { value: bidValue, touched: true },
      result.status,
    );
    setBidValue(next.value);
    setBidTouched(next.touched);
  };

  const settleAuction = async () => {
    try {
      const prepared = await auction.prepareAction();
      if (prepared.projection.kind !== "ended_unsettled") return;
      await transaction.settle();
    } catch {
      // The canonical refresh updates the page failure state when it fails.
    }
  };

  const retryTransaction = async () => {
    if (transaction.state.error?.kind !== "refresh_failure") {
      transaction.reset();
      return;
    }

    try {
      await auction.refresh();
      transaction.confirmAfterRefresh();
      setBidValue("");
      setBidTouched(false);
      await walletBalance.refetch().catch(() => undefined);
    } catch {
      // Keep the refresh failure visible and retryable.
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6, md: 8 } }}
    >
      <Stack spacing={{ xs: 4, md: 5 }}>
        <AuctionHero
          projection={auction.projection}
          metadata={auction.metadata}
          remainingSeconds={clock.remainingSeconds}
          isRefreshing={auction.isRefreshing}
          liquidValue={<AuctionFameLiquidValue />}
          onRefresh={
            auction.config.status === "configured"
              ? () => void auction.refresh().catch(() => undefined)
              : undefined
          }
        />

        {actionProjection ? (
          <Stack spacing={2} sx={{ width: "100%", maxWidth: 520, ml: "auto" }}>
            <AuctionActionPanel
              projection={actionProjection}
              bidValue={bidValue}
              bidError={bidError}
              balanceWei={
                execution.environment.status === "ready"
                  ? walletBalance.data?.value ?? null
                  : null
              }
              minimumNextBid={auction.minimumNextBid}
              walletStatus={walletStatus}
              walletMessage={walletMessage}
              walletControl={walletControl}
              canBid={clock.canBid && minimumNextBid !== null}
              canSettle={clock.canSettle}
              isPending={transaction.isPending || isSwitching}
              isRefreshing={auction.isRefreshing}
              onBidValueChange={(value) => {
                setBidTouched(true);
                setBidValue(value);
              }}
              onBid={() => void submitBid()}
              onSettle={() => void settleAuction()}
              onRefresh={() => void auction.refresh().catch(() => undefined)}
            />
          </Stack>
        ) : null}
        <Stack sx={{ width: "100%", maxWidth: 520, ml: "auto" }}>
          <AuctionTransactionStatus
            state={transaction.state}
            onRetry={() => void retryTransaction()}
            onReset={transaction.reset}
          />
        </Stack>
      </Stack>
    </Container>
  );
}

export function SocietyNftAuctionPage() {
  return (
    <DefaultProvider base>
      <Main
        menu={
          <MenuList dense disablePadding>
            <LinksMenuItems />
            <SiteMenu />
          </MenuList>
        }
        title={
          <Typography variant="h5" component="h1" marginLeft={2}>
            Society NFT auction
          </Typography>
        }
      >
        <SocietyNftAuctionExperience />
      </Main>
    </DefaultProvider>
  );
}

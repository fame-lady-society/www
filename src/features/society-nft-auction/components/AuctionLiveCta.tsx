"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { base } from "viem/chains";
import { useBlock } from "wagmi";
import { WrappedLink } from "@/components/WrappedLink";
import {
  useReadSocietyNftAuctionEndTime,
  useReadSocietyNftAuctionLifecycle,
  useWatchSocietyNftAuctionAuctionStartedEvent,
  useWatchSocietyNftAuctionAuctionSettledEvent,
} from "@/wagmi";
import { getSocietyNftAuctionConfig } from "../config";
import type { SocietyNftAuctionLifecycle } from "../types";

const ACTIVE_AUCTION_LIFECYCLE: SocietyNftAuctionLifecycle = 1;

type AuctionLiveCtaState = {
  deadlineReached: boolean;
  blockWatcherEnabled: boolean;
  startWatcherEnabled: boolean;
  settlementWatcherEnabled: boolean;
};

type DeadlineObservation = {
  endTime: bigint | undefined;
  reached: boolean;
};

export function deriveAuctionLiveCtaState({
  configured,
  lifecycle,
  endTime,
  blockTimestamp,
  retainedDeadlineReached = false,
}: {
  configured: boolean;
  lifecycle: number | undefined;
  endTime: bigint | undefined;
  blockTimestamp: bigint | undefined;
  retainedDeadlineReached?: boolean;
}): AuctionLiveCtaState {
  const deadlineReached =
    lifecycle === ACTIVE_AUCTION_LIFECYCLE &&
    endTime !== undefined &&
    (retainedDeadlineReached ||
      (blockTimestamp !== undefined && blockTimestamp >= endTime));
  const activeBeforeDeadline =
    configured &&
    lifecycle === ACTIVE_AUCTION_LIFECYCLE &&
    !deadlineReached;

  return {
    deadlineReached,
    blockWatcherEnabled: activeBeforeDeadline,
    startWatcherEnabled: configured && lifecycle === 0,
    settlementWatcherEnabled: activeBeforeDeadline,
  };
}

export function isAuctionLive(
  lifecycle: number | undefined,
  endTime: bigint | undefined,
  blockTimestamp: bigint | undefined,
): boolean {
  return (
    lifecycle === ACTIVE_AUCTION_LIFECYCLE &&
    endTime !== undefined &&
    blockTimestamp !== undefined &&
    blockTimestamp < endTime
  );
}

export function AuctionLiveCtaView() {
  return (
    <Box
      component="aside"
      aria-label="Live Society NFT auction"
      sx={{
        borderBlock: 1,
        borderColor: "divider",
        py: 2,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
        alignItems: "center",
        gap: 2,
      }}
    >
      <div>
        <Typography variant="overline" component="p">
          Auction live
        </Typography>
        <Typography variant="h6" component="p" fontWeight={700}>
          The Number One Ranked Fame Lady
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Place your bid before the auction closes.
        </Typography>
      </div>
      <Button
        component={WrappedLink}
        href="/fame/auction"
        endIcon={<ArrowForwardIcon />}
        sx={{ minHeight: 44, fontWeight: 700, flexShrink: 0 }}
      >
        View live auction
      </Button>
    </Box>
  );
}

export function AuctionLiveCta() {
  const config = getSocietyNftAuctionConfig();
  const address = config.status === "configured" ? config.address : undefined;
  const configured = address !== undefined;
  const { data: lifecycle, refetch: refetchLifecycle } =
    useReadSocietyNftAuctionLifecycle({
      address,
      chainId: base.id,
      query: { enabled: configured },
    });
  const { data: endTime, refetch: refetchEndTime } =
    useReadSocietyNftAuctionEndTime({
      address,
      chainId: base.id,
      query: { enabled: configured },
    });
  const [deadlineObservation, setDeadlineObservation] =
    useState<DeadlineObservation>({ endTime: undefined, reached: false });
  const retainedDeadlineReached =
    deadlineObservation.endTime === endTime && deadlineObservation.reached;
  const stateBeforeBlock = deriveAuctionLiveCtaState({
    configured,
    lifecycle,
    endTime,
    blockTimestamp: undefined,
    retainedDeadlineReached,
  });
  const block = useBlock({
    chainId: base.id,
    watch: stateBeforeBlock.blockWatcherEnabled,
    query: { enabled: stateBeforeBlock.blockWatcherEnabled },
  });
  const state = deriveAuctionLiveCtaState({
    configured,
    lifecycle,
    endTime,
    blockTimestamp: block.data?.timestamp,
    retainedDeadlineReached,
  });

  useEffect(() => {
    setDeadlineObservation((current) => {
      if (lifecycle !== ACTIVE_AUCTION_LIFECYCLE || endTime === undefined) {
        return current.endTime === endTime && !current.reached
          ? current
          : { endTime, reached: false };
      }

      const reached =
        (current.endTime === endTime && current.reached) ||
        (block.data?.timestamp !== undefined &&
          block.data.timestamp >= endTime);
      return current.endTime === endTime && current.reached === reached
        ? current
        : { endTime, reached };
    });
  }, [block.data?.timestamp, endTime, lifecycle]);

  const refresh = useCallback(() => {
    void Promise.all([
      refetchLifecycle({ cancelRefetch: false }),
      refetchEndTime({ cancelRefetch: false }),
    ]).catch(() => undefined);
  }, [refetchEndTime, refetchLifecycle]);
  useWatchSocietyNftAuctionAuctionStartedEvent({
    address,
    chainId: base.id,
    enabled: state.startWatcherEnabled,
    onLogs: refresh,
  });
  useWatchSocietyNftAuctionAuctionSettledEvent({
    address,
    chainId: base.id,
    enabled: state.settlementWatcherEnabled,
    onLogs: refresh,
  });

  if (!isAuctionLive(lifecycle, endTime, block.data?.timestamp)) {
    return null;
  }

  return <AuctionLiveCtaView />;
}

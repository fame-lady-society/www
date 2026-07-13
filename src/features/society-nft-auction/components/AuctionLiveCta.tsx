"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { base } from "viem/chains";
import { useReadContracts } from "wagmi";
import { WrappedLink } from "@/components/WrappedLink";
import { societyNftAuctionAbi } from "@/wagmi";
import { getSocietyNftAuctionConfig } from "../config";
import { usePageAttentionRefresh } from "../hooks/usePageAttentionRefresh";

const MAX_TIMER_DELAY_MS = 2_147_483_647;
export const AUCTION_CTA_TIMING_FUNCTIONS = ["startTime", "endTime"] as const;

export function createAuctionLiveCtaReadContracts(address: Address | null) {
  if (address === null) return [];
  return AUCTION_CTA_TIMING_FUNCTIONS.map((functionName) => ({
    abi: societyNftAuctionAbi,
    address,
    chainId: base.id,
    functionName,
  }));
}

export interface AuctionLiveCtaWindow {
  live: boolean;
  nextBoundaryMs: number | null;
}

export function deriveAuctionLiveCtaWindow({
  startTime,
  endTime,
  nowMs,
}: {
  startTime: bigint | undefined;
  endTime: bigint | undefined;
  nowMs: number;
}): AuctionLiveCtaWindow {
  if (
    startTime === undefined ||
    endTime === undefined ||
    startTime <= 0n ||
    endTime <= startTime
  ) {
    return { live: false, nextBoundaryMs: null };
  }

  const startTimeMs = Number(startTime * 1_000n);
  const endTimeMs = Number(endTime * 1_000n);
  if (nowMs < startTimeMs) {
    return { live: false, nextBoundaryMs: startTimeMs };
  }
  if (nowMs < endTimeMs) {
    return { live: true, nextBoundaryMs: endTimeMs };
  }
  return { live: false, nextBoundaryMs: null };
}

export function auctionLiveCtaTimerDelay(
  nextBoundaryMs: number | null,
  nowMs: number,
): number | null {
  if (nextBoundaryMs === null) return null;
  return Math.min(Math.max(0, nextBoundaryMs - nowMs + 25), MAX_TIMER_DELAY_MS);
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
  const address = config.status === "configured" ? config.address : null;
  const configured = address !== null;
  const contracts = useMemo(
    () => createAuctionLiveCtaReadContracts(address),
    [address],
  );
  const timingQuery = useReadContracts({
    allowFailure: true,
    contracts,
    query: {
      enabled: configured,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });
  const startTime =
    timingQuery.data?.[0]?.status === "success"
      ? (timingQuery.data[0].result as bigint)
      : undefined;
  const endTime =
    timingQuery.data?.[1]?.status === "success"
      ? (timingQuery.data[1].result as bigint)
      : undefined;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const ctaWindow = deriveAuctionLiveCtaWindow({ startTime, endTime, nowMs });
  const refetchTiming = timingQuery.refetch;

  useEffect(() => {
    const delay = auctionLiveCtaTimerDelay(
      ctaWindow.nextBoundaryMs,
      Date.now(),
    );
    if (delay === null) return;
    const timer = globalThis.setTimeout(() => setNowMs(Date.now()), delay);
    return () => globalThis.clearTimeout(timer);
  }, [ctaWindow.nextBoundaryMs, nowMs]);

  const refresh = useCallback(async () => {
    const result = await refetchTiming({ cancelRefetch: false });
    if (result.error) throw result.error;
    setNowMs(Date.now());
  }, [refetchTiming]);
  usePageAttentionRefresh(refresh, configured);

  if (!ctaWindow.live) return null;
  return <AuctionLiveCtaView />;
}

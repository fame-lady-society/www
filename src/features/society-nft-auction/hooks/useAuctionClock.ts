"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface AuctionClockInput {
  blockTimestamp: bigint;
  endTime: bigint;
  observedAtMs: number;
  nowMs: number;
  canonicalCanBid: boolean;
  canonicalCanSettle: boolean;
  deadlineReachedLocally?: boolean;
}

export interface AuctionClockState {
  displayTimestamp: bigint;
  remainingSeconds: bigint;
  canBid: boolean;
  canSettle: boolean;
  shouldRefreshDeadline: boolean;
}

export function deriveAuctionClock(
  input: AuctionClockInput,
): AuctionClockState {
  const elapsedMs = Math.max(0, input.nowMs - input.observedAtMs);
  const elapsedSeconds = BigInt(Math.floor(elapsedMs / 1_000));
  const displayTimestamp = input.blockTimestamp + elapsedSeconds;
  const remainingSeconds =
    input.endTime > displayTimestamp ? input.endTime - displayTimestamp : 0n;
  const deadlineReached =
    input.deadlineReachedLocally === true || remainingSeconds === 0n;

  return {
    displayTimestamp,
    remainingSeconds,
    canBid: input.canonicalCanBid && !deadlineReached,
    // Local wall time is deliberately not lifecycle authority.
    canSettle: input.canonicalCanSettle,
    shouldRefreshDeadline: input.canonicalCanBid && deadlineReached,
  };
}

export function createDeadlineRefreshGate(refresh: () => void) {
  let refreshedDeadline: bigint | null = null;

  return {
    request(deadline: bigint, shouldRefresh: boolean) {
      if (!shouldRefresh || refreshedDeadline === deadline) return;
      refreshedDeadline = deadline;
      refresh();
    },
  };
}

export interface UseAuctionClockInput {
  blockTimestamp: bigint | null;
  endTime: bigint | null;
  canonicalCanBid: boolean;
  canonicalCanSettle: boolean;
  refresh: () => void | Promise<void>;
}

export interface UseAuctionClockResult {
  remainingSeconds: bigint | null;
  canBid: boolean;
  canSettle: boolean;
}

export function useAuctionClock({
  blockTimestamp,
  endTime,
  canonicalCanBid,
  canonicalCanSettle,
  refresh,
}: UseAuctionClockInput): UseAuctionClockResult {
  const [observedAtMs, setObservedAtMs] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(observedAtMs);
  const [expiredDeadline, setExpiredDeadline] = useState<bigint | null>(null);

  useEffect(() => {
    const observed = Date.now();
    setObservedAtMs(observed);
    setNowMs(observed);
  }, [blockTimestamp]);

  useEffect(() => {
    if (!canonicalCanBid || expiredDeadline === endTime) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [canonicalCanBid, endTime, expiredDeadline]);

  const clock = useMemo(() => {
    if (blockTimestamp === null || endTime === null) return null;

    return deriveAuctionClock({
      blockTimestamp,
      endTime,
      observedAtMs,
      nowMs,
      canonicalCanBid,
      canonicalCanSettle,
      deadlineReachedLocally: expiredDeadline === endTime,
    });
  }, [
    blockTimestamp,
    canonicalCanBid,
    canonicalCanSettle,
    endTime,
    expiredDeadline,
    nowMs,
    observedAtMs,
  ]);

  useEffect(() => {
    if (clock?.shouldRefreshDeadline && endTime !== null) {
      setExpiredDeadline(endTime);
    }
  }, [clock?.shouldRefreshDeadline, endTime]);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  const refreshGate = useMemo(
    () => createDeadlineRefreshGate(() => void refreshRef.current()),
    [],
  );

  useEffect(() => {
    if (endTime !== null) {
      refreshGate.request(endTime, clock?.shouldRefreshDeadline === true);
    }
  }, [clock?.shouldRefreshDeadline, endTime, refreshGate]);

  return {
    remainingSeconds: clock?.remainingSeconds ?? null,
    canBid: clock?.canBid ?? false,
    canSettle: clock?.canSettle ?? canonicalCanSettle,
  };
}

"use client";

import { useEffect, useRef } from "react";

export interface PageAttentionRefreshGate {
  request: () => Promise<void>;
}

export function createPageAttentionRefreshGate(
  refresh: () => void | Promise<void>,
  {
    now = Date.now,
    dedupeMs = 1_000,
  }: { now?: () => number; dedupeMs?: number } = {},
): PageAttentionRefreshGate {
  let inFlight: Promise<void> | null = null;
  let lastRefreshStartedAt = Number.NEGATIVE_INFINITY;

  return {
    request() {
      if (inFlight) return inFlight;

      const requestedAt = now();
      if (requestedAt - lastRefreshStartedAt < dedupeMs) {
        return Promise.resolve();
      }
      lastRefreshStartedAt = requestedAt;

      try {
        const pending = Promise.resolve(refresh()).finally(() => {
          if (inFlight === pending) inFlight = null;
        });
        inFlight = pending;
        return pending;
      } catch (error) {
        return Promise.reject(error);
      }
    },
  };
}

export function usePageAttentionRefresh(
  refresh: () => void | Promise<void>,
  enabled = true,
): void {
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const gateRef = useRef<PageAttentionRefreshGate | null>(null);
  if (gateRef.current === null) {
    gateRef.current = createPageAttentionRefreshGate(() =>
      refreshRef.current(),
    );
  }

  useEffect(() => {
    if (!enabled) return;

    const requestRefresh = () => {
      void gateRef.current?.request().catch(() => undefined);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") requestRefresh();
    };

    window.addEventListener("focus", requestRefresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", requestRefresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled]);
}

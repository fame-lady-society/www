"use client";

import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { useEffect, useId, useState } from "react";
import type { FameSwapQuote } from "../solver/types";

export interface RouteDiagnosticsProps {
  quote: FameSwapQuote | null;
  defaultOpen: boolean;
}

function shortHash(value: string): string {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function quoteContextLabel(quote: FameSwapQuote): string | null {
  if (quote.status !== "ready" || !quote.quoteContext) return null;
  if (quote.quoteContext.source === "live" || quote.quoteContext.source === "fork") {
    return `${quote.quoteContext.source} block ${quote.quoteContext.blockNumber.toString()}`;
  }
  if (quote.quoteContext.source === "snapshot") {
    return `recorded state ${quote.quoteContext.snapshotId}`;
  }
  return `deterministic ${quote.quoteContext.profileId}`;
}

export const RouteDiagnostics: FC<RouteDiagnosticsProps> = ({
  quote,
  defaultOpen,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen, quote?.status]);

  if (!quote) return null;

  return (
    <div>
      <Button
        variant="text"
        size="small"
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        Route diagnostics
      </Button>
      <Collapse id={contentId} in={open}>
        <Stack spacing={1.25} sx={{ mt: 1 }}>
          <Divider />
          <Typography variant="caption" color="text.secondary">
            Status: {quote.status}
          </Typography>
          {"routeArtifactId" in quote ? (
            <Typography variant="caption" color="text.secondary">
              Route: {quote.routeArtifactId}
            </Typography>
          ) : null}
          {quote.status === "ready" ? (
            <>
              <Typography variant="caption" color="text.secondary">
                Source: {quote.routeSource}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Route hash: {shortHash(quote.materializedRouteHash)}
              </Typography>
              {quoteContextLabel(quote) ? (
                <Typography variant="caption" color="text.secondary">
                  Quote context: {quoteContextLabel(quote)}
                </Typography>
              ) : null}
              {quote.feeBreakdown.marketImpact.computableLegs > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Market impact: max{" "}
                  {(
                    (quote.feeBreakdown.marketImpact.maxLegMarketImpactBps ?? 0) /
                    100
                  ).toFixed(2)}
                  % across computable legs
                </Typography>
              ) : null}
              <Typography variant="caption" color="text.secondary">
                Legs:{" "}
                {quote.routeDisplay
                  .map(
                    (leg) =>
                      `${leg.tokenIn} -> ${leg.tokenOut} (${leg.venue}, ${leg.amountMode})`,
                  )
                  .join(" / ")}
              </Typography>
            </>
          ) : null}
          {"readiness" in quote ? (
            <Typography variant="caption" color="text.secondary">
              Readiness: {quote.readiness.reason}
            </Typography>
          ) : null}
          {"rejectedCandidates" in quote && quote.rejectedCandidates.length > 0 ? (
            <Typography variant="caption" color="text.secondary">
              Rejected candidates:{" "}
              {quote.rejectedCandidates
                .slice(0, 3)
                .map((candidate) => `${candidate.reason}: ${candidate.message}`)
                .join(" / ")}
            </Typography>
          ) : null}
        </Stack>
      </Collapse>
    </div>
  );
};

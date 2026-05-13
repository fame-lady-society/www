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
              Artifact: {quote.routeArtifactId}
            </Typography>
          ) : null}
          {quote.status === "ready" ? (
            <>
              <Typography variant="caption" color="text.secondary">
                Fixture hash: {shortHash(quote.fixtureRouteHash)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Materialized hash: {shortHash(quote.materializedRouteHash)}
              </Typography>
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
        </Stack>
      </Collapse>
    </div>
  );
};

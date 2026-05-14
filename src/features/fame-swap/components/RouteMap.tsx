"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { CSSProperties, FC } from "react";
import type {
  FameSwapRouteMap as FameSwapRouteMapView,
  FameSwapRouteMapEdge,
  FameSwapRouteTokenView,
} from "../ui/quoteView";

export interface FameSwapRouteMapProps {
  routeMap: FameSwapRouteMapView | null;
}

const panelStyle: CSSProperties = {
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 8,
  padding: 16,
};

const nodeStyle: CSSProperties = {
  alignItems: "center",
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 6,
  display: "flex",
  gap: 8,
  justifyContent: "center",
  minHeight: 44,
  minWidth: 112,
  padding: "6px 10px",
};

const railStyle: CSSProperties = {
  backgroundColor: "rgba(127, 127, 127, 0.18)",
  borderRadius: 999,
  flex: 1,
  height: 10,
  overflow: "hidden",
};

const edgeLabelRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "space-between",
  marginTop: 4,
  minWidth: 0,
};

const edgeDetailRowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 8px",
  marginTop: 2,
};

const detailsStyle: CSSProperties = {
  marginTop: 4,
};

const summaryStyle: CSSProperties = {
  cursor: "pointer",
  display: "inline-flex",
};

const technicalRowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: 6,
  minWidth: 0,
};

const codeStyle: CSSProperties = {
  backgroundColor: "rgba(127, 127, 127, 0.12)",
  borderRadius: 4,
  display: "inline-block",
  maxWidth: "100%",
  overflowWrap: "anywhere",
  padding: "2px 4px",
};

function edgeStrengthLabel(edge: FameSwapRouteMapEdge, split: boolean): string {
  if (edge.amountLabel) return edge.amountLabel;
  return split ? "split branch" : "all input";
}

function tokenIconStyle(token: FameSwapRouteTokenView): CSSProperties {
  return {
    alignItems: "center",
    backgroundColor: token.iconBackground,
    borderRadius: "50%",
    color: token.iconForeground,
    display: "inline-flex",
    flex: "0 0 28px",
    fontSize: 11,
    fontWeight: 800,
    height: 28,
    justifyContent: "center",
    width: 28,
  };
}

const TokenNode: FC<{ token: FameSwapRouteTokenView }> = ({ token }) => (
  <div style={nodeStyle} title={token.label}>
    <span aria-hidden="true" style={tokenIconStyle(token)}>
      {token.iconLabel}
    </span>
    <Typography
      variant="body2"
      fontWeight={700}
      sx={{ overflowWrap: "anywhere" }}
    >
      {token.symbol}
    </Typography>
  </div>
);

function copyPoolId(poolId: string): void {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(poolId);
}

export const FameSwapRouteMap: FC<FameSwapRouteMapProps> = ({ routeMap }) => {
  if (!routeMap) {
    return (
      <div style={panelStyle}>
        <Typography variant="subtitle2">Route</Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          style={{ marginTop: 6 }}
        >
          Enter an amount to prepare a FAME route.
        </Typography>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="baseline"
          justifyContent="space-between"
          spacing={0.5}
        >
          <Typography variant="subtitle2">Route</Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textAlign: { xs: "left", sm: "right" },
              overflowWrap: "anywhere",
            }}
          >
            {routeMap.summary}
          </Typography>
        </Stack>

        <Stack spacing={1.25}>
          {routeMap.edges.map((edge) => (
            <Stack
              key={edge.id}
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={1}
            >
              <TokenNode token={edge.fromToken} />

              <div style={{ flex: 1, minWidth: 120 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <div style={railStyle}>
                    <div
                      style={{
                        width: routeMap.split ? "66%" : "100%",
                        height: "100%",
                        backgroundColor: "#64b5f6",
                      }}
                    />
                  </div>
                  <ArrowForwardIcon fontSize="small" color="primary" />
                </Stack>
                <div style={edgeLabelRowStyle}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ minWidth: 0, overflowWrap: "anywhere" }}
                  >
                    {edge.poolTypeLabel}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ flex: "0 0 auto" }}
                  >
                    {edgeStrengthLabel(edge, routeMap.split)}
                  </Typography>
                </div>
                <div style={edgeDetailRowStyle}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700 }}
                  >
                    {edge.pairLabel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {edge.venueLabel}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    title={edge.feeTooltip ?? undefined}
                  >
                    {edge.feeLabel}
                  </Typography>
                </div>
                {edge.poolId ? (
                  <details style={detailsStyle}>
                    <summary style={summaryStyle}>
                      <Typography variant="caption" color="text.secondary">
                        Pool ID
                      </Typography>
                    </summary>
                    <div style={technicalRowStyle}>
                      <Typography
                        component="code"
                        variant="caption"
                        color="text.secondary"
                        style={codeStyle}
                      >
                        {edge.poolId}
                      </Typography>
                      <Tooltip title="Copy pool ID" arrow>
                        <IconButton
                          aria-label={`Copy ${edge.poolName} pool ID`}
                          onClick={() => {
                            if (edge.poolId) copyPoolId(edge.poolId);
                          }}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </details>
                ) : null}
              </div>

              <TokenNode token={edge.toToken} />
            </Stack>
          ))}
        </Stack>

        {routeMap.splitShareLabel ? (
          <Typography variant="caption" color="text.secondary">
            {routeMap.splitShareLabel}
          </Typography>
        ) : null}
      </Stack>
    </div>
  );
};

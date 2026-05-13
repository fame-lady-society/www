"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { CSSProperties, FC } from "react";
import type {
  FameSwapRouteMap as FameSwapRouteMapView,
  FameSwapRouteMapEdge,
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
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 6,
  minWidth: 88,
  padding: "6px 10px",
  textAlign: "center",
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
  justifyContent: "space-between",
  marginTop: 4,
};

function edgeStrengthLabel(edge: FameSwapRouteMapEdge, split: boolean): string {
  if (edge.amountLabel) return edge.amountLabel;
  return split ? "split branch" : "all input";
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
        <Stack direction="row" alignItems="baseline" justifyContent="space-between">
          <Typography variant="subtitle2">Route</Typography>
          <Typography variant="caption" color="text.secondary">
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
              <div style={nodeStyle}>
                <Typography variant="body2" fontWeight={700}>
                  {edge.from}
                </Typography>
              </div>

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
                  <Typography variant="caption" color="text.secondary">
                    {edge.poolName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {edgeStrengthLabel(edge, routeMap.split)}
                  </Typography>
                </div>
                {edge.poolId ? (
                  <Typography variant="caption" color="text.secondary">
                    {edge.venue} - {edge.poolId}
                  </Typography>
                ) : null}
              </div>

              <div style={nodeStyle}>
                <Typography variant="body2" fontWeight={700}>
                  {edge.to}
                </Typography>
              </div>
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

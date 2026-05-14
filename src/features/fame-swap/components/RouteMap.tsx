"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { CSSProperties, FC } from "react";
import type { FameSwapRouteMap as FameSwapRouteMapView } from "../ui/quoteView";
import { FameSwapRouteGraph } from "./RouteGraph";

export interface FameSwapRouteMapProps {
  routeMap: FameSwapRouteMapView | null;
}

const panelStyle: CSSProperties = {
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 8,
  padding: 16,
};

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

        <FameSwapRouteGraph graph={routeMap.graph} />
      </Stack>
    </div>
  );
};

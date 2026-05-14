"use client";

import ClickAwayListener from "@mui/material/ClickAwayListener";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import { alpha, useTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState, type CSSProperties, type FC } from "react";
import type {
  FameSwapRouteGraph as FameSwapRouteGraphView,
  FameSwapRouteGraphEdge,
  FameSwapRouteGraphTokenNode,
} from "../ui/routeGraph";
import type { FameRouteTokenMetadata } from "../ui/routeMetadata";

export interface FameSwapRouteGraphProps {
  graph: FameSwapRouteGraphView;
}

interface LayoutPoint {
  x: number;
  y: number;
}

interface GraphLayout {
  width: number;
  height: number;
  nodePoints: Map<string, LayoutPoint>;
  edgePoints: Map<string, LayoutPoint>;
}

interface RouteGraphPalette {
  borderColor: string;
  isDark: boolean;
  mutedColor: string;
  shadow: string;
  surfaceColor: string;
  textColor: string;
}

const nodeWidth = 148;
const nodeHeight = 48;
const poolPillHeight = 72;
const columnWidth = 230;
const graphPaddingX = 68;
const graphPaddingY = 64;
const laneHeight = 136;
const sameLanePoolOffsetY = 76;

const graphShellStyle: CSSProperties = {
  minWidth: 0,
};

const canvasStyle: CSSProperties = {
  margin: "0 auto",
  minHeight: 172,
  overflow: "hidden",
  position: "relative",
};

const svgStyle: CSSProperties = {
  display: "block",
  height: "100%",
  inset: 0,
  overflow: "visible",
  position: "absolute",
  width: "100%",
  zIndex: 1,
};

const tokenNodeStyle: CSSProperties = {
  alignItems: "center",
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 8,
  display: "flex",
  gap: 8,
  height: nodeHeight,
  justifyContent: "center",
  minWidth: 0,
  padding: "5px 8px",
  position: "absolute",
  transform: "translate(-50%, -50%)",
  width: nodeWidth,
  zIndex: 3,
};

const tokenBadgeStyle: CSSProperties = {
  alignItems: "center",
  borderRadius: "50%",
  display: "inline-flex",
  flex: "0 0 28px",
  fontSize: 11,
  fontWeight: 800,
  height: 28,
  justifyContent: "center",
  overflow: "hidden",
  width: 28,
};

const poolPillStyle: CSSProperties = {
  alignItems: "center",
  borderRadius: 8,
  boxSizing: "border-box",
  cursor: "help",
  display: "grid",
  gap: 6,
  height: poolPillHeight,
  maxWidth: 220,
  minWidth: 0,
  padding: "7px 9px",
  position: "absolute",
  transform: "translate(-50%, -50%)",
  width: 220,
  zIndex: 2,
};

const poolButtonResetStyle: CSSProperties = {
  appearance: "none",
  font: "inherit",
  textAlign: "left",
};

const mobileGraphStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  minWidth: 0,
};

const mobileEdgeStyle: CSSProperties = {
  alignItems: "center",
  display: "grid",
  gap: 8,
  gridTemplateColumns:
    "minmax(82px, 0.7fr) minmax(0, 1.6fr) minmax(82px, 0.7fr)",
  minWidth: 0,
};

const mobileNodeStyle: CSSProperties = {
  alignItems: "center",
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 8,
  display: "flex",
  gap: 6,
  minWidth: 0,
  padding: "7px 8px",
};

const mobilePoolStyle: CSSProperties = {
  borderRadius: 8,
  boxSizing: "border-box",
  cursor: "help",
  display: "grid",
  gap: 6,
  height: poolPillHeight,
  minWidth: 0,
  padding: "8px 9px",
};

const pairIconStyle: CSSProperties = {
  alignItems: "center",
  display: "inline-flex",
  marginRight: 6,
  minWidth: 38,
  position: "relative",
  verticalAlign: "middle",
};

const pairIconSecondStyle: CSSProperties = {
  marginLeft: -8,
};

const poolLineStyle: CSSProperties = {
  alignItems: "center",
  display: "grid",
  gap: 6,
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  minWidth: 0,
};

const poolQuoteLineStyle: CSSProperties = {
  minWidth: 0,
};

const cueLabelStyle: CSSProperties = {
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0,
  lineHeight: 1,
  padding: "3px 6px",
  whiteSpace: "nowrap",
};

const poolTooltipStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  maxWidth: 300,
};

const poolTooltipRowStyle: CSSProperties = {
  display: "grid",
  gap: 2,
};

const technicalDetailsStyle: CSSProperties = {
  marginTop: 10,
};

const technicalSummaryStyle: CSSProperties = {
  cursor: "pointer",
  display: "inline-flex",
};

const technicalListStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  margin: "8px 0 0",
  padding: 0,
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

const srOnlyStyle: CSSProperties = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

function hashString(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function poolTypeCue(poolTypeLabel: string): {
  cue: "solid" | "dashed" | "double" | "dotted";
  color: string;
  label: string;
} {
  const normalized = poolTypeLabel.toLowerCase();
  if (normalized.includes("stable")) {
    return { cue: "dotted", color: "#0f766e", label: "stable" };
  }
  if (normalized.includes("volatile") || normalized.includes("solidly")) {
    return { cue: "dashed", color: "#2563eb", label: "volatile" };
  }
  if (normalized.includes("hook") || normalized.includes("poolmanager")) {
    return { cue: "double", color: "#9333ea", label: "hook" };
  }
  if (normalized.includes("concentrated")) {
    return { cue: "double", color: "#c2410c", label: "CL" };
  }
  if (normalized.includes("constant product")) {
    return { cue: "solid", color: "#334155", label: "CP" };
  }
  return { cue: "solid", color: "#475569", label: "pool" };
}

function cueColorForMode(
  cue: ReturnType<typeof poolTypeCue>,
  isDark: boolean,
): string {
  if (!isDark) return cue.color;
  if (cue.label === "stable") return "#2dd4bf";
  if (cue.label === "volatile") return "#60a5fa";
  if (cue.label === "hook") return "#c084fc";
  if (cue.label === "CL") return "#fb923c";
  return "#cbd5e1";
}

function strokeDasharray(
  cue: ReturnType<typeof poolTypeCue>["cue"],
): string | undefined {
  if (cue === "dashed") return "10 6";
  if (cue === "dotted") return "2 7";
  return undefined;
}

function edgeStrokeWidth(edge: FameSwapRouteGraphEdge): number {
  if (edge.share.bps === null) return 5;
  return Math.max(4, Math.min(12, 4 + (edge.share.bps / 10_000) * 8));
}

function laneBounds(graph: FameSwapRouteGraphView): {
  min: number;
  max: number;
} {
  const lanes = [0, ...graph.edges.map((edge) => edge.lane)];
  return {
    min: Math.min(...lanes),
    max: Math.max(...lanes),
  };
}

function buildLayout(graph: FameSwapRouteGraphView): GraphLayout {
  const maxColumn = Math.max(
    1,
    ...graph.nodes.map((node) => node.column),
    ...graph.edges.map((edge) => edge.column + 1),
  );
  const lanes = laneBounds(graph);
  const baseHeight =
    graphPaddingY * 2 + Math.max(0, lanes.max - lanes.min) * laneHeight;
  const width = graphPaddingX * 2 + maxColumn * columnWidth;
  const nodePoints = new Map<string, LayoutPoint>();
  const edgePoints = new Map<string, LayoutPoint>();
  let maxElementBottom = 0;

  for (const node of graph.nodes) {
    const point = {
      x: graphPaddingX + node.column * columnWidth,
      y: graphPaddingY + (node.lane - lanes.min) * laneHeight,
    };
    nodePoints.set(node.id, point);
    maxElementBottom = Math.max(maxElementBottom, point.y + nodeHeight / 2);
  }

  for (const edge of graph.edges) {
    const from = graph.nodes.find((node) => node.id === edge.fromNodeId);
    const to = graph.nodes.find((node) => node.id === edge.toNodeId);
    const isSameLaneEdge =
      from && to && from.lane === to.lane && edge.lane === from.lane;
    const point = {
      x: graphPaddingX + (edge.column + 0.5) * columnWidth,
      y:
        graphPaddingY +
        (edge.lane - lanes.min) * laneHeight +
        (isSameLaneEdge ? sameLanePoolOffsetY : 0),
    };
    edgePoints.set(edge.id, point);
    maxElementBottom = Math.max(maxElementBottom, point.y + poolPillHeight / 2);
  }

  return {
    width,
    height: Math.max(baseHeight, maxElementBottom + graphPaddingY),
    nodePoints,
    edgePoints,
  };
}

function pointPosition(point: LayoutPoint): CSSProperties {
  return {
    left: point.x,
    top: point.y,
  };
}

function copyPoolId(poolId: string): void {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(poolId);
}

const TokenGlyph: FC<{
  token: FameRouteTokenMetadata;
  size?: number;
  style?: CSSProperties;
}> = ({ token, size = 28, style }) => (
  <span
    aria-hidden="true"
    style={{
      ...tokenBadgeStyle,
      ...style,
      backgroundColor: token.iconBackground,
      color: token.iconForeground,
      flexBasis: size,
      fontSize: Math.max(9, Math.round(size * 0.38)),
      height: size,
      width: size,
    }}
  >
    {token.imageSrc ? (
      <span
        style={{
          backgroundImage: `url(${token.imageSrc})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          display: "block",
          height: "100%",
          width: "100%",
        }}
      />
    ) : (
      token.iconLabel
    )}
  </span>
);

const TokenNode: FC<{
  node: FameSwapRouteGraphTokenNode;
  point: LayoutPoint;
  surfaceColor: string;
  borderColor: string;
  shadow: string;
  textColor: string;
}> = ({ node, point, surfaceColor, borderColor, shadow, textColor }) => (
  <div
    style={{
      ...tokenNodeStyle,
      ...pointPosition(point),
      backgroundColor: surfaceColor,
      borderColor,
      boxShadow: shadow,
      color: textColor,
    }}
    title={node.token.label}
  >
    <TokenGlyph token={node.token} />
    <Typography
      variant="body2"
      fontWeight={800}
      sx={{
        color: textColor,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {node.token.symbol}
    </Typography>
  </div>
);

const PairGlyph: FC<{ edge: FameSwapRouteGraphEdge }> = ({ edge }) => (
  <span aria-hidden="true" style={pairIconStyle}>
    <TokenGlyph token={edge.fromToken} size={22} />
    <TokenGlyph token={edge.toToken} size={22} style={pairIconSecondStyle} />
  </span>
);

function poolQuoteLine(edge: FameSwapRouteGraphEdge): string {
  const share =
    edge.share.source === "quoted_amount"
      ? `${edge.share.label} quoted input`
      : edge.share.label;

  return edge.feeAmountLabel
    ? `${share} · fee ${edge.feeAmountLabel}`
    : `${share} · ${edge.feeLabel} tier`;
}

const PoolContents: FC<{
  edge: FameSwapRouteGraphEdge;
  palette: RouteGraphPalette;
}> = ({ edge, palette }) => {
  const cue = poolTypeCue(edge.poolTypeLabel);
  const cueColor = cueColorForMode(cue, palette.isDark);
  return (
    <>
      <div style={poolLineStyle}>
        <PairGlyph edge={edge} />
        <Typography
          variant="caption"
          sx={{
            color: palette.textColor,
            fontWeight: 800,
            lineHeight: 1.15,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {edge.pairLabel}
        </Typography>
        <span
          style={{
            ...cueLabelStyle,
            border: `1px ${cue.cue} ${cueColor}`,
            color: cueColor,
          }}
        >
          {cue.label}
        </span>
      </div>
      <Typography
        variant="caption"
        sx={{
          color: palette.mutedColor,
          fontWeight: 700,
          lineHeight: 1.2,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        style={poolQuoteLineStyle}
      >
        {poolQuoteLine(edge)}
      </Typography>
    </>
  );
};

const PoolTooltipContents: FC<{
  edge: FameSwapRouteGraphEdge;
}> = ({ edge }) => (
  <div style={poolTooltipStyle}>
    <div style={poolTooltipRowStyle}>
      <Typography sx={{ color: "#fff", fontWeight: 800 }} variant="caption">
        {edge.poolName}
      </Typography>
      <Typography sx={{ color: alpha("#fff", 0.78) }} variant="caption">
        {edge.fromToken.symbol} to {edge.toToken.symbol} · {edge.poolTypeLabel}{" "}
        · {edge.venueLabel}
      </Typography>
    </div>
    <div style={poolTooltipRowStyle}>
      <Typography sx={{ color: "#fff", fontWeight: 800 }} variant="caption">
        Pool fee
      </Typography>
      <Typography sx={{ color: alpha("#fff", 0.86) }} variant="caption">
        {edge.feeDetailLabel}
      </Typography>
    </div>
    <div style={poolTooltipRowStyle}>
      <Typography sx={{ color: "#fff", fontWeight: 800 }} variant="caption">
        Split share
      </Typography>
      <Typography sx={{ color: alpha("#fff", 0.86) }} variant="caption">
        {edge.share.amountLabel
          ? `${edge.share.label} (${edge.share.amountLabel})`
          : edge.share.label}
      </Typography>
    </div>
    {edge.feeTooltip ? (
      <Typography sx={{ color: alpha("#fff", 0.72) }} variant="caption">
        {edge.feeTooltip}
      </Typography>
    ) : null}
  </div>
);

const InteractivePoolCard: FC<{
  edge: FameSwapRouteGraphEdge;
  palette: RouteGraphPalette;
  style: CSSProperties;
}> = ({ edge, palette, style }) => {
  const [open, setOpen] = useState(false);
  const cue = poolTypeCue(edge.poolTypeLabel);
  const cueColor = cueColorForMode(cue, palette.isDark);

  return (
    <ClickAwayListener
      onClickAway={() => {
        setOpen(false);
      }}
    >
      <Tooltip
        arrow
        disableInteractive={false}
        enterTouchDelay={0}
        leaveTouchDelay={60_000}
        onClose={() => {
          setOpen(false);
        }}
        onOpen={() => {
          setOpen(true);
        }}
        open={open}
        title={<PoolTooltipContents edge={edge} />}
      >
        <button
          aria-label={`${edge.poolName}: ${edge.poolTypeLabel}, ${edge.venueLabel}, ${edge.feeDetailLabel}`}
          data-pool-type-cue={cue.cue}
          onClick={() => {
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          style={{
            ...poolButtonResetStyle,
            ...style,
            backgroundColor: palette.surfaceColor,
            border: `2px ${cue.cue} ${cueColor}`,
            boxShadow: palette.shadow,
            color: palette.textColor,
          }}
          type="button"
        >
          <PoolContents edge={edge} palette={palette} />
        </button>
      </Tooltip>
    </ClickAwayListener>
  );
};

const PoolPill: FC<{
  edge: FameSwapRouteGraphEdge;
  point: LayoutPoint;
  palette: RouteGraphPalette;
}> = ({ edge, point, palette }) => (
  <InteractivePoolCard
    edge={edge}
    palette={palette}
    style={{
      ...poolPillStyle,
      ...pointPosition(point),
    }}
  />
);

const MobileTokenNode: FC<{
  token: FameRouteTokenMetadata;
  surfaceColor: string;
  borderColor: string;
  textColor: string;
}> = ({ token, surfaceColor, borderColor, textColor }) => (
  <div
    style={{
      ...mobileNodeStyle,
      backgroundColor: surfaceColor,
      borderColor,
      color: textColor,
    }}
    title={token.label}
  >
    <TokenGlyph token={token} size={24} />
    <Typography
      variant="caption"
      sx={{
        color: textColor,
        fontWeight: 800,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {token.symbol}
    </Typography>
  </div>
);

const MobileRouteGraph: FC<{
  graph: FameSwapRouteGraphView;
  palette: RouteGraphPalette;
}> = ({ graph, palette }) => (
  <div
    aria-label={graph.semanticLines[0] ?? graph.summary}
    role="img"
    style={mobileGraphStyle}
  >
    {graph.edges.map((edge) => {
      return (
        <div key={edge.id} style={mobileEdgeStyle}>
          <MobileTokenNode
            token={edge.fromToken}
            surfaceColor={palette.surfaceColor}
            borderColor={palette.borderColor}
            textColor={palette.textColor}
          />
          <InteractivePoolCard
            edge={edge}
            palette={palette}
            style={mobilePoolStyle}
          />
          <MobileTokenNode
            token={edge.toToken}
            surfaceColor={palette.surfaceColor}
            borderColor={palette.borderColor}
            textColor={palette.textColor}
          />
        </div>
      );
    })}
  </div>
);

const RoutePath: FC<{
  edge: FameSwapRouteGraphEdge;
  layout: GraphLayout;
  markerId: string;
  palette: RouteGraphPalette;
}> = ({ edge, layout, markerId, palette }) => {
  const from = layout.nodePoints.get(edge.fromNodeId);
  const to = layout.nodePoints.get(edge.toNodeId);
  const pool = layout.edgePoints.get(edge.id);
  if (!from || !to || !pool) return null;

  const cue = poolTypeCue(edge.poolTypeLabel);
  const cueColor = cueColorForMode(cue, palette.isDark);
  const startX = from.x + nodeWidth / 2 + 2;
  const endX = to.x - nodeWidth / 2 - 2;
  const controlOffset = Math.max(34, (endX - startX) / 3);
  const d = [
    `M ${startX} ${from.y}`,
    `C ${startX + controlOffset} ${from.y},`,
    `${endX - controlOffset} ${pool.y},`,
    `${pool.x} ${pool.y}`,
    `S ${endX - controlOffset / 2} ${to.y},`,
    `${endX} ${to.y}`,
  ].join(" ");

  return (
    <path
      d={d}
      fill="none"
      markerEnd={`url(#${markerId})`}
      opacity={0.88}
      stroke={cueColor}
      strokeDasharray={strokeDasharray(cue.cue)}
      strokeLinecap="round"
      strokeWidth={edgeStrokeWidth(edge)}
    />
  );
};

const TechnicalDetails: FC<{
  graph: FameSwapRouteGraphView;
  palette: RouteGraphPalette;
}> = ({ graph, palette }) => {
  const edgesWithPoolIds = graph.edges.filter((edge) => edge.poolId);
  if (edgesWithPoolIds.length === 0) return null;

  return (
    <details style={technicalDetailsStyle}>
      <summary style={technicalSummaryStyle}>
        <Typography variant="caption" sx={{ color: palette.mutedColor }}>
          Route technical details
        </Typography>
      </summary>
      <div style={technicalListStyle}>
        {edgesWithPoolIds.map((edge) => (
          <div key={edge.id} style={technicalRowStyle}>
            <Typography
              component="code"
              variant="caption"
              style={{
                ...codeStyle,
                color: palette.mutedColor,
              }}
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
                sx={{ color: palette.mutedColor }}
              >
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </div>
        ))}
      </div>
    </details>
  );
};

export const FameSwapRouteGraph: FC<FameSwapRouteGraphProps> = ({ graph }) => {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const layout = buildLayout(graph);
  const markerId = `fame-swap-route-arrow-${hashString(graph.summary)}`;
  const isDark = theme.palette.mode === "dark" || prefersDark;
  const palette: RouteGraphPalette = {
    borderColor: isDark
      ? alpha("#e2e8f0", 0.22)
      : alpha(theme.palette.text.primary, 0.18),
    isDark,
    mutedColor: isDark ? "#cbd5e1" : theme.palette.text.secondary,
    shadow: isDark
      ? "0 1px 12px rgba(0, 0, 0, 0.45)"
      : "0 1px 10px rgba(0, 0, 0, 0.08)",
    surfaceColor: isDark
      ? alpha(
          theme.palette.mode === "dark"
            ? theme.palette.background.paper
            : "#0f172a",
          0.94,
        )
      : alpha(theme.palette.background.paper, 0.94),
    textColor: isDark ? "#f8fafc" : theme.palette.text.primary,
  };

  return (
    <div style={{ ...graphShellStyle, color: palette.textColor }}>
      {compact ? (
        <MobileRouteGraph graph={graph} palette={palette} />
      ) : (
        <div
          aria-label={graph.semanticLines[0] ?? graph.summary}
          role="img"
          style={{
            ...canvasStyle,
            height: layout.height,
            width: layout.width,
          }}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            style={svgStyle}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
          >
            <defs>
              {graph.edges.map((edge) => {
                const cue = poolTypeCue(edge.poolTypeLabel);
                const cueColor = cueColorForMode(cue, palette.isDark);
                const edgeMarkerId = `${markerId}-${hashString(edge.id)}`;
                return (
                  <marker
                    id={edgeMarkerId}
                    key={edge.id}
                    markerHeight="6"
                    markerUnits="userSpaceOnUse"
                    markerWidth="6"
                    orient="auto"
                    refX="5.5"
                    refY="3"
                    viewBox="0 0 6 6"
                  >
                    <path d="M 0 0 L 6 3 L 0 6 z" fill={cueColor} />
                  </marker>
                );
              })}
            </defs>
            {graph.edges.map((edge) => (
              <RoutePath
                key={edge.id}
                edge={edge}
                layout={layout}
                markerId={`${markerId}-${hashString(edge.id)}`}
                palette={palette}
              />
            ))}
          </svg>

          {graph.nodes.map((node) => {
            const point = layout.nodePoints.get(node.id);
            return point ? (
              <TokenNode
                key={node.id}
                node={node}
                point={point}
                surfaceColor={palette.surfaceColor}
                borderColor={palette.borderColor}
                shadow={palette.shadow}
                textColor={palette.textColor}
              />
            ) : null;
          })}

          {graph.edges.map((edge) => {
            const point = layout.edgePoints.get(edge.id);
            return point ? (
              <PoolPill
                key={edge.id}
                edge={edge}
                point={point}
                palette={palette}
              />
            ) : null;
          })}
        </div>
      )}

      <ol style={srOnlyStyle}>
        {graph.semanticLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>

      <TechnicalDetails graph={graph} palette={palette} />
    </div>
  );
};

"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { CSSProperties, FC, ReactNode } from "react";
import type { FameSwapQuoteView, FameSwapValueTone } from "../ui/quoteView";

interface QuoteMetricProps {
  label: string;
  value: ReactNode;
  tooltip?: string | null;
  tone?: FameSwapValueTone;
}

export interface FameSwapQuotePanelProps {
  view: FameSwapQuoteView;
}

const panelStyle: CSSProperties = {
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 8,
  padding: 18,
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
};

const receiveStyle: CSSProperties = {
  alignItems: "baseline",
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 4,
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
  marginTop: 16,
};

const metricStyle: CSSProperties = {
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: 4,
};

const infoButtonStyle: CSSProperties = {
  alignItems: "center",
  appearance: "none",
  background: "transparent",
  border: 0,
  color: "inherit",
  cursor: "help",
  display: "inline-flex",
  font: "inherit",
  padding: 0,
};

function toneColor(tone: FameSwapValueTone | undefined): string | undefined {
  if (tone === "positive") return "success.main";
  if (tone === "negative") return "error.main";
  return undefined;
}

function splitAmountLabel(label: string): {
  amount: string;
  symbol: string | null;
} {
  const parts = label.split(" ");
  const symbol = parts[parts.length - 1];
  const knownSymbols = new Set(["FAME", "USDC", "WETH", "ETH"]);
  if (!symbol || !knownSymbols.has(symbol)) {
    return {
      amount: label,
      symbol: null,
    };
  }

  return {
    amount: parts.slice(0, -1).join(" "),
    symbol,
  };
}

const AmountValue: FC<{ label: string; tone?: FameSwapValueTone }> = ({
  label,
  tone,
}) => {
  const { amount, symbol } = splitAmountLabel(label);
  const color = toneColor(tone);

  return (
    <div style={receiveStyle}>
      <Typography
        component="span"
        variant="h5"
        sx={{
          color,
          fontWeight: 800,
          lineHeight: 1.15,
          overflowWrap: "anywhere",
        }}
      >
        {amount}
      </Typography>
      {symbol ? (
        <Typography
          component="span"
          color={color ? undefined : "text.secondary"}
          sx={{ color, fontWeight: 700, lineHeight: 1.15 }}
        >
          {symbol}
        </Typography>
      ) : null}
    </div>
  );
};

const QuoteMetric: FC<QuoteMetricProps> = ({ label, value, tooltip, tone }) => {
  const color = toneColor(tone);

  return (
    <div style={metricStyle}>
      <Typography
        component="div"
        variant="caption"
        color="text.secondary"
        style={labelStyle}
      >
        <span>{label}</span>
        {tooltip ? (
          <Tooltip title={tooltip} arrow>
            <button
              type="button"
              aria-label={`${label} details`}
              style={infoButtonStyle}
            >
              <InfoOutlinedIcon fontSize="inherit" />
            </button>
          </Tooltip>
        ) : null}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color,
          mt: 0.25,
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </div>
  );
};

export const FameSwapQuotePanel: FC<FameSwapQuotePanelProps> = ({ view }) => (
  <section aria-label="Swap quote" style={panelStyle}>
    <div style={headerStyle}>
      <Typography variant="caption" color="text.secondary">
        Receive
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {view.freshnessLabel}
      </Typography>
    </div>
    <AmountValue label={view.receiveLabel} tone={view.receiveTone} />
    {view.estimateSourceLabel ? (
      <Typography
        variant="caption"
        color="text.secondary"
        title={view.estimateSourceTooltip ?? undefined}
      >
        {view.estimateSourceLabel}
      </Typography>
    ) : null}
    <div style={metricGridStyle}>
      <QuoteMetric
        label="Min receive"
        value={view.protectedMinimumLabel}
        tone={view.protectedMinimumTone}
      />
      {view.debitEstimate.status === "available" ? (
        <QuoteMetric
          label={view.debitEstimate.metricLabel}
          value={view.debitEstimate.label}
          tone={view.debitEstimate.tone}
        />
      ) : null}
      {view.feeLabel ? (
        <QuoteMetric
          label="FLS fee"
          value={view.feeLabel}
          tooltip={view.feeTooltip}
        />
      ) : null}
      {view.venueFeeLabel ? (
        <QuoteMetric
          label="Venue fees"
          value={view.venueFeeLabel}
          tooltip={view.venueFeeTooltip}
        />
      ) : null}
      {view.marketImpactLabel ? (
        <QuoteMetric
          label="Market impact"
          value={view.marketImpactLabel}
          tooltip={view.marketImpactTooltip}
          tone={view.marketImpactTone}
        />
      ) : null}
    </div>
  </section>
);

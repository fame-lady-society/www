"use client";

import SettingsIcon from "@mui/icons-material/Settings";
import type { ChangeEvent, CSSProperties, ReactElement } from "react";
import {
  MAX_FAME_SWAP_DEADLINE_MINUTES,
  MIN_FAME_SWAP_DEADLINE_MINUTES,
  normalizeDeadlineMinutes,
} from "../solver/deadline";

const MIN_SLIPPAGE_BPS = 25;
const MAX_SLIPPAGE_BPS = 500;
const SLIPPAGE_STEP_BPS = 25;

const shellStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const panelStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 8,
  padding: 16,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const iconButtonStyle: CSSProperties = {
  width: 36,
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 8,
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
};

const mutedStyle: CSSProperties = {
  fontSize: 13,
  opacity: 0.72,
};

const inputStyle: CSSProperties = {
  width: 96,
  minHeight: 36,
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 6,
  background: "transparent",
  color: "inherit",
  padding: "0 10px",
};

export interface AdvancedSwapControlsProps {
  open: boolean;
  disabled?: boolean;
  slippageBps: number;
  deadlineMinutes: number;
  onToggle: () => void;
  onSlippageBpsChange: (value: number) => void;
  onDeadlineMinutesChange: (value: number) => void;
}

function normalizeSlippageBps(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(
    MAX_SLIPPAGE_BPS,
    Math.max(
      MIN_SLIPPAGE_BPS,
      Math.round(value / SLIPPAGE_STEP_BPS) * SLIPPAGE_STEP_BPS,
    ),
  );
}

export function AdvancedSwapControls({
  open,
  disabled,
  slippageBps,
  deadlineMinutes,
  onToggle,
  onSlippageBpsChange,
  onDeadlineMinutesChange,
}: AdvancedSwapControlsProps): ReactElement {
  const handleSlippageChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSlippageBpsChange(normalizeSlippageBps(Number(event.target.value)));
  };

  const handleDeadlineChange = (event: ChangeEvent<HTMLInputElement>) => {
    onDeadlineMinutesChange(
      normalizeDeadlineMinutes(Number(event.target.value)),
    );
  };

  return (
    <div style={shellStyle}>
      <div style={headerStyle}>
        <span style={labelStyle}>Advanced</span>
        <button
          type="button"
          title="Risk controls"
          aria-label="Risk controls"
          aria-expanded={open}
          disabled={disabled}
          onClick={onToggle}
          style={{
            ...iconButtonStyle,
            opacity: disabled ? 0.55 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <SettingsIcon fontSize="small" />
        </button>
      </div>

      {open ? (
        <div style={panelStyle}>
          <label style={shellStyle}>
            <span style={rowStyle}>
              <span style={labelStyle}>Max slippage</span>
              <span style={mutedStyle}>{(slippageBps / 100).toFixed(2)}%</span>
            </span>
            <input
              type="range"
              min={MIN_SLIPPAGE_BPS}
              max={MAX_SLIPPAGE_BPS}
              step={SLIPPAGE_STEP_BPS}
              value={slippageBps}
              disabled={disabled}
              aria-label="Max slippage"
              onChange={handleSlippageChange}
            />
          </label>

          <label style={rowStyle}>
            <span style={labelStyle}>Deadline</span>
            <span style={rowStyle}>
              <input
                type="number"
                min={MIN_FAME_SWAP_DEADLINE_MINUTES}
                max={MAX_FAME_SWAP_DEADLINE_MINUTES}
                step={1}
                value={deadlineMinutes}
                disabled={disabled}
                aria-label="Deadline minutes"
                onChange={handleDeadlineChange}
                style={inputStyle}
              />
              <span style={mutedStyle}>min</span>
            </span>
          </label>
        </div>
      ) : null}
    </div>
  );
}

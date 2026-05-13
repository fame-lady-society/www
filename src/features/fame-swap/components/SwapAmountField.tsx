"use client";

import TextField from "@mui/material/TextField";
import type { FC } from "react";
import type { FameSwapToken } from "../tokens";

export interface FameSwapAmountFieldProps {
  value: string;
  token: FameSwapToken;
  label?: string;
  helperText?: string | null;
  error?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export const FameSwapAmountField: FC<FameSwapAmountFieldProps> = ({
  value,
  token,
  label = "Amount",
  helperText,
  error,
  disabled,
  onChange,
}) => (
  <TextField
    fullWidth
    size="small"
    label={label}
    value={value}
    error={error}
    helperText={helperText}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    inputProps={{
      inputMode: "decimal",
      min: "0",
      "aria-label": `Amount in ${token.symbol}`,
    }}
    sx={{
      "& .MuiInputBase-root": {
        minHeight: 44,
      },
    }}
  />
);

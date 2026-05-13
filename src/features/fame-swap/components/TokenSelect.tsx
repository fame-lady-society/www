"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { FC } from "react";
import {
  FAME_SWAP_TOKENS,
  tokenForAddress,
  type FameSwapToken,
} from "../tokens";

export interface FameSwapTokenSelectProps {
  id: string;
  label: string;
  value: FameSwapToken;
  disabled?: boolean;
  onChange: (token: FameSwapToken) => void;
}

export const FameSwapTokenSelect: FC<FameSwapTokenSelectProps> = ({
  id,
  label,
  value,
  disabled,
  onChange,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const token = tokenForAddress(event.target.value as FameSwapToken["address"]);
    if (token) onChange(token);
  };

  return (
    <FormControl fullWidth size="small">
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value.address}
        label={label}
        disabled={disabled}
        onChange={handleChange}
        inputProps={{ "aria-label": label }}
        sx={{ minHeight: 44 }}
      >
        {FAME_SWAP_TOKENS.map((token) => (
          <MenuItem key={token.address} value={token.address}>
            {token.symbol}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

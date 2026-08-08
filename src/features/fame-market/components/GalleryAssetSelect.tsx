"use client";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CheckIcon from "@mui/icons-material/Check";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { alpha, styled } from "@mui/material/styles";

const AssetSelectRoot = styled("div")({
  position: "relative",
  flexShrink: 0,
});

const AssetSelectButton = styled("button")(({ theme }) => ({
  boxSizing: "border-box",
  width: "100%",
  minHeight: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  padding: "8px 10px 8px 14px",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: "transparent",
  color: theme.palette.text.primary,
  font: "inherit",
  lineHeight: 1.4375,
  textAlign: "left",
  cursor: "pointer",
  transition: theme.transitions.create(["border-color", "box-shadow"]),
  "&:hover": {
    borderColor: theme.palette.text.primary,
  },
  "&:focus-visible": {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
  "&[data-open]": {
    borderColor: theme.palette.primary.main,
    boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}`,
  },
  "&[data-disabled]": {
    borderColor: theme.palette.divider,
    color: theme.palette.text.disabled,
    cursor: "default",
  },
  "& .GalleryAssetSelect-arrow": {
    flexShrink: 0,
    color: theme.palette.text.secondary,
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  },
  "&[data-open] .GalleryAssetSelect-arrow": {
    transform: "rotate(180deg)",
  },
}));

const AssetSelectOptions = styled("div")(({ theme }) => ({
  position: "absolute",
  zIndex: theme.zIndex.modal,
  top: "calc(100% + 6px)",
  right: 0,
  boxSizing: "border-box",
  minWidth: "100%",
  maxHeight: 240,
  margin: 0,
  padding: 4,
  overflowY: "auto",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[8],
  outline: 0,
  whiteSpace: "nowrap",
  transition: theme.transitions.create(["opacity", "transform"], {
    duration: theme.transitions.duration.shortest,
  }),
  "&[data-closed]": {
    opacity: 0,
    transform: "translateY(-4px)",
  },
}));

const AssetSelectOption = styled("div")(({ theme }) => ({
  minHeight: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  padding: "7px 10px",
  borderRadius: theme.shape.borderRadius,
  cursor: "pointer",
  userSelect: "none",
  "&[data-focus]": {
    backgroundColor: theme.palette.action.hover,
  },
  "&[data-selected]": {
    backgroundColor: alpha(theme.palette.primary.main, 0.14),
    color: theme.palette.primary.main,
    fontWeight: 700,
  },
  "&[data-selected][data-focus]": {
    backgroundColor: alpha(theme.palette.primary.main, 0.22),
  },
  "& .GalleryAssetSelect-check": {
    flexShrink: 0,
    fontSize: 18,
  },
}));

export function GalleryAssetSelect<T extends string>({
  value,
  options,
  disabled = false,
  ariaLabel,
  onChange,
  minWidth = 132,
}: {
  value: T;
  options: readonly T[];
  disabled?: boolean;
  ariaLabel: string;
  onChange: (value: T) => void;
  minWidth?: number;
}) {
  return (
    <Listbox
      as={AssetSelectRoot}
      value={value}
      disabled={disabled}
      onChange={onChange}
      style={{ minWidth }}
    >
      <ListboxButton as={AssetSelectButton} aria-label={ariaLabel}>
        <span>{value}</span>
        <ArrowDropDownIcon
          aria-hidden="true"
          className="GalleryAssetSelect-arrow"
          fontSize="small"
        />
      </ListboxButton>
      <ListboxOptions as={AssetSelectOptions} modal={false} transition>
        {options.map((option) => (
          <ListboxOption as={AssetSelectOption} key={option} value={option}>
            {({ selected }) => (
              <>
                <span>{option}</span>
                {selected ? (
                  <CheckIcon
                    aria-hidden="true"
                    className="GalleryAssetSelect-check"
                  />
                ) : null}
              </>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

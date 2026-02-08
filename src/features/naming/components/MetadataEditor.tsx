"use client";

import { type FC, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import { toHex } from "viem";
import { METADATA_KEYS } from "../hooks/useIdentity";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";

export interface MetadataEditorProps {
  network: NetworkType;
  currentDescription: string;
  currentWebsite: string;
  disabled?: boolean;
  onFieldChange: (
    id: string,
    key: typeof METADATA_KEYS.description | typeof METADATA_KEYS.website,
    value: `0x${string}`,
    label: string,
  ) => void;
  onFieldReset: (id: string) => void;
}

export const MetadataEditor: FC<MetadataEditorProps> = ({
  currentDescription,
  currentWebsite,
  disabled = false,
  onFieldChange,
  onFieldReset,
}) => {
  const [description, setDescription] = useState(currentDescription);
  const [website, setWebsite] = useState(currentWebsite);

  useEffect(() => {
    setDescription(currentDescription);
    setWebsite(currentWebsite);
    onFieldReset("description");
    onFieldReset("website");
  }, [currentDescription, currentWebsite, onFieldReset]);
  const hasDescriptionChanged = description !== currentDescription;
  const hasWebsiteChanged = website !== currentWebsite;

  return (
    <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box component="div">
        <TextField
          label="Description"
          value={description}
          onChange={(e) => {
            const nextValue = e.target.value;
            setDescription(nextValue);
            if (nextValue !== currentDescription) {
              onFieldChange(
                "description",
                METADATA_KEYS.description,
                toHex(nextValue),
                "Update description",
              );
            } else {
              onFieldReset("description");
            }
          }}
          fullWidth
          multiline
          rows={3}
          placeholder="Tell the community about yourself..."
          disabled={disabled}
        />
        {hasDescriptionChanged && (
          <Box component="div" sx={{ mt: 1 }}>
            <Chip label="Modified" size="small" color="warning" />
          </Box>
        )}
      </Box>

      <Box component="div">
        <TextField
          label="Website"
          value={website}
          onChange={(e) => {
            const nextValue = e.target.value;
            setWebsite(nextValue);
            if (nextValue !== currentWebsite) {
              onFieldChange(
                "website",
                METADATA_KEYS.website,
                toHex(nextValue),
                "Update website",
              );
            } else {
              onFieldReset("website");
            }
          }}
          fullWidth
          placeholder="https://your-website.com"
          disabled={disabled}
        />
        {hasWebsiteChanged && (
          <Box component="div" sx={{ mt: 1 }}>
            <Chip label="Modified" size="small" color="warning" />
          </Box>
        )}
      </Box>
    </Box>
  );
};

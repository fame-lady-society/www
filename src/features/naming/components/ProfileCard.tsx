"use client";

import { type FC } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Link from "next/link";
import type { Identity } from "../hooks/useAllIdentities";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import { normalize } from "viem/ens";
import { encodeIdentifier, parseIdentifier } from "../utils/networkUtils";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export interface ProfileCardProps {
  identity: Identity;
  network: NetworkType;
}

export const ProfileCard: FC<ProfileCardProps> = ({ identity, network }) => {
  const { tokenId, name, primaryAddress, primaryTokenId } = identity;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={`/${network}/~/${encodeIdentifier(name)}`}
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box
            component="div"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "70%",
              }}
            >
              {name}
            </Typography>
            <Chip
              label={`#${tokenId.toString()}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.75rem" }}
            />
          </Box>

          <Box component="div" sx={{ mt: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <span style={{ opacity: 0.7 }}>Primary:</span>
              <code
                style={{
                  fontSize: "0.8rem",
                  backgroundColor: "rgba(0,0,0,0.05)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {truncateAddress(primaryAddress)}
              </code>
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <span style={{ opacity: 0.7 }}>Bound NFT:</span>
              <Chip
                label={`#${primaryTokenId.toString()}`}
                size="small"
                sx={{ fontSize: "0.7rem", height: "20px" }}
              />
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

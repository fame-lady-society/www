"use client";

import { type FC } from "react";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Link from "next/link";
import type { Identity } from "../hooks/useAllIdentities";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import { encodeIdentifier } from "../utils/networkUtils";
import { SocialCheckmark } from "./SocialCheckmark";
import { normalize } from "viem/ens";

export interface ProfileCardProps {
  identity: Identity;
  network: NetworkType;
}

const BASE_IMAGE_URL = "https://fame.support/fls/thumb/";

export const ProfileCard: FC<ProfileCardProps> = ({ identity, network }) => {
  const { name, socialHandles } = identity;
  const discordHandle = socialHandles.discord;
  const xHandle = socialHandles.x;
  const hasHandles = !!discordHandle || !!xHandle;

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
        href={`/${network}/~/${encodeIdentifier(normalize(name))}`}
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar src={`${BASE_IMAGE_URL}${identity.primaryTokenId}`} sx={{ marginRight: 1 }}/>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </Typography>
            {hasHandles && <SocialCheckmark />}
          </Box>

          {hasHandles && (
            <Box component="div" sx={{ mt: 1.5, display: "grid", gap: 0.5 }}>
              {discordHandle && (
                <Typography variant="body2" color="text.secondary">
                  Discord: <strong>{discordHandle}</strong>
                </Typography>
              )}
              {xHandle && (
                <Typography variant="body2" color="text.secondary">
                  X: <strong>{xHandle}</strong>
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

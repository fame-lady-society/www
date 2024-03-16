import React, { FC, useMemo, useState } from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import { imageUrl } from "@/service/image";

export interface TokenProps {
  tokenId?: bigint;
  url?: string;
}

export const TokenSelect: FC<{
  tokens: readonly TokenProps[];
}> = ({ tokens }) => {
  const gridTokens = useMemo(
    () =>
      tokens.map(({ tokenId }) => {
        const t = Number(tokenId);
        return (
          <>
            <CardHeader title={`FLS ${t}`} />
            <CardMedia
              component="img"
              image={imageUrl(t)}
              sx={{
                objectFit: "contain",
                width: "100%",
                transition: "transform 0.5s ease-in-out",
              }}
            />
          </>
        );
      }),
    [tokens],
  );
  return (
    <Grid2 container spacing={1}>
      {tokens.map(({ tokenId, url }, i) => {
        return (
          <Grid2 xs={12} sm={6} md={4} lg={3} key={tokenId}>
            <Card>
              {typeof tokenId === "bigint" && typeof url === "string" ? (
                <CardActionArea href={url}>{gridTokens[i]}</CardActionArea>
              ) : (
                gridTokens[i]
              )}
            </Card>
          </Grid2>
        );
      })}
    </Grid2>
  );
};

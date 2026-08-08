"use client";

import Image from "next/image";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useGalleryMetadata } from "../hooks/useGalleryMetadata";
import type { GalleryLiquidityToken } from "../liquidity/reads";

export function GalleryLiquidityTokenCard({
  token,
  selected,
  selectable,
  disabled,
  onSelect,
}: {
  token: GalleryLiquidityToken;
  selected: boolean;
  selectable: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const metadata = useGalleryMetadata(token.tokenUri ?? "").metadata;
  const name =
    metadata.status === "ready" && metadata.name
      ? metadata.name
      : `Society #${token.tokenId.toString()}`;
  const content = (
    <>
      <div
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          backgroundColor: "#212121",
        }}
      >
        <Image
          src={metadata.image}
          alt={
            metadata.status === "ready"
              ? `${name} artwork`
              : "Artwork unavailable"
          }
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          {selectable ? (
            <Checkbox checked={selected} disabled={disabled} tabIndex={-1} />
          ) : null}
          <div style={{ minWidth: 0 }}>
            <Typography component="h2" variant="h6" noWrap>
              {name}
            </Typography>
            <Typography color="text.secondary">
              Society #{token.tokenId.toString()}
            </Typography>
          </div>
        </Stack>
      </CardContent>
    </>
  );
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderColor: selected ? "primary.main" : "divider",
      }}
    >
      {selectable ? (
        <CardActionArea
          disabled={disabled}
          onClick={onSelect}
          aria-pressed={selected}
          sx={{ height: "100%", alignItems: "stretch" }}
        >
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}

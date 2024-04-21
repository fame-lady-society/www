import React, { FC, useState } from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { IMetadata, imageUrl } from "@/utils/metadata";
import { SocialShareDialog } from "@/features/customize/components/SocialShare";
import Button from "@mui/material/Button";

const Attribute: FC<{ name: string; value: string | number }> = ({
  name,
  value,
}) => {
  return (
    <Box
      component="div"
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
      alignContent="center"
      padding={2}
    >
      <Typography variant="body1" color="text.secondary">
        {name}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
};

export const Token: FC<{
  metadata: IMetadata;
  tokenId: number;
  network?: "mainnet" | "sepolia";
}> = ({ metadata, tokenId, network }) => {
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <>
      <Grid2 container spacing={2}>
        <Grid2 xs={12} lg={6}>
          <Paper
            elevation={3}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%",
            }}
          >
            {metadata.name && (
              <Button onClick={() => setShareOpen(true)}>Share</Button>
            )}
            <Typography variant="h4" align="center">
              {metadata.name}
            </Typography>
            <Box
              component="div"
              display="flex"
              flexDirection="row"
              justifyContent="center"
              alignContent="center"
            >
              <Image
                src={imageUrl(tokenId)}
                width={800}
                height={800}
                alt="Fame Lady Society Token Image"
                sizes="100vw"
                style={{
                  width: "100%",
                  height: "auto",
                  maxWidth: "100%",
                }}
              />
            </Box>
          </Paper>
        </Grid2>
        <Grid2 xs={12} lg={6}>
          <Paper elevation={3} sx={{ p: 2, height: "100%" }}>
            <Typography variant="body1" color="text.secondary">
              {metadata.description?.split("\n").map((line) => (
                <>
                  {line}
                  <br />
                </>
              ))}
            </Typography>
            {metadata.attributes?.map(({ trait_type, value }) => {
              return (
                <Attribute
                  key={`${trait_type}:${value}`}
                  name={trait_type}
                  value={value}
                />
              );
            })}
          </Paper>
        </Grid2>
      </Grid2>
      <SocialShareDialog
        name={metadata.name!}
        tokenId={BigInt(tokenId)}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        network={network}
      />
    </>
  );
};
7;

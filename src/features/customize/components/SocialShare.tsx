import React, { FC, useState } from "react";

import XIcon from "@mui/icons-material/X";
import Button from "@mui/material/Button";
import NextImage from "next/image";

import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import { mainnet } from "viem/chains";
import { useChainId } from "wagmi";
import Skeleton from "@mui/material/Skeleton";

const SHARE_TEXT = (tokenId: bigint, name: string) =>
  `My lady is not number ${tokenId}%0A%0AIntroducing ${name}!`;

export const SocialShareDialog: FC<{
  name: string;
  tokenId: bigint;
  open: boolean;
  network?: "mainnet" | "sepolia";
  onClose: () => void;
}> = ({ name, tokenId, open, onClose, network }) => {
  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <SocialShare
          name={name}
          tokenId={tokenId}
          onClose={onClose}
          network={network}
        />
      </Dialog>
    </>
  );
};

export const SocialShare: FC<{
  tokenId: bigint;
  name: string;
  network?: "mainnet" | "sepolia";
  onClose?: () => void;
}> = ({ tokenId, name, network: propsNetwork, onClose }) => {
  const chainId = useChainId();
  const network =
    propsNetwork ?? chainId === mainnet.id ? "mainnet" : "sepolia";
  const imgUrl = `${process.env.OG_BASE_URL}/${network}/og/token/${tokenId}`;
  const shareUrl = `${process.env.OG_BASE_URL}/${network}/token/${tokenId}`;

  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <Card>
      <CardHeader title="Share" />
      {!imageLoaded && (
        <Skeleton
          variant="rectangular"
          width={1100}
          style={{ paddingTop: "52.36%" }}
        />
      )}
      <CardMedia
        component="img"
        src={imgUrl}
        onLoad={() => setImageLoaded(true)}
        style={{ display: imageLoaded ? "block" : "none" }}
      />
      <CardContent>
        <Typography variant="body2" color="textSecondary">
          (if sharing on x, copy the image above so that you can paste the image
          to the post)
        </Typography>

        <Typography variant="body2" color="textPrimary" mt={1}>
          Share on
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          href={`https://twitter.com/intent/tweet?text=${SHARE_TEXT(tokenId, name)}%0A&url=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<XIcon />}
        >
          Twitter
        </Button>
        <Button
          href={`https://warpcast.com/~/compose?text=${SHARE_TEXT(tokenId, name)}&embeds[]=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={
            <NextImage
              src="/images/logos/warpcast.png"
              width={24}
              height={24}
              alt=""
            />
          }
        >
          Warpcast
        </Button>

        {onClose && <Button onClick={onClose}>Close</Button>}
      </CardActions>
    </Card>
  );
};

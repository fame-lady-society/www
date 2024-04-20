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
  onClose: () => void;
}> = ({ name, tokenId, open, onClose }) => {
  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <SocialShare name={name} tokenId={tokenId} onClose={onClose} />
      </Dialog>
    </>
  );
};

export const SocialShare: FC<{
  tokenId: bigint;
  name: string;
  onClose?: () => void;
}> = ({ tokenId, name, onClose }) => {
  const chainId = useChainId();
  const network = chainId === mainnet.id ? "mainnet" : "sepolia";
  const url = `${process.env.OG_BASE_URL}/${network}/og/token/${tokenId}`;
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
        src={`/${network}/og/token/${tokenId}`}
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
          href={`https://twitter.com/intent/tweet?text=${SHARE_TEXT(tokenId, name)}`}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<XIcon />}
        >
          Twitter
        </Button>
        <Button
          href={`https://warpcast.com/~/compose?text=${SHARE_TEXT(tokenId, name)}&embeds[]=${url}`}
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

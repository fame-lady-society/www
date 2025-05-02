"use client";

import React, { FC } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useSIWE } from "connectkit";
import { useAccount, useReadContract } from "wagmi";
import { erc721Abi } from "viem";
import { funknloveAddressForChain } from "../../contracts";
import { mainnet } from "viem/chains";

const WAV_DOWNLOAD_URL =
  "https://gateway.irys.xyz/QuFCpGHBlG8bbXcZ1PyLgQNa-ZKJ6k_KgSZfKxQoKTA";
const MP3_DOWNLOAD_URL =
  "https://gateway.irys.xyz/m-VEsFtuZcyAf9-E-HZrKA-ULqmzQK3RWqaSyKFpwAQ";
const M4A_DOWNLOAD_URL =
  "https://gateway.irys.xyz/XDg0FN6HM4H76wvCqBi_wUK0r8ZLm1GHorZHK0ouiL0";

const DownloadCard: FC = () => {
  const { isSignedIn } = useSIWE();
  const { address } = useAccount();
  const { data, isLoading } = useReadContract({
    address: funknloveAddressForChain(mainnet.id),
    abi: erc721Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  return (
    <Card sx={{ mt: 2, mb: 6 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Download &quot;Funk N&apos; Love&quot;
        </Typography>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <CircularProgress />
          </div>
        ) : data && data > 0n && isSignedIn ? (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose your preferred audio format:
            </Typography>
            <CardActions>
              <Button
                component="a"
                href={WAV_DOWNLOAD_URL}
                download="funknlove.wav"
                size="small"
              >
                WAV
              </Button>
              <Button
                component="a"
                href={MP3_DOWNLOAD_URL}
                download="funknlove.mp3"
                size="small"
              >
                MP3
              </Button>
              <Button
                component="a"
                href={M4A_DOWNLOAD_URL}
                download="funknlove.m4a"
                size="small"
              >
                M4A
              </Button>
            </CardActions>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            You need to own the NFT to download the audio files.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadCard;

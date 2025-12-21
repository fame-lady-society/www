"use client";

import React, { FC } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { useSIWE } from "connectkit";
import { useReadContract } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
import { erc721Abi } from "viem";
import { lingerieDreamsAddressForChain } from "../../contracts";
import { polygon } from "viem/chains";

const WAV_DOWNLOAD_URL =
  "https://gateway.irys.xyz/vGa10Rq5QKEDrAOEnsfwbOinjcdq0GtBkjGrXmfdO2U/Lingerie Dreams.wav";
const MP3_DOWNLOAD_URL =
  "https://gateway.irys.xyz/vGa10Rq5QKEDrAOEnsfwbOinjcdq0GtBkjGrXmfdO2U/Lingerie Dreams.mp3";
const M4A_DOWNLOAD_URL =
  "https://gateway.irys.xyz/vGa10Rq5QKEDrAOEnsfwbOinjcdq0GtBkjGrXmfdO2U/Lingerie Dreams.m4a";

const DownloadCard: FC = () => {
  const { isSignedIn } = useSIWE();
  const { address } = useAccount();
  const { data, isLoading } = useReadContract({
    address: lingerieDreamsAddressForChain(polygon.id),
    abi: erc721Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  console.log("data", data);

  return (
    <Card sx={{ mt: 2, mb: 6 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Download &quot;Lingerie Dreams&quot;
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
                download="Lingerie Dreams.wav"
                size="small"
              >
                WAV
              </Button>
              <Button
                component="a"
                href={MP3_DOWNLOAD_URL}
                download="Lingerie Dreams.mp3"
                size="small"
              >
                MP3
              </Button>
              <Button
                component="a"
                href={M4A_DOWNLOAD_URL}
                download="Lingerie Dreams.m4a"
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

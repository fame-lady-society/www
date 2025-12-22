import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

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
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CircularProgress from "@mui/material/CircularProgress";

import { TransactionsModal } from "@/features/wrap/components/TransactionsModal";
import { Transaction } from "@/features/wrap/types";
import { useNotifications } from "@/features/notifications/Context";
import { useLaunchZoraCoin } from "../hooks/useLaunchZoraCoin";
import { useAccount } from "@/hooks/useAccount";

export const SocialShareDialog: FC<{
  name: string;
  tokenId: bigint;
  description: string;
  symbol: string;
  open: boolean;
  network?: "mainnet" | "sepolia";
  textProvider: (tokenId: bigint, name: string) => string;
  onClose: () => void;
}> = ({
  name,
  tokenId,
  description,
  symbol,
  open,
  onClose,
  network,
  textProvider,
}) => {
  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <SocialShare
          name={name}
          tokenId={tokenId}
          description={description}
          symbol={symbol}
          onClose={onClose}
          network={network}
          textProvider={textProvider}
        />
      </Dialog>
    </>
  );
};

export const SocialShare: FC<{
  tokenId: bigint;
  name: string;
  description: string;
  symbol: string;
  network?: "mainnet" | "sepolia";
  textProvider: (tokenId: bigint, name: string) => string;
  onClose?: () => void;
}> = ({
  tokenId,
  name,
  description,
  symbol,
  network: propsNetwork,
  textProvider,
  onClose,
}) => {
  const { isSignedIn, signIn } = useAccount();
  const chainId = useChainId();
  const network =
    propsNetwork ?? chainId === mainnet.id ? "mainnet" : "sepolia";
  const imgUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${network}/og/token/${tokenId}`;
  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${network}/token/${tokenId}`;

  const { addNotification } = useNotifications();
  const { mutateAsync, isPending, reset } = useLaunchZoraCoin();
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    [],
  );
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!transactionModalOpen && pendingTransactions.length === 0) {
      reset();
    }
  }, [pendingTransactions.length, transactionModalOpen, reset]);

  const onZoraLaunch = useCallback(async () => {
    try {
      if (!isSignedIn) {
        const signedIn = await signIn();
        if (!signedIn) {
          addNotification({
            id: "zora-sign-in-required",
            message: "Please sign-in with Ethereum to launch a coin.",
            type: "error",
            autoHideMs: 7000,
          });
          return;
        }
      }

      const transactions = await mutateAsync({
        tokenId,
        name,
        symbol,
        description,
      });
      if (transactions.length === 0) {
        addNotification({
          id: "zora-empty-bundle",
          message: "No transactions returned from Zora.",
          type: "info",
          autoHideMs: 5000,
        });
        return;
      }
      setPendingTransactions(transactions);
      setTransactionModalOpen(true);
    } catch (error: any) {
      addNotification({
        id: "zora-launch-error",
        message: String(error?.message ?? error),
        type: "error",
        autoHideMs: 8000,
      });
    }
  }, [
    addNotification,
    isSignedIn,
    mutateAsync,
    network,
    signIn,
    tokenId,
    name,
    symbol,
    description,
  ]);

  const onTransactionConfirmed = useCallback(
    (tx: Transaction) => {
      setPendingTransactions((current) =>
        current.filter((candidate) => candidate.hash !== tx.hash),
      );
    },
    [setPendingTransactions],
  );

  useEffect(() => {
    if (pendingTransactions.length === 0 && transactionModalOpen) {
      setTransactionModalOpen(false);
    }
  }, [pendingTransactions.length, transactionModalOpen]);

  const zoraButtonContent = useMemo(() => {
    if (isPending) {
      return <CircularProgress size={20} />;
    }
    return (
      <>
        <RocketLaunchIcon fontSize="small" sx={{ mr: 1 }} />
        Launch on Zora
      </>
    );
  }, [isPending]);

  return (
    <>
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
            (if sharing on x, copy the image above so that you can paste the
            image to the post)
          </Typography>

          <Typography variant="body2" color="textPrimary" mt={1}>
            Share on
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            href={`https://twitter.com/intent/tweet?text=${textProvider(tokenId, name)}%0A&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<XIcon />}
          >
            Twitter
          </Button>
          <Button
            href={`https://warpcast.com/~/compose?text=${textProvider(tokenId, name)}&embeds[]=${shareUrl}`}
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
          <Button onClick={onZoraLaunch} disabled={isPending}>
            {zoraButtonContent}
          </Button>

          {onClose && <Button onClick={onClose}>Close</Button>}
        </CardActions>
      </Card>
      <TransactionsModal
        open={transactionModalOpen}
        transactions={pendingTransactions}
        onTransactionConfirmed={onTransactionConfirmed}
        onClose={() => setTransactionModalOpen(false)}
      />
    </>
  );
};

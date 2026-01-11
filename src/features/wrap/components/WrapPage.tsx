"use client";
import { FC, useCallback, useEffect, useMemo, useState, PropsWithChildren } from "react";
import Box, { type BoxProps } from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useInView } from "react-intersection-observer";
import { useSpring, animated } from "react-spring";
import { MintCard } from "@/features/wrap/components/MintCard";
import {
  bulkMinterAbi,
  bulkMinterAddress,
  fameLadySquadAddress,
  fameLadySquadAbi,
} from "@/wagmi";
import { useAccount } from "@/hooks/useAccount";
import { useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { WriteContractData } from "wagmi/query";
import { useRouter } from "next/navigation";
import { WrapCard } from "./WrapCard";
import { DonateCard } from "./DonateCard";
import { UnwrapCard } from "./UnwrapCard";
import { TransactionsModal } from "./TransactionsModal";
import { Transaction } from "../types";
import { DonationCelebration } from "./DonationCelebration";
import { useChainContracts } from "@/hooks/useChainContracts";
import { useNotifications } from "@/features/notifications/Context";
import { ContractFunctionRevertedError, UserRejectedRequestError } from "viem";
import { useNetworkChain } from "../hooks/useNetworkChain";
import { WrappedLink } from "@/components/WrappedLink";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import ReplayIcon from "@mui/icons-material/Replay";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SecurityIcon from "@mui/icons-material/Security";
import LoopIcon from "@mui/icons-material/Loop";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

const AnimatedBox = animated(Box);

const AnimatedFadeIn: FC<PropsWithChildren<BoxProps & { delay?: number }>> = ({
  children,
  delay = 0,
  ...rest
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(30px)",
    config: { mass: 1, tension: 120, friction: 20 },
    delay: delay,
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const GradientText: FC<PropsWithChildren> = ({ children }) => (
  <Box
    component="span"
    sx={{
      background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 50%, #6b5bff 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}
  >
    {children}
  </Box>
);

const BenefitItem: FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <Box
    component="div"
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 2,
      p: 2,
      borderRadius: 2,
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "rgba(255,255,255,0.03)",
      },
    }}
  >
    <Box
      component="div"
      sx={{
        p: 1.5,
        borderRadius: 2,
        background: "linear-gradient(135deg, rgba(255, 107, 157, 0.15) 0%, rgba(196, 77, 255, 0.15) 100%)",
        color: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </Box>
    <Box component="div">
      <Typography fontWeight={600} mb={0.5}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
        {description}
      </Typography>
    </Box>
  </Box>
);

const StyledCard: FC<PropsWithChildren<{ title?: string; subtitle?: string; icon?: React.ReactNode }>> = ({
  children,
  title,
  subtitle,
  icon,
}) => (
  <Card
    sx={{
      background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(10px)",
      borderRadius: 3,
      overflow: "visible",
    }}
  >
    {(title || subtitle) && (
      <CardHeader
        avatar={icon}
        title={
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
        }
        subheader={
          subtitle && (
            <Typography color="text.secondary" variant="body2">
              {subtitle}
            </Typography>
          )
        }
        sx={{ pb: 0 }}
      />
    )}
    <CardContent>{children}</CardContent>
  </Card>
);

export const WrapPage: FC<{
  network: "mainnet" | "sepolia";
}> = ({ network }) => {
  const router = useRouter();
  const chain = useNetworkChain(network);
  const { address } = useAccount();
  const [nonce, setNonce] = useState<number>(0);
  const { addNotification } = useNotifications();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isTinyScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { writeContractAsync } = useWriteContract({
    mutation: {
      onError: (e) => {
        let message = e.message;
        if (e.cause instanceof UserRejectedRequestError) {
          message = e.cause.details;
        } else if (e.cause instanceof ContractFunctionRevertedError) {
          message = e.cause.shortMessage;
        }
        addNotification({
          id: "error",
          message,
          type: "error",
          autoHideMs: 5000,
        });
        setNonce((n) => n + 1);
      },
    },
  });

  const [pendingTransactions, setPendingTransactions] = useState(false);
  const [activeTransactionHashList, setActiveTransactionHashList] = useState<
    Transaction<unknown>[]
  >([]);
  const [completedTransactionHashList, setCompletedTransactionHashList] =
    useState<{ kind: string; hash: WriteContractData }[]>([]);
  const [pendingDonationTokens, setPendingDonationTokens] = useState<
    Record<string, string[]>
  >({});
  const [donationCelebration, setDonationCelebration] = useState<{
    tokenIds: string[];
    txHash?: string;
  } | null>(null);

  useEffect(() => {
    if (activeTransactionHashList.length > 0) {
      setPendingTransactions(true);
    } else {
      setPendingTransactions(false);
    }
  }, [activeTransactionHashList]);

  const mintTransactionInProgress = useMemo(() => {
    return activeTransactionHashList.some(
      (tx) => tx.kind === "mint testnet token",
    );
  }, [activeTransactionHashList]);

  const wrapTransactionInProgress = useMemo(() => {
    return activeTransactionHashList.some((tx) => tx.kind === "wrap");
  }, [activeTransactionHashList]);

  const unwrapTransactionInProgress = useMemo(() => {
    return activeTransactionHashList.some((tx) => tx.kind === "unwrap");
  }, [activeTransactionHashList]);

  const approveTransactionInProgress = useMemo(() => {
    return activeTransactionHashList.some(
      (tx) => tx.kind === "approve collection to be wrapped",
    );
  }, [activeTransactionHashList]);

  const donationTransactionInProgress = useMemo(() => {
    return activeTransactionHashList.some((tx) => tx.kind === "donate");
  }, [activeTransactionHashList]);

  const approveDonationTransactionInProgress = useMemo(() => {
    return activeTransactionHashList.some(
      (tx) => tx.kind === "approve donation vault",
    );
  }, [activeTransactionHashList]);

  const closeTransactionModal = useCallback(() => {
    setPendingTransactions(false);
  }, []);

  const {
    targetContractAbi: targetNftAbi,
    targetContractAddress: targetNftAddress,
    wrappedNftContractAbi: wrapperNftAbi,
    wrappedNftContractAddress: wrapperNftAddress,
    wrappedNftDonationVaultAbi,
    wrappedNftDonationVaultAddress,
  } = useChainContracts();

  const onMint = useCallback(
    async (count: bigint) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            args: [count],
            chainId: chain?.id,
            abi: bulkMinterAbi,
            address: bulkMinterAddress[11155111],
            functionName: "mint",
          });
          setActiveTransactionHashList((r) => [
            ...r,
            {
              kind: "mint testnet token",
              hash: response,
            },
          ]);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [writeContractAsync, chain],
  );

  const isValidToCheckApproval = address && wrapperNftAddress !== undefined;

  const {
    data: isWrappedApprovedForAll,
    refetch: refetchWrappedIsApprovedForAll,
  } = useReadContract({
    abi: targetNftAbi,
    address: targetNftAddress,
    functionName: "isApprovedForAll",
    ...(isValidToCheckApproval && {
      args: [address, wrapperNftAddress],
    }),
  });

  const donationApprovalArgs =
    address && wrappedNftDonationVaultAddress
      ? ([address, wrappedNftDonationVaultAddress] as const)
      : undefined;

  const {
    data: isDonationApprovedForAll,
    refetch: refetchDonationIsApprovedForAll,
  } = useReadContract({
    abi: targetNftAbi,
    address: targetNftAddress,
    functionName: "isApprovedForAll",
    ...(donationApprovalArgs && { args: donationApprovalArgs }),
  });

  const { data: ownedTestTokens, refetch: refetchTokens } = useReadContract({
    chainId: chain?.id,
    abi: bulkMinterAbi,
    address: chain?.id && bulkMinterAddress[chain?.id],
    functionName: "tokensOfOwner",
    args: address && [address],
  });

  const { data: balanceOf, refetch: refetchBalanceOf } = useReadContract({
    chainId: chain?.id,
    abi: targetNftAbi,
    address: targetNftAddress,
    functionName: "balanceOf",
    ...(address !== undefined && {
      args: [address],
    }),
  });

  const { data: fameLadySquadTokens, refetch: refetchFameLadySquadTokens } =
    useReadContracts({
      contracts: Array.from({ length: balanceOf ? Number(balanceOf) : 0 })?.map(
        (_, index) => ({
          chainId: chain?.id,
          abi: fameLadySquadAbi,
          address: chain?.id && fameLadySquadAddress[chain?.id],
          functionName: "tokenOfOwnerByIndex",
          args: [address, BigInt(index)],
        }),
      ) as {
        abi: typeof fameLadySquadAbi;
        address: `0x${string}`;
        functionName: "tokenOfOwnerByIndex";
        args: [`0x${string}`, bigint];
      }[],
    });

  const tokenIds = useMemo(
    () =>
      ownedTestTokens ||
      (fameLadySquadTokens
        ?.filter((t) => t.status === "success")
        .map((t) => t.result!) ??
        []),
    [ownedTestTokens, fameLadySquadTokens],
  );

  const { data: wrapCost } = useReadContract({
    chainId: chain?.id,
    abi: wrapperNftAbi,
    address: wrapperNftAddress,
    functionName: "wrapCost",
  });

  const onWrapTo = useCallback(
    async ({
      args,
      value,
    }: {
      args: [`0x${string}`, bigint[]];
      value: bigint;
    }) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            chainId: chain?.id,
            abi: wrapperNftAbi,
            address: wrapperNftAddress!,
            functionName: "wrapTo",
            args,
            value,
          });
          setActiveTransactionHashList((txs) => [
            ...txs,
            {
              kind: "wrap to",
              hash: response,
              context: args[0],
            },
          ]);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [wrapperNftAbi, wrapperNftAddress, writeContractAsync, chain],
  );

  const onWrap = useCallback(
    async ({ args, value }: { args: [bigint[]]; value: bigint }) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            chainId: chain?.id,
            abi: wrapperNftAbi,
            address: wrapperNftAddress!,
            functionName: "wrap",
            args,
            value,
          });
          setActiveTransactionHashList((txs) => [
            ...txs,
            {
              kind: "wrap",
              hash: response,
              context: args[0],
            },
          ]);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [wrapperNftAbi, wrapperNftAddress, writeContractAsync, chain],
  );

  const onDonate = useCallback(
    async ({ tokenIds }: { tokenIds: bigint[] }) => {
      if (
        writeContractAsync &&
        wrappedNftDonationVaultAbi &&
        wrappedNftDonationVaultAddress
      ) {
        try {
          const response = await writeContractAsync({
            chainId: chain?.id,
            abi: wrappedNftDonationVaultAbi,
            address: wrappedNftDonationVaultAddress,
            functionName: "wrapAndDonate",
            args: [tokenIds],
          });
          const donatedTokenIds = tokenIds.map((tokenId) => tokenId.toString());
          setPendingDonationTokens((previous) => ({
            ...previous,
            [response]: donatedTokenIds,
          }));
          setActiveTransactionHashList((txs) => [
            ...txs,
            {
              kind: "donate",
              hash: response,
              context: tokenIds,
            },
          ]);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [
      chain?.id,
      wrappedNftDonationVaultAddress,
      wrappedNftDonationVaultAbi,
      writeContractAsync,
    ],
  );

  const onUnwrapMany = useCallback(
    async (args: [`0x${string}`, bigint[]]) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            chainId: chain?.id,
            abi: wrapperNftAbi,
            address: wrapperNftAddress!,
            functionName: "unwrapMany",
            args,
          });
          setActiveTransactionHashList((txs) => [
            ...txs,
            {
              kind: "unwrap",
              hash: response,
            },
          ]);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [wrapperNftAbi, wrapperNftAddress, writeContractAsync, chain],
  );

  const onApprove = useCallback(async () => {
    if (writeContractAsync) {
      try {
        const response = await writeContractAsync({
          chainId: chain?.id,
          abi: targetNftAbi,
          address: targetNftAddress!,
          functionName: "setApprovalForAll",
          args: [wrapperNftAddress!, true],
        });
        setActiveTransactionHashList((txs) => [
          ...txs,
          {
            kind: "approve collection to be wrapped",
            hash: response,
          },
        ]);
      } catch (e) {
        console.error(e);
      }
    }
  }, [
    chain?.id,
    targetNftAbi,
    targetNftAddress,
    wrapperNftAddress,
    writeContractAsync,
  ]);

  const onApproveDonation = useCallback(async () => {
    if (
      writeContractAsync &&
      wrappedNftDonationVaultAddress &&
      targetNftAddress
    ) {
      try {
        const response = await writeContractAsync({
          chainId: chain?.id,
          abi: targetNftAbi,
          address: targetNftAddress,
          functionName: "setApprovalForAll",
          args: [wrappedNftDonationVaultAddress, true],
        });
        setActiveTransactionHashList((txs) => [
          ...txs,
          {
            kind: "approve donation vault",
            hash: response,
          },
        ]);
      } catch (e) {
        console.error(e);
      }
    }
  }, [
    chain?.id,
    targetNftAbi,
    targetNftAddress,
    wrappedNftDonationVaultAddress,
    writeContractAsync,
  ]);

  const onRevoke = useCallback(async () => {
    if (writeContractAsync && wrapperNftAddress && targetNftAddress) {
      try {
        const response = await writeContractAsync({
          chainId: chain?.id,
          abi: targetNftAbi,
          address: targetNftAddress,
          functionName: "setApprovalForAll",
          args: [wrapperNftAddress, false],
        });
        setActiveTransactionHashList((txs) => [
          ...txs,
          {
            kind: "revoke wrap approval",
            hash: response,
          },
        ]);
      } catch (e) {
        console.error(e);
      }
    }
  }, [
    chain?.id,
    targetNftAbi,
    targetNftAddress,
    wrapperNftAddress,
    writeContractAsync,
  ]);

  const onRevokeDonation = useCallback(async () => {
    if (
      writeContractAsync &&
      wrappedNftDonationVaultAddress &&
      targetNftAddress
    ) {
      try {
        const response = await writeContractAsync({
          chainId: chain?.id,
          abi: targetNftAbi,
          address: targetNftAddress,
          functionName: "setApprovalForAll",
          args: [wrappedNftDonationVaultAddress, false],
        });
        setActiveTransactionHashList((txs) => [
          ...txs,
          {
            kind: "revoke donation vault",
            hash: response,
          },
        ]);
      } catch (e) {
        console.error(e);
      }
    }
  }, [
    chain?.id,
    targetNftAbi,
    targetNftAddress,
    wrappedNftDonationVaultAddress,
    writeContractAsync,
  ]);

  const onTransactionConfirmed = useCallback(
    (tx: Transaction<unknown>) => {
      switch (tx.kind) {
        case "wrap": {
          const t = tx as Transaction<[bigint[]]>;
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "wrapped tokens",
              hash: tx.hash,
            },
          ]);
          const params = new URLSearchParams();
          params.set("tokenIds", t.context!.map((t) => t.toString()).join(","));
          params.set("txHash", tx.hash ?? "");
          router.push(`/wrap/success?${params.toString()}`);
          break;
        }
        case "wrap to": {
          const t = tx as Transaction<[bigint[]]>;
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "wrapped tokens",
              hash: tx.hash,
            },
          ]);
          const params = new URLSearchParams();
          params.set("tokenIds", t.context!.map((t) => t.toString()).join(","));
          params.set("txHash", tx.hash ?? "");
          router.push(`/wrap/success?${params.toString()}`);
          break;
        }
        case "donate": {
          const donatedTokenIds =
            pendingDonationTokens[tx.hash] ??
            (tx.context as bigint[] | undefined)?.map((tokenId) =>
              tokenId.toString(),
            ) ??
            [];
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "donated tokens",
              hash: tx.hash,
            },
          ]);
          refetchTokens();
          refetchFameLadySquadTokens?.();
          refetchBalanceOf?.();
          refetchDonationIsApprovedForAll?.();
          setPendingDonationTokens((previous) => {
            const { [tx.hash]: _unused, ...rest } = previous;
            return rest;
          });
          setDonationCelebration({
            tokenIds: donatedTokenIds,
            txHash: tx.hash,
          });
          setNonce((n) => n + 1);
          addNotification({
            id: `donation-success-${tx.hash}`,
            message: "Donation heading to the community vault. Thank you!",
            type: "success",
            autoHideMs: 5000,
          });
          break;
        }
        case "approve collection to be wrapped": {
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "approved tokens",
              hash: tx.hash,
            },
          ]);
          refetchWrappedIsApprovedForAll();
          break;
        }
        case "approve donation vault": {
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "approved donation",
              hash: tx.hash,
            },
          ]);
          refetchDonationIsApprovedForAll();
          break;
        }
        case "revoke wrap approval": {
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "revoked wrap approval",
              hash: tx.hash,
            },
          ]);
          refetchWrappedIsApprovedForAll();
          addNotification({
            id: `revoke-wrap-${tx.hash}`,
            message: "Wrap contract approval revoked",
            type: "info",
            autoHideMs: 5000,
          });
          break;
        }
        case "revoke donation vault": {
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "revoked donation",
              hash: tx.hash,
            },
          ]);
          refetchDonationIsApprovedForAll();
          addNotification({
            id: `revoke-donation-${tx.hash}`,
            message: "Donation vault approval revoked",
            type: "info",
            autoHideMs: 5000,
          });
          break;
        }
        case "mint testnet token": {
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "minted tokens",
              hash: tx.hash,
            },
          ]);
          refetchTokens();
        }
        case "unwrap": {
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "unwrapped tokens",
              hash: tx.hash,
            },
          ]);
          refetchTokens();
          refetchFameLadySquadTokens?.();
          refetchBalanceOf?.();
          setNonce((n) => n + 1);
          addNotification({
            id: `unwrap-success-${tx.hash}`,
            message: "Tokens unwrapped successfully!",
            type: "success",
            autoHideMs: 5000,
          });
          break;
        }
      }
      setActiveTransactionHashList((txs) =>
        txs.filter((t) => tx.hash !== t.hash),
      );
    },
    [
      addNotification,
      pendingDonationTokens,
      refetchBalanceOf,
      refetchDonationIsApprovedForAll,
      refetchFameLadySquadTokens,
      refetchTokens,
      refetchWrappedIsApprovedForAll,
      router,
    ],
  );

  return (
    <Box
      component="div"
      sx={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, rgba(196, 77, 255, 0.06) 0%, transparent 50%)",
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 10 }, pb: 6 }}>
        <AnimatedFadeIn component="div">
          <Box component="div" textAlign="center" mb={6}>
            <Chip
              label={network === "sepolia" ? "Testnet Mode" : "Ethereum Mainnet"}
              size="small"
              sx={{
                mb: 2,
                background: network === "sepolia"
                  ? "rgba(255, 193, 7, 0.15)"
                  : "rgba(107, 91, 255, 0.15)",
                color: network === "sepolia" ? "#ffc107" : "#6b5bff",
                fontWeight: 600,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{
                mb: 2,
                fontSize: isTinyScreen ? "2rem" : isSmallScreen ? "2.5rem" : "3.5rem",
                letterSpacing: "-0.03em",
              }}
            >
              Wrap Your <GradientText>Fame Lady</GradientText>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              maxWidth={700}
              mx="auto"
              lineHeight={1.7}
              sx={{ fontSize: { xs: "1rem", md: "1.15rem" } }}
            >
              Exchange your original Fame Lady Squad NFT for a Fame Lady Society
              NFT—same artwork, modern contract, community-controlled.
            </Typography>
          </Box>
        </AnimatedFadeIn>

        {/* Benefits Grid */}
        <AnimatedFadeIn component="div" delay={100}>
          <Grid2 container spacing={2} sx={{ mb: 6 }}>
            <Grid2 xs={12} md={4}>
              <BenefitItem
                icon={<LocalGasStationIcon />}
                title="Gas Efficient"
                description="Modern ERC721 contract optimized for lower transaction fees"
              />
            </Grid2>
            <Grid2 xs={12} md={4}>
              <BenefitItem
                icon={<SecurityIcon />}
                title="Community Royalties"
                description="Trading fees support the Fame Lady Society treasury"
              />
            </Grid2>
            <Grid2 xs={12} md={4}>
              <BenefitItem
                icon={<LoopIcon />}
                title="Fully Reversible"
                description="Unwrap anytime to receive your original NFT back"
              />
            </Grid2>
          </Grid2>
        </AnimatedFadeIn>

        <Divider sx={{ mb: 6, borderColor: "rgba(255,255,255,0.08)" }} />

        {/* Main Content Grid */}
        <Grid2 container spacing={4}>
          {/* Testnet Mint Card */}
          {network === "sepolia" && (
            <Grid2 xs={12}>
              <AnimatedFadeIn component="div" delay={150}>
                <StyledCard
                  title="Mint Testnet NFTs"
                  subtitle="For testing purposes only"
                  icon={
                    <Box
                      component="div"
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        background: "rgba(255, 193, 7, 0.15)",
                        color: "#ffc107",
                      }}
                    >
                      <RocketLaunchIcon />
                    </Box>
                  }
                >
                  <MintCard
                    onMint={onMint}
                    transactionInProgress={mintTransactionInProgress}
                  />
                </StyledCard>
              </AnimatedFadeIn>
            </Grid2>
          )}

          {/* Sweep and Wrap Card (Mainnet only) */}
          {network === "mainnet" && (
            <Grid2 xs={12}>
              <AnimatedFadeIn component="div" delay={150}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, rgba(107, 91, 255, 0.12) 0%, rgba(196, 77, 255, 0.08) 100%)",
                    border: "1px solid rgba(196, 77, 255, 0.2)",
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Grid2 container spacing={3} alignItems="center">
                      <Grid2 xs={12} md={8}>
                        <Box component="div" display="flex" alignItems="center" gap={2} mb={2}>
                          <Box
                            component="div"
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%)",
                              color: "#fff",
                            }}
                          >
                            <SwapHorizIcon />
                          </Box>
                          <Typography variant="h5" fontWeight={700}>
                            Sweep &amp; Wrap
                          </Typography>
                          <Chip label="NEW" size="small" color="primary" sx={{ fontWeight: 700 }} />
                        </Box>
                        <Typography color="text.secondary" mb={2} lineHeight={1.7}>
                          Fame Lady Squad NFTs can now be swept from OpenSea and wrapped
                          in a single transaction! Save a Fame Lady and bring her into
                          the Society.
                        </Typography>
                        <WrappedLink
                          href="/save-a-lady"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 3,
                            py: 1.5,
                            borderRadius: 2,
                            background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%)",
                            color: "#fff",
                            fontWeight: 700,
                            textDecoration: "none",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 8px 20px rgba(196, 77, 255, 0.3)",
                            },
                          }}
                        >
                          Browse OpenSea Listings →
                        </WrappedLink>
                      </Grid2>
                      <Grid2 xs={12} md={4} sx={{ display: { xs: "none", md: "block" } }}>
                        <Box
                          component="div"
                          sx={{
                            textAlign: "center",
                            fontSize: "4rem",
                          }}
                        >
                          🦸‍♀️
                        </Box>
                      </Grid2>
                    </Grid2>
                  </CardContent>
                </Card>
              </AnimatedFadeIn>
            </Grid2>
          )}

          {/* Wrap Section */}
          <Grid2 xs={12}>
            <AnimatedFadeIn component="div" delay={200}>
              <StyledCard>
                <WrapCard
                  isApprovedForAll={isWrappedApprovedForAll}
                  onApprove={onApprove}
                  onRevoke={onRevoke}
                  tokenIds={tokenIds ?? []}
                  wrapCost={wrapCost}
                  onWrap={onWrap}
                  onWrapTo={onWrapTo}
                  transactionInProgress={
                    wrapTransactionInProgress || approveTransactionInProgress
                  }
                  nonce={nonce}
                />
              </StyledCard>
            </AnimatedFadeIn>
          </Grid2>

          {/* Donate Section */}
          {wrappedNftDonationVaultAddress && (
            <Grid2 xs={12}>
              <AnimatedFadeIn component="div" delay={300}>
                <StyledCard
                  title="Donate to the Vault"
                  subtitle="Wrap fees are waived for donations"
                  icon={
                    <Box
                      component="div"
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        background: "rgba(76, 175, 80, 0.15)",
                        color: "#4caf50",
                      }}
                    >
                      <VolunteerActivismIcon />
                    </Box>
                  }
                >
                  <DonateCard
                    isApprovedForAll={isDonationApprovedForAll}
                    onApprove={onApproveDonation}
                    onRevoke={onRevokeDonation}
                    tokenIds={tokenIds ?? []}
                    onDonate={onDonate}
                    transactionInProgress={
                      donationTransactionInProgress ||
                      approveDonationTransactionInProgress
                    }
                    nonce={nonce}
                  />
                </StyledCard>
              </AnimatedFadeIn>
            </Grid2>
          )}

          {/* Unwrap Section */}
          <Grid2 xs={12}>
            <AnimatedFadeIn component="div" delay={350}>
              <StyledCard
                title="Unwrap"
                subtitle="Return your wrapped NFTs to originals"
                icon={
                  <Box
                    component="div"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      background: "rgba(255, 152, 0, 0.15)",
                      color: "#ff9800",
                    }}
                  >
                    <ReplayIcon />
                  </Box>
                }
              >
                <UnwrapCard
                  network={network}
                  transactionInProgress={unwrapTransactionInProgress}
                  onUnwrapMany={onUnwrapMany}
                  nonce={nonce}
                />
              </StyledCard>
            </AnimatedFadeIn>
          </Grid2>
        </Grid2>

        {/* FAQ Link */}
        <AnimatedFadeIn component="div" delay={350}>
          <Box
            component="div"
            sx={{
              mt: 8,
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={1}>
              Have questions about wrapping?
            </Typography>
            <Typography color="text.secondary" mb={2}>
              Check out our FAQ for detailed answers about the wrapping process.
            </Typography>
            <WrappedLink
              href="/faq#wrapping"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Read the FAQ →
            </WrappedLink>
          </Box>
        </AnimatedFadeIn>
      </Container>

      {/* Modals */}
      <TransactionsModal
        open={pendingTransactions}
        onClose={closeTransactionModal}
        transactions={activeTransactionHashList}
        onTransactionConfirmed={onTransactionConfirmed}
      />
      <DonationCelebration
        open={Boolean(donationCelebration)}
        onClose={() => setDonationCelebration(null)}
        tokenIds={donationCelebration?.tokenIds ?? []}
        txHash={donationCelebration?.txHash}
      />
    </Box>
  );
};

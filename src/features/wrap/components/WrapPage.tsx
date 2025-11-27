"use client";
import Box from "@mui/material/Box";
import { MintCard } from "@/features/wrap/components/MintCard";
import Grid2 from "@mui/material/Unstable_Grid2";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  bulkMinterAbi,
  bulkMinterAddress,
  fameLadySquadAddress,
  fameLadySquadAbi,
} from "@/wagmi";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { WriteContractData } from "wagmi/query";
import { useRouter } from "next/navigation";
import { WrapCard } from "./WrapCard";
import { DonateCard } from "./DonateCard";
import { TurboWrap } from "./TurboWrap";
import { TransactionsModal } from "./TransactionsModal";
import { Transaction } from "../types";
import { UnwrapCard } from "./UnwrapCard";
import { DonationCelebration } from "./DonationCelebration";
import { useChainContracts } from "@/hooks/useChainContracts";
import { useNotifications } from "@/features/notifications/Context";
import { ContractFunctionRevertedError, UserRejectedRequestError } from "viem";
import { useNetworkChain } from "../hooks/useNetworkChain";
import { WrappedLink } from "@/components/WrappedLink";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";

export const WrapPage: FC<{
  network: "mainnet" | "sepolia";
}> = ({ network }) => {
  const router = useRouter();
  const chain = useNetworkChain(network);
  const { address } = useAccount();
  const [nonce, setNonce] = useState<number>(0);
  const { addNotification } = useNotifications();
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
    query: {
      enabled: Boolean(targetNftAddress && donationApprovalArgs),
    },
  });

  // This only work on the test bulk minter contract, not fame lady squad
  const { data: ownedTestTokens, refetch: refetchTokens } = useReadContract({
    chainId: chain?.id,
    abi: bulkMinterAbi,
    address: chain?.id && bulkMinterAddress[chain?.id],
    functionName: "tokensOfOwner",
    args: address && [address],
  });

  // This is only needed for fame lady squad
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
    <>
      <Grid2 container spacing={2} maxWidth="lg" sx={{ mt: 6, mx: 4 }}>
        {network === "sepolia" ? (
          <Grid2 xs={12} sm={12} md={12}>
            <Box component="div" sx={{ mt: 4 }}>
              <MintCard
                onMint={onMint}
                transactionInProgress={mintTransactionInProgress}
              />
            </Box>
          </Grid2>
        ) : (
          <Grid2 xs={12} sm={12} md={12}>
            <Card>
              <CardHeader title="Sweep and Wrap" />
              <CardContent>
                ️
                <Typography variant="body1" component="div" sx={{ mb: 2 }}>
                  Fame Lady Squad NFTs can now be swept from Opensea and wrapped
                  in a single transaction!
                </Typography>
                <WrappedLink href="/save-a-lady">
                  <Typography variant="h6" component="div">
                    Browse OpenSea listings
                  </Typography>
                </WrappedLink>
              </CardContent>
            </Card>
          </Grid2>
        )}
        <Grid2 xs={12} sm={12} md={12}>
          <Box component="div" sx={{ mt: 4 }}>
            <TurboWrap
              isApprovedForAll={isWrappedApprovedForAll}
              onApprove={onApprove}
              tokenIds={tokenIds ?? []}
              wrapCost={wrapCost}
              onWrap={onWrap}
              onWrapTo={onWrapTo}
              transactionInProgress={
                wrapTransactionInProgress || approveTransactionInProgress
              }
              nonce={nonce}
            />
          </Box>
        </Grid2>
        <Grid2 xs={12} sm={12} md={12}>
          <Box component="div" sx={{ mt: 4 }}>
            <WrapCard
              isApprovedForAll={isWrappedApprovedForAll}
              onApprove={onApprove}
              tokenIds={tokenIds ?? []}
              wrapCost={wrapCost}
              onWrap={onWrap}
              onWrapTo={onWrapTo}
              transactionInProgress={
                wrapTransactionInProgress || approveTransactionInProgress
              }
              nonce={nonce}
            />
          </Box>
        </Grid2>
        {wrappedNftDonationVaultAddress ? (
          <Grid2 xs={12} sm={12} md={12}>
            <Box component="div" sx={{ mt: 4 }}>
              <DonateCard
                isApprovedForAll={isDonationApprovedForAll}
                onApprove={onApproveDonation}
                tokenIds={tokenIds ?? []}
                onDonate={onDonate}
                transactionInProgress={
                  donationTransactionInProgress ||
                  approveDonationTransactionInProgress
                }
                nonce={nonce}
              />
            </Box>
          </Grid2>
        ) : null}
        {/* <Grid2 xs={12} sm={12} md={12}>
          <Box component="div" sx={{ mt: 4 }}>
            <UnwrapCard
              onUnwrapMany={onUnwrapMany}
              transactionInProgress={unwrapTransactionInProgress}
            />
          </Box>
        </Grid2> */}
      </Grid2>
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
    </>
  );
};

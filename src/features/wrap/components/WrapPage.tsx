import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { MintCard } from "@/features/wrap/components/MintCard";
import Grid2 from "@mui/material/Unstable_Grid2";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import useLocalStorage from "use-local-storage";
import { AgreeModal } from "@/features/wrap/components/AgreeModal";
import {
  bulkMinterAbi,
  bulkMinterAddress,
  wrappedNftAbi,
  wrappedNftAddress,
  fameLadySocietyAbi,
  fameLadySocietyAddress,
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
import { useRouter } from "next/router";
import { WrapCard } from "./WrapCard";
import { TurboWrap } from "./TurboWrap";
import { TransactionsModal } from "./TransactionsModal";
import { Transaction } from "../types";
import { UnwrapCard } from "./UnwrapCard";

export const WrapPage: FC<{
  hasMint?: boolean;
}> = ({ hasMint = true }) => {
  const router = useRouter();
  const { address, chain } = useAccount();
  const [hasAgreed, setHasAgreed] = useLocalStorage("agree-to-risk", false);

  const { writeContractAsync } = useWriteContract();

  const [pendingTransactions, setPendingTransactions] = useState(false);
  const [activeTransactionHashList, setActiveTransactionHashList] = useState<
    Transaction[]
  >([]);
  const [completedTransactionHashList, setCompletedTransactionHashList] =
    useState<{ kind: string; hash: WriteContractData }[]>([]);
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

  const closeTransactionModal = useCallback(() => {
    setPendingTransactions(false);
  }, []);

  const targetNftAbi =
    chain?.id === 11155111 ? bulkMinterAbi : fameLadySquadAbi;
  const targetNftAddress =
    chain?.id === 11155111
      ? bulkMinterAddress[chain?.id]
      : chain?.id === 1
        ? fameLadySquadAddress[chain?.id]
        : undefined;
  const wrapperNftAbi =
    chain?.id === 11155111 ? wrappedNftAbi : fameLadySocietyAbi;
  const wrapperNftAddress =
    chain?.id === 11155111
      ? wrappedNftAddress[chain?.id]
      : chain?.id === 1
        ? fameLadySocietyAddress[chain?.id]
        : undefined;

  const onMint = useCallback(
    async (count: bigint) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            args: [count],
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
    [writeContractAsync],
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

  // This only work on the test bulk minter contract, not fame lady squad
  const { data: ownedTestTokens, refetch: refetchTokens } = useReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress[chain?.id],
    functionName: "tokensOfOwner",
    args: [address],
  });

  // This is only needed for fame lady squad
  const { data: balanceOf } = useReadContract({
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
          abi: fameLadySquadAbi,
          address: fameLadySquadAddress[chain?.id],
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
    () => ownedTestTokens || (fameLadySquadTokens?.map((t) => t.result) ?? []),
    [ownedTestTokens, fameLadySquadTokens],
  );

  const { data: wrapCost } = useReadContract({
    abi: wrapperNftAbi,
    address: wrapperNftAddress,
    functionName: "wrapCost",
  });

  const onWrapTo = useCallback(
    async ({ args, value }: { args: [string, bigint[]]; value: bigint }) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            abi: wrapperNftAbi,
            address: wrapperNftAddress,
            functionName: "wrapTo",
            args,
            value,
          });
          setActiveTransactionHashList((txs) => [
            ...txs,
            {
              kind: "wrap to",
              hash: response,
            },
          ]);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [wrapperNftAbi, wrapperNftAddress, writeContractAsync],
  );

  const onWrap = useCallback(
    async ({ args, value }: { args: [bigint[]]; value: bigint }) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            abi: wrapperNftAbi,
            address: wrapperNftAddress,
            functionName: "wrap",
            args,
            value,
          });
          setActiveTransactionHashList((txs) => [
            ...txs,
            {
              kind: "wrap",
              hash: response,
            },
          ]);
        } catch (e) {
          console.error(e);
        }
      }
    },
    [wrapperNftAbi, wrapperNftAddress, writeContractAsync],
  );

  const onUnwrapMany = useCallback(
    async (args: [string, bigint[]]) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            abi: wrapperNftAbi,
            address: wrapperNftAddress,
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
    [wrapperNftAbi, wrapperNftAddress, writeContractAsync],
  );

  const onApprove = useCallback(async () => {
    if (writeContractAsync) {
      try {
        const response = await writeContractAsync({
          abi: targetNftAbi,
          address: targetNftAddress,
          functionName: "setApprovalForAll",
          args: [wrapperNftAddress, true],
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
  }, [targetNftAbi, targetNftAddress, wrapperNftAddress, writeContractAsync]);

  const onTransactionConfirmed = useCallback(
    (tx: Transaction) => {
      switch (tx.kind) {
        case "wrap": {
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "wrapped tokens",
              hash: tx.hash,
            },
          ]);
          const params = new URLSearchParams();
          params.set("tokenIds", tokenIds.join(","));
          params.set("txHash", tx.hash ?? "");
          router.push(`/wrap/success?${params.toString()}`);
          break;
        }
        case "wrap to": {
          setCompletedTransactionHashList((txs) => [
            ...txs,
            {
              kind: "wrapped tokens",
              hash: tx.hash,
            },
          ]);
          const params = new URLSearchParams();
          params.set("tokenIds", tokenIds.join(","));
          params.set("txHash", tx.hash ?? "");
          router.push(`/wrap/success?${params.toString()}`);
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
    [refetchWrappedIsApprovedForAll, refetchTokens, router, tokenIds],
  );

  return (
    <>
      <Container maxWidth="lg">
        <Grid2 container spacing={2}>
          {hasMint ? (
            <Grid2 xs={12} sm={12} md={12}>
              <Box component="div" sx={{ mt: 4 }}>
                <MintCard
                  onMint={onMint}
                  transactionInProgress={mintTransactionInProgress}
                />
              </Box>
            </Grid2>
          ) : null}
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
              />
            </Box>
          </Grid2>
          <Grid2 xs={12} sm={12} md={12}>
            <Box component="div" sx={{ mt: 4 }}>
              <UnwrapCard
                onUnwrapMany={onUnwrapMany}
                transactionInProgress={unwrapTransactionInProgress}
              />
            </Box>
          </Grid2>
        </Grid2>
      </Container>
      {!hasAgreed && (
        <AgreeModal open={!hasAgreed} onClose={() => setHasAgreed(true)} />
      )}
      <TransactionsModal
        open={pendingTransactions}
        onClose={closeTransactionModal}
        transactions={activeTransactionHashList}
        onTransactionConfirmed={onTransactionConfirmed}
      />
    </>
  );
};

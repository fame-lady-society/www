import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { MintCard } from "@/features/wrap/components/MintCard";
import Grid2 from "@mui/material/Unstable_Grid2";
import {
  FC,
  FormEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BetaTurboWrap } from "@/features/wrap/components/BetaTurboWrap";
import { BetaWrapCard } from "@/features/wrap/components/BetaWrapCard";
import { UnwrapCard } from "@/features/wrap/components/UnWrapCard";
import useLocalStorage from "use-local-storage";
import { AgreeModal } from "@/features/wrap/components/AgreeModal";
import {
  bulkMinterAbi,
  bulkMinterAddress,
  wrappedNftAbi,
  wrappedNftAddress,
} from "@/wagmi";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { WriteContractData } from "wagmi/query";
import { TipCloseReason } from "./DevTipModal";
import { useRouter } from "next/router";
import { WrapCardContent } from "./SepoliaWrapCardContent";
import { TurboWrapContent } from "./SepoliaTurboWrapContent";
import { TransactionsModal } from "./TransactionsModal";
import { Transaction } from "../types";
import { wrap } from "module";
import { UnwrapCardContent } from "./SepoliaUnwrapCardContent";

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

  const isValidToCheckApproval =
    address && wrappedNftAddress[chain?.id] !== undefined;

  const {
    data: isWrappedApprovedForAll,
    refetch: refetchWrappedIsApprovedForAll,
  } = useReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress[chain?.id],
    functionName: "isApprovedForAll",
    ...(isValidToCheckApproval && {
      args: [address, wrappedNftAddress[chain?.id]],
    }),
  });

  const { data: balanceOf } = useReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress[chain?.id],
    functionName: "balanceOf",
    ...(address !== undefined && {
      args: [address],
    }),
  });
  const { data: ownedTestTokens, refetch: refetchTokens } = useReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress[chain?.id],
    functionName: "tokensOfOwner",
    args: [address],
  });

  const tokenIds = ownedTestTokens;

  const { data: wrapCost } = useReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress[chain?.id],
    functionName: "wrapCost",
  });

  const onWrapTo = useCallback(
    async ({ args, value }: { args: [string, bigint[]]; value: bigint }) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            abi: wrappedNftAbi,
            address: wrappedNftAddress[chain?.id],
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
    [chain?.id, writeContractAsync],
  );

  const onWrap = useCallback(
    async ({ args, value }: { args: [bigint[]]; value: bigint }) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            abi: wrappedNftAbi,
            address: wrappedNftAddress[chain?.id],
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
    [chain?.id, writeContractAsync],
  );

  const onUnwrapMany = useCallback(
    async (args: [string, bigint[]]) => {
      if (writeContractAsync) {
        try {
          const response = await writeContractAsync({
            abi: wrappedNftAbi,
            address: wrappedNftAddress[chain?.id],
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
    [chain?.id, writeContractAsync],
  );

  const onApprove = useCallback(async () => {
    if (writeContractAsync) {
      try {
        const response = await writeContractAsync({
          abi: wrappedNftAbi,
          address: wrappedNftAddress[chain?.id],
          functionName: "setApprovalForAll",
          args: [bulkMinterAddress[chain?.id], true],
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
  }, [chain?.id, writeContractAsync]);

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
              <TurboWrapContent
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
              <WrapCardContent
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
              <UnwrapCardContent
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

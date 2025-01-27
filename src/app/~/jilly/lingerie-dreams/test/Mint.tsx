"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { polygonAmoy } from "viem/chains";
import { TransactionsModal, Transaction } from "@/components/TransactionsModal";
import { useMint } from "./useMint";
import { useAccount, useReadContract, useSwitchChain } from "wagmi";
import { lingerieDreamsAddressForChain } from "./contracts";
import { erc721Abi } from "viem";
import { useMintLimit } from "./useMintLimit";

export const Mint: FC<{ chainId: typeof polygonAmoy.id }> = ({ chainId }) => {
  const { chainId: currentChainId, address } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const currentChain = chains.find((chain) => chain.id === chainId);
  const isWrongChain = currentChainId !== chainId;
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [activeTransactionHash, setActiveTransactionHash] = useState<
    `0x${string}` | null
  >(null);
  const [amount, setAmount] = useState(1);
  const { writeContractAsync, isPending } = useMint(chainId);
  const { data: mintLimit, isSuccess: mintLimitSuccess } =
    useMintLimit(chainId);
  const {
    data: balanceOf,
    isSuccess: balanceOfSuccess,
    refetch: balanceOfRefetch,
  } = useReadContract({
    chainId,
    address: lingerieDreamsAddressForChain(chainId),
    abi: erc721Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const onMint = useCallback(async () => {
    try {
      const result = await writeContractAsync(amount);
      setActiveTransactionHash(result);
      setTransactionModalOpen(true);
      setAmount(0);
      balanceOfRefetch();
    } catch (error) {
      console.error(error);
    }
  }, [amount, balanceOfRefetch, writeContractAsync]);

  const increment = useCallback(() => {
    if (amount < 3) setAmount(amount + 1);
    balanceOfRefetch();
  }, [amount, balanceOfRefetch]);

  const decrement = useCallback(() => {
    if (amount > 1) setAmount(amount - 1);
    balanceOfRefetch();
  }, [amount, balanceOfRefetch]);

  const modalTransactions = useMemo(
    () =>
      activeTransactionHash
        ? [{ hash: activeTransactionHash, kind: "mint" }]
        : [],
    [activeTransactionHash],
  );

  const allowedMint = useMemo(() => {
    if (!balanceOfSuccess || !mintLimitSuccess) return null;
    return mintLimit - Number(balanceOf);
  }, [balanceOf, balanceOfSuccess, mintLimit, mintLimitSuccess]);

  useEffect(() => {
    if (!mintLimitSuccess) return;
    setAmount((amount) => Math.min(amount, mintLimit));
  }, [mintLimit, mintLimitSuccess]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center">
        <button
          onClick={decrement}
          className="px-3 py-2 bg-purple-600 text-white rounded-l-lg hover:bg-purple-700 disabled:bg-purple-400"
          disabled={amount <= 1}
        >
          -
        </button>
        <input
          type="number"
          value={amount}
          readOnly
          className="w-16 text-center border-y border-purple-600 py-2 focus:outline-none bg-white text-black"
        />
        <button
          onClick={increment}
          className="px-3 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 disabled:bg-purple-400"
          disabled={amount >= (allowedMint ?? 3)}
        >
          +
        </button>
      </div>

      <button
        onClick={isWrongChain ? () => switchChain({ chainId }) : onMint}
        disabled={isPending}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 min-w-[200px]"
      >
        {isWrongChain && currentChain
          ? `Switch to ${currentChain?.name} to mint`
          : isPending
            ? "Minting..."
            : "Mint"}
      </button>
      <TransactionsModal
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        transactions={modalTransactions}
        onTransactionConfirmed={() => {}}
      />
    </div>
  );
};

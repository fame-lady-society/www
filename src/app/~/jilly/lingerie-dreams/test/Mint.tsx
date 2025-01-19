"use client";

import { FC, useCallback, useState } from "react";
import { polygonAmoy } from "viem/chains";
import { TransactionsModal, Transaction } from "@/components/TransactionsModal";
import { useMint } from "./useMint";

export const Mint: FC<{ chainId: typeof polygonAmoy.id }> = ({ chainId }) => {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [activeTransactionHash, setActiveTransactionHash] = useState<
    `0x${string}` | null
  >(null);
  const [amount, setAmount] = useState(1);
  const { writeContractAsync, isPending } = useMint(chainId);

  const onMint = useCallback(async () => {
    try {
      const result = await writeContractAsync(amount);
      setActiveTransactionHash(result);
      setTransactionModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  }, [amount, writeContractAsync]);

  const increment = () => {
    if (amount < 3) setAmount(amount + 1);
  };

  const decrement = () => {
    if (amount > 1) setAmount(amount - 1);
  };

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
          disabled={amount >= 3}
        >
          +
        </button>
      </div>

      <button
        onClick={onMint}
        disabled={isPending}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 min-w-[200px]"
      >
        {isPending ? "Minting..." : "Mint"}
      </button>
      <TransactionsModal
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        transactions={
          activeTransactionHash
            ? [{ hash: activeTransactionHash, kind: "mint" }]
            : []
        }
        onTransactionConfirmed={() => {}}
      />
    </div>
  );
};

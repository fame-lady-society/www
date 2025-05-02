"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { sepolia, mainnet } from "viem/chains";
import { TransactionsModal } from "@/components/TransactionsModal";
import { useMint } from "./hooks/useMint";
import { useAccount, useReadContract, useSwitchChain } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { funknloveAddressForChain } from "./contracts";
import { erc721Abi } from "viem";
import { useNotifications } from "@/features/notifications/Context";
import { useRouter } from "next/navigation";

const NAX_UNSIGNED_32BIT = 2 ** 32 - 1;

interface TokenAmountInputProps {
  amount: number;
  onIncrement: (amount: number) => void;
  onDecrement: (amount: number) => void;
  onRefetch: () => void;
}

const TokenAmountInput: FC<TokenAmountInputProps> = ({
  amount,
  onIncrement,
  onDecrement,
  onRefetch,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <button
          onClick={() => onDecrement(1)}
          className="px-3 py-2 bg-purple-600 text-white rounded-l-lg hover:bg-purple-700 disabled:bg-purple-400"
          disabled={amount <= 0}
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
          onClick={() => onIncrement(1)}
          className="px-3 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 disabled:bg-purple-400"
          disabled={amount >= NAX_UNSIGNED_32BIT}
        >
          +
        </button>
        <button
          onClick={() => onIncrement(1)}
          className="ml-4 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
          disabled={amount >= NAX_UNSIGNED_32BIT}
        >
          +1
        </button>
        <button
          onClick={() => onIncrement(3)}
          className="ml-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
          disabled={amount >= NAX_UNSIGNED_32BIT}
        >
          +3
        </button>
        <button
          onClick={() => onIncrement(5)}
          className="ml-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
          disabled={amount >= NAX_UNSIGNED_32BIT}
        >
          +5
        </button>
      </div>
    </div>
  );
};

export const Mint: FC<{
  chainId: typeof sepolia.id | typeof mainnet.id;
}> = ({ chainId }) => {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { chainId: currentChainId, address, isConnected } = useAccount();

  const { chains, switchChain } = useSwitchChain();
  const currentChain = chains.find((chain) => chain.id === chainId);
  const isWrongChain = currentChainId !== chainId;
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [activeTransactionHash, setActiveTransactionHash] = useState<
    `0x${string}` | null
  >(null);
  const [bronzeAmount, setBronzeAmount] = useState(1);
  const [silverAmount, setSilverAmount] = useState(0);
  const [goldAmount, setGoldAmount] = useState(0);
  const { writeContractAsync, isPending } = useMint(chainId);
  const {
    data: balanceOf,
    isSuccess: balanceOfSuccess,
    refetch: balanceOfRefetch,
  } = useReadContract({
    chainId,
    address: funknloveAddressForChain(chainId),
    abi: erc721Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const onMint = useCallback(async () => {
    try {
      const result = await writeContractAsync({
        bronze: bronzeAmount,
        silver: silverAmount,
        gold: goldAmount,
      });
      setActiveTransactionHash(result);
      setTransactionModalOpen(true);
      setBronzeAmount(0);
      setSilverAmount(0);
      setGoldAmount(0);
      balanceOfRefetch();
    } catch (error) {
      console.error(error);
    }
  }, [
    bronzeAmount,
    silverAmount,
    goldAmount,
    balanceOfRefetch,
    writeContractAsync,
  ]);

  const incrementBronze = useCallback(
    (amount: number) => {
      if (bronzeAmount + amount <= NAX_UNSIGNED_32BIT)
        setBronzeAmount(bronzeAmount + amount);
      balanceOfRefetch();
    },
    [bronzeAmount, balanceOfRefetch],
  );

  const decrementBronze = useCallback(
    (amount: number) => {
      if (bronzeAmount - amount >= 0) setBronzeAmount(bronzeAmount - amount);
      balanceOfRefetch();
    },
    [bronzeAmount, balanceOfRefetch],
  );

  const incrementSilver = useCallback(
    (amount: number) => {
      if (silverAmount + amount <= NAX_UNSIGNED_32BIT)
        setSilverAmount(silverAmount + amount);
      balanceOfRefetch();
    },
    [silverAmount, balanceOfRefetch],
  );

  const decrementSilver = useCallback(
    (amount: number) => {
      if (silverAmount - amount >= 0) setSilverAmount(silverAmount - amount);
      balanceOfRefetch();
    },
    [silverAmount, balanceOfRefetch],
  );

  const incrementGold = useCallback(
    (amount: number) => {
      if (goldAmount + amount <= NAX_UNSIGNED_32BIT)
        setGoldAmount(goldAmount + amount);
      balanceOfRefetch();
    },
    [goldAmount, balanceOfRefetch],
  );

  const decrementGold = useCallback(
    (amount: number) => {
      if (goldAmount - amount >= 0) setGoldAmount(goldAmount - amount);
      balanceOfRefetch();
    },
    [goldAmount, balanceOfRefetch],
  );

  const modalTransactions = useMemo(
    () =>
      activeTransactionHash
        ? [{ hash: activeTransactionHash, kind: "mint" }]
        : [],
    [activeTransactionHash],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <TokenAmountInput
        amount={bronzeAmount}
        onIncrement={incrementBronze}
        onDecrement={decrementBronze}
        onRefetch={balanceOfRefetch}
      />
      <TokenAmountInput
        amount={silverAmount}
        onIncrement={incrementSilver}
        onDecrement={decrementSilver}
        onRefetch={balanceOfRefetch}
      />
      <TokenAmountInput
        amount={goldAmount}
        onIncrement={incrementGold}
        onDecrement={decrementGold}
        onRefetch={balanceOfRefetch}
      />
      {isConnected ? (
        <button
          onClick={isWrongChain ? () => switchChain({ chainId }) : onMint}
          disabled={isPending}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 min-w-[200px]"
        >
          {isWrongChain && currentChain && isConnected
            ? `Switch to ${currentChain?.name} to mint`
            : !isConnected
              ? "Connect"
              : isPending
                ? "Minting..."
                : "Mint"}
        </button>
      ) : (
        <ConnectKitButton />
      )}
      <TransactionsModal
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        transactions={modalTransactions}
        onTransactionConfirmed={() => {
          setTransactionModalOpen(false);
          addNotification({
            id: "mint-success",
            message: "You have successfully minted",
            type: "success",
            autoHideMs: 5000,
          });
          setTimeout(() => {
            router.push(
              `/~/blu/funknlove/success/${chainId === mainnet.id ? "mainnet" : "sepolia"}/${activeTransactionHash}`,
            );
          }, 5000);
        }}
      />
    </div>
  );
};

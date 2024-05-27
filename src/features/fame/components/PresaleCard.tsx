import React, {
  ChangeEventHandler,
  FC,
  useCallback,
  useEffect,
  useState,
} from "react";
import * as sentry from "@sentry/nextjs";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import { useNotifications } from "@/features/notifications/Context";
import { fameSaleAbi, fameSaleTokenAbi } from "@/wagmi";
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { useProof } from "../hooks/useProof";
import { ContractFunctionExecutionError, formatEther, parseUnits } from "viem";
import CircularProgress from "@mui/material/CircularProgress";
import FormGroup from "@mui/material/FormGroup";
import Button from "@mui/material/Button";
import { WrappedLink } from "@/components/WrappedLink";
import { Transaction, TransactionsModal } from "./TransactionsModal";

import { styled } from "@mui/material/styles";
import MuiInput from "@mui/material/Input";
import { shortenHash } from "@/utils/hash";
import { ThankYouCard } from "./ThankYouCard";
import { fameSaleAddress, fameSaleTokenAddress } from "../contract";

const Input = styled(MuiInput)`
  width: 96px;
`;

const bigIntMax = (...args: bigint[]) => args.reduce((m, e) => (e > m ? e : m));
const bigIntMin = (...args: bigint[]) => args.reduce((m, e) => (e < m ? e : m));

export const PresaleCard: FC<{}> = () => {
  const [requestBuy, setRequestBuy] = useState<bigint>(0n);

  const { address, chain } = useAccount();
  const chainId = useChainId() as 11155111 | 8453;
  const { proof } = useProof();
  const { data: balance } = useBalance({
    address: fameSaleAddress[chainId],
  });

  const {
    data: [remaining, canProve, maxBuy, paused, currentBalance] = [],
    refetch,
  } = useReadContracts({
    contracts: [
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "raiseRemaining",
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "canProve",
        args: proof && address ? [proof, address] : undefined,
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "maxBuy",
      },
      {
        abi: fameSaleAbi,
        address: fameSaleAddress(chainId),
        functionName: "isPaused",
      },
      {
        abi: fameSaleTokenAbi,
        address: fameSaleTokenAddress(chainId),
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
    ],
  });

  const remainingBuy =
    currentBalance?.status === "success" &&
    remaining?.status === "success" &&
    maxBuy?.status === "success" &&
    canProve?.status === "success"
      ? bigIntMin(remaining.result, maxBuy.result - currentBalance.result)
      : 0n;

  const isValidBuy = requestBuy > 0n && requestBuy <= remainingBuy;

  const {
    writeContractAsync: writeFameSaleBuy,
    status: writeFameSaleBuyStatus,
  } = useWriteContract();

  // false means user has not requested a transaction
  // null means we want a transaction but can't send it yet
  // `0x` means we have a transaction hash
  const [isPendingTransaction, setIsPendingTransaction] = useState<
    false | null | Transaction[]
  >(false);
  const [buyInputError, setBuyInputError] = useState("");
  const { addNotification, removeNotification } = useNotifications();
  const onBuy = useCallback(async () => {
    if (isValidBuy && !proof) {
      setIsPendingTransaction(null);
      return;
    }
    if (isValidBuy && proof && writeFameSaleBuyStatus !== "pending") {
      try {
        const result = await writeFameSaleBuy({
          abi: fameSaleAbi,
          address: fameSaleAddress[chainId],
          functionName: "buy",
          args: [proof],
          value: requestBuy,
        });
        setIsPendingTransaction([
          {
            hash: result,
            kind: "buy",
          },
        ]);
        addNotification({
          id: "buy-pending",
          message: chain?.blockExplorers?.default.url ? (
            <Typography color="black">
              transaction submitted{" "}
              <WrappedLink
                href={`${chain?.blockExplorers?.default.url}/tx/${result}`}
              >
                {shortenHash(result, 4)}
              </WrappedLink>
            </Typography>
          ) : (
            "transaction submitted"
          ),
          type: "success",
          autoHideMs: 5000,
        });
      } catch (e: unknown) {
        console.error(e);
        sentry.captureException(e);
        if (e instanceof ContractFunctionExecutionError) {
          // console.log(JSON.stringify(e, null, 2));
          const result = (
            e.cause as unknown as {
              data?: {
                errorName?: string;
              };
            }
          ).data;
          if (result?.errorName === "Paused") {
            return addNotification({
              id: "buy-error",
              message: "presale paused",
              type: "error",
              autoHideMs: 5000,
            });
          }
          return addNotification({
            id: "buy-error",
            message: "transaction reverted",
            type: "error",
            autoHideMs: 5000,
          });
        }
        addNotification({
          id: "buy-error",
          message: "transaction error",
          type: "error",
          autoHideMs: 5000,
        });
      }
    }
  }, [
    isValidBuy,
    proof,
    writeFameSaleBuyStatus,
    writeFameSaleBuy,
    chainId,
    requestBuy,
    addNotification,
    chain?.blockExplorers?.default.url,
  ]);

  const onCloseTransactionModal = useCallback(() => {}, []);

  const onTransactionConfirmed = useCallback(() => {
    removeNotification("buy-pending");
    addNotification({
      id: "buy-confirmed",
      message: "transaction confirmed",
      type: "success",
      autoHideMs: 2000,
    });
    setIsPendingTransaction(false);
    refetch();
  }, [addNotification, refetch, removeNotification]);
  useEffect(() => {
    if (isPendingTransaction === null && proof) {
      onBuy();
    }
  }, [isPendingTransaction, proof, onBuy]);

  const [inputValue, setInputValue] = useState("");
  const onInputChanged: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = useCallback(
    (e) => {
      if (Number.isNaN(Number(e.target.value))) {
        return setBuyInputError("invalid input");
      }

      const newValue = parseUnits(e.target.value, 18);
      if (newValue > remainingBuy) {
        setBuyInputError("allocation exceeded");
      } else {
        setBuyInputError("");
      }

      setRequestBuy(newValue);
      setInputValue(e.target.value);
    },
    [remainingBuy],
  );

  const onInputBlur = useCallback(() => {
    if (requestBuy > remainingBuy) {
      setRequestBuy(remainingBuy);
      setInputValue(formatEther(remainingBuy));
      setBuyInputError("");
    }
  }, [requestBuy, remainingBuy]);

  const hasFullContribution =
    currentBalance?.status === "success" &&
    maxBuy?.status === "success" &&
    currentBalance.result === maxBuy.result;

  return (
    <>
      <Card>
        <CardHeader title="Presale" />
        {hasFullContribution ? (
          <ThankYouCard />
        ) : (
          <>
            <CardContent>
              {canProve?.status === "success" && !canProve.result && (
                <Typography variant="body2" color="error">
                  Invalid proof
                </Typography>
              )}
              <Typography variant="body2" component="p">
                Your max remaining contribution: {formatEther(remainingBuy)} E
              </Typography>
              <FormGroup
                onSubmit={onBuy}
                sx={{
                  mt: 2,
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  component="label"
                  htmlFor="buy-input"
                >
                  Amount
                </Typography>
                <Input
                  value={inputValue}
                  onChange={onInputChanged}
                  onBlur={onInputBlur}
                  inputProps={{
                    step: 0.01,
                    min: 0,
                    max: formatEther(remainingBuy),
                    type: "number",
                  }}
                />
              </FormGroup>
              <Typography variant="body2" color="error">
                {paused?.status === "success" && paused.result
                  ? "presale paused"
                  : buyInputError || "\u00A0"}
              </Typography>
            </CardContent>
            <CardActions>
              <Button onClick={onBuy} disabled={!isValidBuy}>
                buy
              </Button>
            </CardActions>
          </>
        )}
      </Card>
      <TransactionsModal
        open={!!isPendingTransaction}
        onClose={onCloseTransactionModal}
        transactions={isPendingTransaction ? isPendingTransaction : []}
        onTransactionConfirmed={onTransactionConfirmed}
      />
    </>
  );
};

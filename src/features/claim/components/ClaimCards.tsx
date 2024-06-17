import React, { FC, useCallback, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Unstable_Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import { claimToFameAbi, fameAbi } from "@/wagmi";
import { claimToFameFromNetwork } from "../contracts";
import { fameFromNetwork } from "@/features/fame/contract";
import {
  ContractFunctionExecutionError,
  parseUnits,
  encodeFunctionData,
} from "viem";
import {
  useReadContracts,
  useWriteContract,
  useAccount,
  useSimulateContract,
} from "wagmi";
import { base, sepolia } from "viem/chains";
import { useLadies } from "@/features/customize/hooks/useLadies";
import { useClaim } from "../hooks/useClaim";
import { formatFame } from "@/utils/fame";
import { useNotifications } from "@/features/notifications/Context";
import { TransactionProgress } from "@/components/TransactionProgress";
import { Claim } from "@/app/api/[network]/claim/route";

export const ClaimCard: FC<{
  chainId: typeof sepolia.id | typeof base.id;
}> = ({ chainId }) => {
  const { addNotification } = useNotifications();
  const { address } = useAccount();
  const { data: ladies, isLoading: isLadiesLoading } = useLadies({
    owner: address,
    chainId,
    first: 1000,
  });

  const {
    data: [signatureNonces, isClaimedBatch, fameBalance] = [],
    isLoading: isReadContractLoading,
    refetch,
  } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        abi: claimToFameAbi,
        address: claimToFameFromNetwork(chainId),
        functionName: "signatureNonces",
        chainId,
        args: address ? [address] : undefined,
      },
      {
        abi: claimToFameAbi,
        address: claimToFameFromNetwork(chainId),
        functionName: "isClaimedBatch",
        chainId,
        args: [ladies],
      },
      {
        abi: fameAbi,
        address: fameFromNetwork(chainId),
        functionName: "balanceOf",
        chainId,
        args: address ? [address] : undefined,
      },
    ],
  });

  const {
    writeContract,
    isPending: isWritePending,
    data: hash,
    isError: isWriteError,
    error: writeError,
    reset,
  } = useWriteContract();
  const tokenIds = useMemo(() => ladies.map((lady) => Number(lady)), [ladies]);

  useEffect(() => {
    if (writeError instanceof ContractFunctionExecutionError) {
      addNotification({
        message: "Transaction simulation failed",
        id: "claim-error",
        type: "error",
      });
    } else if (writeError) {
      console.error(writeError);
      addNotification({
        message: writeError.message,
        id: "claim-error",
        type: "error",
      });
    }
  }, [writeError, addNotification]);

  const notYetClaimedTokenIds = useMemo(
    () =>
      isClaimedBatch?.length === tokenIds.length
        ? tokenIds.filter((_, index) => !isClaimedBatch[index])
        : undefined,
    [isClaimedBatch, tokenIds],
  );

  const { data: claimData, isLoading: isClaimLoading } = useClaim({
    chainId,
    address,
    tokenIds: notYetClaimedTokenIds ?? [],
  });

  // for all claim data, find the claims that are equal to or greater than the current nonce and sort ascending so that the first claim is the next claim
  const unconfirmedClaim = useMemo(() => {
    if (typeof signatureNonces === "undefined") {
      return null;
    }
    if (!claimData?.claims) {
      return null;
    }
    const sg = Number(signatureNonces);
    //  claimData.claims
    // .filter((claim) => claim.nonce >= sg)
    // .sort((a, b) => a.nonce - b.nonce);
    let lestClaim: Claim | null = null;
    for (const claim of claimData.claims) {
      if (claim.nonce >= sg) {
        if (!lestClaim) {
          lestClaim = claim;
        } else if (claim.nonce < lestClaim.nonce) {
          lestClaim = claim;
        }
      }
    }
    return lestClaim;
  }, [claimData, signatureNonces]);

  const {
    data: simulateContractClaim,
    isError: isSimulationError,
    error: simulationError,
  } = useSimulateContract({
    abi: claimToFameAbi,
    chainId,
    address: claimToFameFromNetwork(chainId),
    functionName: "claimWithTokens",
    args: unconfirmedClaim
      ? [
          unconfirmedClaim.address,
          parseUnits(unconfirmedClaim.amount, 18),
          BigInt(unconfirmedClaim.deadlineSeconds),
          unconfirmedClaim.tokenIds,
          unconfirmedClaim.signature,
        ]
      : undefined,
  });

  const onClaim = useCallback(() => {
    if (notYetClaimedTokenIds && address && unconfirmedClaim) {
      console.log(
        `Submitting data: ${encodeFunctionData({
          abi: claimToFameAbi,
          functionName: "claimWithTokens",
          args: [
            unconfirmedClaim.address,
            parseUnits(unconfirmedClaim.amount, 18),
            BigInt(unconfirmedClaim.deadlineSeconds),
            unconfirmedClaim.tokenIds,
            unconfirmedClaim.signature,
          ],
        })}`,
      );
      writeContract({
        abi: claimToFameAbi,
        chainId,
        address: claimToFameFromNetwork(chainId),
        functionName: "claimWithTokens",
        /*
          address account,
          uint256 amount,
          uint256 deadline,
          uint16[] calldata tokenIds,
          bytes calldata signature
        */
        args: [
          unconfirmedClaim.address,
          parseUnits(unconfirmedClaim.amount, 18),
          BigInt(unconfirmedClaim.deadlineSeconds),
          unconfirmedClaim.tokenIds,
          unconfirmedClaim.signature,
        ],
      });
      addNotification({
        message: "Submitting claim to wallet",
        id: "claim-submit",
        type: "info",
        autoHideMs: 2000,
      });
    } else {
      addNotification({
        message: "Unable to claim",
        id: "claim-error",
        type: "error",
      });
    }
  }, [
    notYetClaimedTokenIds,
    address,
    unconfirmedClaim,
    writeContract,
    chainId,
    addNotification,
  ]);

  const onSubmitted = useCallback(() => {
    refetch();
    reset();
  }, [refetch, reset]);

  return (
    <>
      <Grid2 xs={12}>
        <Card>
          <CardHeader title="Claim" />
          <CardContent>
            {isClaimLoading ? (
              <Typography variant="body1" marginY={2}>
                Fetching claim data...
              </Typography>
            ) : null}
            {typeof fameBalance !== "undefined" ? (
              <Typography variant="body1" marginY={2}>
                You have {formatFame(fameBalance)}
              </Typography>
            ) : null}
            {!isSimulationError && unconfirmedClaim ? (
              <Typography variant="body1" marginY={2}>
                Claiming {formatFame(parseUnits(unconfirmedClaim.amount, 18))}
              </Typography>
            ) : null}
            {notYetClaimedTokenIds?.length && isSimulationError ? (
              <Typography variant="body1" color="red" marginY={2}>
                Simulation failed....
              </Typography>
            ) : null}
            {hash ? (
              <TransactionProgress
                transactionHash={hash}
                onConfirmed={onSubmitted}
              />
            ) : (
              <Box component="div" height={32} />
            )}
          </CardContent>
          <CardActions>
            <Button
              onClick={onClaim}
              disabled={
                !!hash ||
                !notYetClaimedTokenIds ||
                notYetClaimedTokenIds?.length === 0 ||
                !address ||
                isClaimLoading ||
                isWritePending
              }
            >
              {notYetClaimedTokenIds && notYetClaimedTokenIds.length
                ? `Claim ${notYetClaimedTokenIds.length} token${notYetClaimedTokenIds.length > 1 ? "s" : ""}`
                : "no claim available"}
            </Button>
          </CardActions>
        </Card>
      </Grid2>
    </>
  );
};

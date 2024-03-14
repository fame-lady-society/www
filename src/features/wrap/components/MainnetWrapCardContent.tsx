import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import TextField from "@mui/material/TextField";
import {
  useReadFameLadySocietyWrapCost,
  useWriteFameLadySocietyWrap,
  useWriteFameLadySocietyWrapTo,
  fameLadySocietyAddress,
} from "@/wagmi";
import Button from "@mui/material/Button";

import { BigNumber, utils } from "ethers";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import { TransactionProgress } from "@/components/TransactionProgress";
import { SepoliaTokenSelect } from "./SepoliaTokenSelect";
import { DevTipModal, TipCloseReason } from "./DevTipModal";
import { useAccount, useEnsAddress, useWriteContract } from "wagmi";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { useRouter } from "next/router";
import { WriteContractData } from "wagmi/query";
import { MainnetSelectWrap } from "./MainnetSelectWrap";

export const WrapCardContent: FC<{
  minTokenId: number;
  maxTokenId: number;
  isApprovedForAll?: boolean;
  setApprovalForAll?: () => Promise<WriteContractData>;
  approveIsError: boolean;
  approveIsSuccess: boolean;
}> = ({
  approveIsError,
  approveIsSuccess,
  minTokenId,
  maxTokenId,
  isApprovedForAll,
  setApprovalForAll,
}) => {
  const router = useRouter();
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [transferTo, setTransferTo] = useState(false);

  const [sendToInput, setSendToInput] = useState<string>();
  const [isTipRequested, setIsTipRequested] = useState(false);
  const [tipState, setTipState] = useState<{
    reason?: TipCloseReason;
    value?: bigint;
    wrapTo?: boolean;
  }>({});
  const { data: sendTo, isLoading: ensAddressIsLoading } = useEnsAddress({
    name: sendToInput,
  });

  const { address: selectedAddress } = useAccount();

  const { data: mainnetWrapCast } = useReadFameLadySocietyWrapCost({
    // enabled:
    //   testnet && selectedAddress && isApprovedForAll && tokenIds.length > 0,
  });

  const testnetWrapWrite = useWriteFameLadySocietyWrap({
    // overrides: {
    //   value:
    //     goerliWrapCost &&
    //     tipState.value &&
    //     goerliWrapCost.mul(tokenIds.length).add(tipState.value),
    // },
    // enabled: testnet && isApprovedForAll && tokenIds.length > 0 && !transferTo,
    // ...(selectedAddress &&
    //   isApprovedForAll && {
    //     args: [
    //       tokenIds
    //         .filter((tokenId) => tokenId !== null)
    //         .map((n) => BigNumber.from(n)) as BigNumber[],
    //     ],
    //   }),
  });

  const {
    writeContractAsync: wrappedNftWrap,
    isError: wrapIsError,
    isPending: wrapIsLoading,
    isSuccess: wrapIsSuccess,
  } = testnetWrapWrite;

  const testnetWrapToWrite = useWriteFameLadySocietyWrapTo({
    // overrides: {
    //   value: tipState.value,
    // },
    // enabled:
    //   testnet &&
    //   isApprovedForAll &&
    //   tokenIds.length > 0 &&
    //   transferTo &&
    //   !!sendTo &&
    //   utils.isAddress(sendTo),
    // ...(selectedAddress &&
    //   transferTo &&
    //   !!sendTo &&
    //   utils.isAddress(sendTo) &&
    //   isApprovedForAll && {
    // args: [
    //   sendTo as `0x${string}`,
    //   tokenIds
    //     .filter((tokenId) => tokenId !== null)
    //     .map((n) => BigNumber.from(n)) as BigNumber[],
    // ],
    //   }),
  });

  const {
    writeContractAsync: wrappedNftWrapTo,
    isError: wrapToIsError,
    isPending: wrapToIsLoading,
    isSuccess: wrapToIsSuccess,
  } = testnetWrapToWrite;

  const [wrapInProgress, setWrapInProgress] = useState(false);
  const [wrapTransactionResult, setWrappedTransactionResult] =
    useState<WriteContractData>();

  const onWrapSuccess = useCallback(() => {
    setWrapInProgress(false);
    setWrappedTransactionResult(undefined);
    const params = new URLSearchParams();
    params.set("tokenIds", tokenIds.join(","));
    params.set("txHash", wrapTransactionResult ?? "");
    router.push(`/wrap/success?${params.toString()}`);
  }, [router, tokenIds, wrapTransactionResult]);
  const onRequestWrapTip = useCallback(() => {
    setIsTipRequested(true);
  }, []);
  const onHandleTipClose = useCallback(
    async (reason: TipCloseReason, tip?: bigint) => {
      setIsTipRequested(false);
      if (reason === "confirm") {
        setTipState({ reason, value: tip, wrapTo: transferTo && !!sendTo });
      }
    },
    [sendTo, transferTo]
  );

  useEffect(() => {
    if (
      tipState.reason === "confirm" &&
      // Keep trying until one of these is true
      ((tipState.wrapTo && wrappedNftWrapTo) || wrappedNftWrap)
    ) {
      Promise.resolve().then(async () => {
        setTipState({});
        try {
          setWrapInProgress(true);
          const response = tipState.wrapTo
            ? await wrappedNftWrapTo?.({
                args: [
                  sendTo as `0x${string}`,
                  tokenIds
                    .filter((tokenId) => tokenId !== null)
                    .map((n) => BigInt(n)) as BigInt[],
                ],
                value:
                  mainnetWrapCast * BigInt(tokenIds.length) + tipState.value,
              })
            : await wrappedNftWrap?.({
                args: [
                  tokenIds
                    .filter((tokenId) => tokenId !== null)
                    .map((n) => BigInt(n)) as BigInt[],
                ],
                value:
                  mainnetWrapCast * BigInt(tokenIds.length) + tipState.value,
              });
          setWrappedTransactionResult(response);
        } catch (e) {
          console.error(e);
          setWrappedTransactionResult(undefined);
          setWrapInProgress(false);
        }
      });
    }
  }, [
    tipState,
    transferTo,
    sendTo,
    wrappedNftWrapTo,
    wrappedNftWrap,
    tokenIds,
    mainnetWrapCast,
  ]);
  const [approveInProgress, setApproveInProgress] = useState(false);
  const [approveTransactionResult, setApproveTransactionResult] =
    useState<WriteContractData>();
  const onApprove = useCallback(async () => {
    if (setApprovalForAll) {
      try {
        setApproveInProgress(true);
        const response = await setApprovalForAll();
        setApproveTransactionResult(response);
      } catch (e) {
        console.error(e);
        setApproveTransactionResult(undefined);
        setApproveInProgress(false);
      }
    }
  }, [setApprovalForAll]);
  const onApproveSuccess = useCallback(() => {
    setApproveInProgress(false);
    setApproveTransactionResult(undefined);
  }, []);
  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" component="div">
            wrap
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            select your tokens to wrap
          </Typography>
          <FormGroup>
            <FormControlLabel
              onClick={(event) => {
                event.preventDefault();
                setTransferTo(!transferTo);
              }}
              control={<Switch checked={transferTo} />}
              label={"wrap and transfer"}
            />
            <TextField
              sx={{
                my: 1,
              }}
              label="send wrapped tokens to"
              variant="outlined"
              disabled={!transferTo}
              onChange={(e) => {
                setSendToInput(e.target.value);
              }}
              InputProps={{
                endAdornment: ensAddressIsLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : sendTo ? (
                  <CheckCircle color="success" />
                ) : null,
              }}
            />
          </FormGroup>
          <MainnetSelectWrap maxTokenId={maxTokenId} minTokenId={minTokenId} />
          {(wrapInProgress || wrapTransactionResult) && (
            <TransactionProgress
              isError={wrapIsError}
              isSuccess={wrapIsSuccess}
              transactionHash={wrapTransactionResult}
              onConfirmed={onWrapSuccess}
            />
          )}
          {(approveInProgress || approveTransactionResult) && (
            <TransactionProgress
              isError={approveIsError}
              isSuccess={approveIsSuccess}
              transactionHash={approveTransactionResult}
              onConfirmed={onApproveSuccess}
            />
          )}
          {!(
            wrapInProgress ||
            wrapTransactionResult ||
            approveInProgress ||
            approveTransactionResult
          ) && (
            <Box component="div" sx={{ height: 32 }}>
              {isApprovedForAll === false && (
                <Typography variant="body2" color="text.warning">
                  you must approve the contract to wrap your tokens
                </Typography>
              )}
              {isApprovedForAll === true && (
                <>
                  {(() => {
                    switch (tokenIds.length) {
                      case 0:
                        return (
                          <Typography variant="body2" color="error">
                            select one or more tokens to wrap
                          </Typography>
                        );
                      case 1:
                        return (
                          <Typography variant="body2" color="text.secondary">
                            1 token selected
                          </Typography>
                        );
                      default:
                        return (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >{`${tokenIds.length} tokens selected`}</Typography>
                        );
                    }
                  })()}

                  {(() => {
                    if (
                      tokenIds.length &&
                      transferTo &&
                      sendTo &&
                      utils.isAddress(sendTo)
                    ) {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          {`send wrapped tokens to ${sendTo}`}
                        </Typography>
                      );
                    } else if (
                      transferTo &&
                      !(sendTo && utils.isAddress(sendTo))
                    ) {
                      return (
                        <Typography variant="body2" color="error">
                          invalid address
                        </Typography>
                      );
                    } else if (tokenIds.length) {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          wrapped tokens will be sent back to your wallet
                        </Typography>
                      );
                    } else {
                      return null;
                    }
                  })()}
                </>
              )}
            </Box>
          )}
        </CardContent>
        <CardActions>
          {isApprovedForAll === false && (
            <Button onClick={onApprove}>Approve</Button>
          )}
          <Button
            onClick={onRequestWrapTip}
            disabled={
              !isApprovedForAll ||
              tokenIds.length === 0 ||
              (transferTo && !(sendTo && utils.isAddress(sendTo)))
            }
          >
            Wrap
          </Button>
        </CardActions>
      </Card>
      <DevTipModal
        handleClose={onHandleTipClose}
        open={isTipRequested}
        numberOfTokens={tokenIds.length}
      />
    </>
  );
};

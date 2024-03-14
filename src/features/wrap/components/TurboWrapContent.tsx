import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import TextField from "@mui/material/TextField";
import { SendTransactionResult } from "@wagmi/core";
import {} from // usePrepareWrappedNftWrap,
// useWrappedNftWrap,
// useWrappedNftWrapTo,
// usePrepareWrappedNftWrapTo,
// usePrepareFameLadySocietyWrap,
// useFameLadySocietyWrap,
// usePrepareFameLadySocietyWrapTo,
// useFameLadySocietyWrapTo,
"@/wagmi";
import Button from "@mui/material/Button";

import { BigNumber, utils } from "ethers";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import { TransactionProgress } from "@/components/TransactionProgress";
import { DevTipModal, TipCloseReason } from "./DevTipModal";
import { useAccount, useEnsAddress } from "wagmi";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { useRouter } from "next/router";

export const TurboWrapContent: FC<{
  tokenIds: bigint[];
  isApprovedForAll?: boolean;
  setApprovalForAll?: () => Promise<SendTransactionResult>;
  approveIsError: boolean;
  approveIsSuccess: boolean;
  testnet: boolean;
}> = ({
  tokenIds,
  approveIsError,
  approveIsSuccess,
  isApprovedForAll,
  setApprovalForAll,
  testnet,
}) => {
  const router = useRouter();
  const [transferTo, setTransferTo] = useState(false);
  const [isTipRequested, setIsTipRequested] = useState(false);
  const [tipState, setTipState] = useState<{
    reason?: TipCloseReason;
    value?: BigNumber;
    wrapTo?: boolean;
  }>({});
  const [sendToInput, setSendToInput] = useState<string>();
  const { data: sendTo, isLoading: ensAddressIsLoading } = useEnsAddress({
    name: sendToInput,
  });

  const { address: selectedAddress } = useAccount();

  const { config: configureWrappedNftWrap } = usePrepareWrappedNftWrap({
    overrides: {
      value: tipState.value,
    },
    enabled: testnet && isApprovedForAll && tokenIds.length > 0 && !transferTo,
    ...(selectedAddress &&
      isApprovedForAll && {
        args: [tokenIds],
      }),
  });

  const testnetWrapWrite = useWrappedNftWrap(configureWrappedNftWrap);

  const { config: configureFameLadySocietyWrap } =
    usePrepareFameLadySocietyWrap({
      overrides: {
        value: tipState.value,
      },
      enabled:
        !testnet && isApprovedForAll && tokenIds.length > 0 && !transferTo,
      ...(selectedAddress &&
        isApprovedForAll && {
          args: [tokenIds],
        }),
    });

  const fameLadySocietyWrapWrite = useFameLadySocietyWrap(
    configureFameLadySocietyWrap
  );

  const {
    writeAsync: wrappedNftWrap,
    isError: wrapIsError,
    isLoading: wrapIsLoading,
    isSuccess: wrapIsSuccess,
  } = testnet ? testnetWrapWrite : fameLadySocietyWrapWrite;

  const { config: configureWrappedNftWrapTo } = usePrepareWrappedNftWrapTo({
    overrides: {
      value: tipState.value,
    },
    enabled:
      testnet &&
      isApprovedForAll &&
      tokenIds.length > 0 &&
      transferTo &&
      !!sendTo &&
      utils.isAddress(sendTo),
    ...(selectedAddress &&
      transferTo &&
      !!sendTo &&
      utils.isAddress(sendTo) &&
      isApprovedForAll && {
        args: [sendTo as `0x${string}`, tokenIds],
      }),
  });

  const testnetWrapToWrite = useWrappedNftWrapTo(configureWrappedNftWrapTo);

  const { config: configureFameLadyWrapTo } = usePrepareFameLadySocietyWrapTo({
    overrides: {
      value: tipState.value,
    },
    enabled:
      !testnet &&
      isApprovedForAll &&
      tokenIds.length > 0 &&
      transferTo &&
      !!sendTo &&
      utils.isAddress(sendTo),
    ...(selectedAddress &&
      transferTo &&
      !!sendTo &&
      utils.isAddress(sendTo) &&
      isApprovedForAll && {
        args: [sendTo as `0x${string}`, tokenIds],
      }),
  });

  const fameLadySocietyWrapToWrite = useFameLadySocietyWrapTo(
    configureFameLadyWrapTo
  );

  const {
    writeAsync: wrappedNftWrapTo,
    isError: wrapToIsError,
    isLoading: wrapToIsLoading,
    isSuccess: wrapToIsSuccess,
  } = testnet ? testnetWrapToWrite : fameLadySocietyWrapToWrite;

  const [wrapInProgress, setWrapInProgress] = useState(false);
  const [wrapTransactionResult, setWrappedTransactionResult] =
    useState<SendTransactionResult>();
  const onRequestWrapTip = useCallback(() => {
    setIsTipRequested(true);
  }, []);
  const onHandleTipClose = useCallback(
    async (reason: TipCloseReason, tip?: BigNumber) => {
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
            ? await wrappedNftWrapTo?.()
            : await wrappedNftWrap?.();
          setWrappedTransactionResult(response);
        } catch (e) {
          console.error(e);
          setWrappedTransactionResult(undefined);
          setWrapInProgress(false);
        }
      });
    }
  }, [tipState, transferTo, sendTo, wrappedNftWrapTo, wrappedNftWrap]);
  const onWrapSuccess = useCallback(() => {
    setWrapInProgress(false);
    setWrappedTransactionResult(undefined);
    const params = new URLSearchParams();
    params.set("tokenIds", tokenIds.join(","));
    params.set("txHash", wrapTransactionResult?.hash || "");
    router.push(`/wrap/success?${params.toString()}`);
  }, [router, tokenIds, wrapTransactionResult?.hash]);
  const [approveInProgress, setApproveInProgress] = useState(false);
  const [approveTransactionResult, setApproveTransactionResult] =
    useState<SendTransactionResult>();
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
            turbo wrap
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            wrap all your NFTs in one click
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

          {(wrapInProgress || wrapTransactionResult) && (
            <TransactionProgress
              transactionHash={wrapTransactionResult}
              onConfirmed={onWrapSuccess}
            />
          )}
          {(approveInProgress || approveTransactionResult) && (
            <TransactionProgress
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
            <Box sx={{ height: 32 }}>
              {isApprovedForAll === false && (
                <Typography variant="body2" color="text.warning">
                  you must approve the contract to wrap your tokens
                </Typography>
              )}
              {isApprovedForAll === true && (
                <>
                  {(() => {
                    if (
                      tokenIds.length &&
                      transferTo &&
                      sendTo &&
                      utils.isAddress(sendTo) &&
                      sendTo !== selectedAddress
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
                          Invalid address
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
          {tokenIds.length ? (
            <Button
              onClick={onRequestWrapTip}
              disabled={
                !isApprovedForAll ||
                tokenIds.length === 0 ||
                (transferTo && !(sendTo && utils.isAddress(sendTo)))
              }
            >
              {`turbo wrap ${tokenIds.length} token${
                tokenIds.length ? "s" : ""
              }`}
            </Button>
          ) : null}
        </CardActions>
      </Card>
      <DevTipModal
        open={isTipRequested}
        handleClose={onHandleTipClose}
        numberOfTokens={tokenIds.length}
      />
    </>
  );
};

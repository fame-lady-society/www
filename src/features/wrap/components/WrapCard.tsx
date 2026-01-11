import { FC, useCallback, useEffect, useState } from "react";
import Card from "@mui/material/Card";
import Grid2 from "@mui/material/Unstable_Grid2";
import CardActionArea from "@mui/material/CardActionArea";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import { DevTipModal, TipCloseReason } from "./DevTipModal";
import { useEnsAddress } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
import CheckCircle from "@mui/icons-material/CheckCircle";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { isAddress } from "viem";

export const WrapCard: FC<{
  isApprovedForAll?: boolean;
  tokenIds: readonly bigint[];
  transactionInProgress?: boolean;
  onWrapTo: (o: { args: [`0x${string}`, bigint[]]; value: bigint }) => void;
  onWrap: (o: { args: [bigint[]]; value: bigint }) => void;
  wrapCost?: bigint;
  onApprove: () => void;
  onRevoke: () => void;
  nonce: number;
}> = ({
  isApprovedForAll,
  tokenIds,
  transactionInProgress,
  onWrapTo,
  onWrap,
  wrapCost = 0n,
  onApprove,
  onRevoke,
  nonce,
}) => {
  const [selectedTokenIds, setTokenIds] = useState<bigint[]>([]);
  const [transferTo, setTransferTo] = useState(false);

  const [sendToInput, setSendToInput] = useState<string>("");
  const [isTipRequested, setIsTipRequested] = useState(false);
  const [isTurboWrap, setIsTurboWrap] = useState(false);
  const [tipState, setTipState] = useState<{
    reason?: TipCloseReason;
    value?: bigint;
    wrapTo?: boolean;
    tokenIds?: bigint[];
  }>({});
  const { data: sendTo, isLoading: ensAddressIsLoading } = useEnsAddress({
    name: sendToInput,
  });
  const { address } = useAccount();

  useEffect(() => {
    if (nonce) {
      setTipState({});
      setIsTurboWrap(false);
    }
  }, [nonce]);

  const onRequestWrapTip = useCallback((turbo: boolean = false) => {
    setIsTurboWrap(turbo);
    setIsTipRequested(true);
  }, []);

  const onHandleTipClose = useCallback(
    async (reason: TipCloseReason, tip?: bigint) => {
      setIsTipRequested(false);
      if (reason === "confirm") {
        const idsToWrap = isTurboWrap ? [...tokenIds] : selectedTokenIds;
        setTipState({
          reason,
          value: tip,
          wrapTo: transferTo && isAddress(sendTo || sendToInput),
          tokenIds: idsToWrap,
        });
      }
      setIsTurboWrap(false);
    },
    [sendTo, sendToInput, transferTo, isTurboWrap, tokenIds, selectedTokenIds],
  );

  useEffect(() => {
    if (tipState.reason === "confirm" && tipState.tokenIds) {
      const idsToWrap = tipState.tokenIds;
      if (tipState.wrapTo && isAddress(sendTo || sendToInput)) {
        onWrapTo({
          args: [
            (sendTo || sendToInput) as `0x${string}`,
            idsToWrap.filter((tokenId) => tokenId !== null).map((n) => BigInt(n)),
          ],
          value: wrapCost * BigInt(idsToWrap.length) + (tipState.value || 0n),
        });
      } else {
        onWrap({
          args: [
            idsToWrap.filter((tokenId) => tokenId !== null).map((n) => BigInt(n)),
          ],
          value: wrapCost * BigInt(idsToWrap.length) + (tipState.value || 0n),
        });
      }
    }
  }, [tipState, sendTo, onWrapTo, onWrap, wrapCost, sendToInput]);

  const resolvedAddress = sendTo || sendToInput;

  const handleSelectAll = useCallback(() => {
    setTokenIds([...tokenIds]);
  }, [tokenIds]);

  const handleDeselectAll = useCallback(() => {
    setTokenIds([]);
  }, []);

  const handleTurboWrap = useCallback(() => {
    onRequestWrapTip(true);
  }, [onRequestWrapTip]);

  return (
    <>
      <Box component="div">
        {tokenIds.length > 0 ? (
          <>
            {/* Turbo Wrap Banner */}
            <Box
              component="div"
              sx={{
                mb: 3,
                p: 2.5,
                borderRadius: 2,
                background: "linear-gradient(135deg, rgba(107, 91, 255, 0.15) 0%, rgba(196, 77, 255, 0.1) 100%)",
                border: "1px solid rgba(107, 91, 255, 0.3)",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box component="div">
                <Box component="div" display="flex" alignItems="center" gap={1} mb={0.5}>
                  <RocketLaunchIcon sx={{ color: "primary.main", fontSize: 20 }} />
                  <Typography variant="h6" fontWeight={700}>
                    {tokenIds.length} token{tokenIds.length !== 1 ? "s" : ""} ready
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Wrap all in one transaction or select individually below
                </Typography>
              </Box>
              <Button
                onClick={handleTurboWrap}
                variant="contained"
                disabled={
                  transactionInProgress ||
                  !isApprovedForAll ||
                  (transferTo && !(resolvedAddress && isAddress(resolvedAddress)))
                }
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  backgroundColor: "transparent !important",
                  background: "linear-gradient(135deg, #6b5bff 0%, #c44dff 100%) !important",
                  color: "#fff !important",
                  "&:hover": {
                    backgroundColor: "transparent !important",
                    background: "linear-gradient(135deg, #7d6fff 0%, #d06aff 100%) !important",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(255,255,255,0.12) !important",
                    color: "rgba(255,255,255,0.3) !important",
                    background: "none !important",
                  },
                }}
              >
                <RocketLaunchIcon sx={{ mr: 1, fontSize: 18 }} />
                Turbo Wrap All
              </Button>
            </Box>

            <Box
              component="div"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography color="text.secondary">
                Or select specific tokens to wrap
              </Typography>
              <Box component="div" display="flex" gap={1}>
                <Button
                  size="small"
                  onClick={handleSelectAll}
                  disabled={selectedTokenIds.length === tokenIds.length}
                  sx={{ textTransform: "none" }}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  onClick={handleDeselectAll}
                  disabled={selectedTokenIds.length === 0}
                  sx={{ textTransform: "none" }}
                >
                  Deselect All
                </Button>
              </Box>
            </Box>

            <Grid2 container spacing={2} sx={{ mb: 3 }}>
              {tokenIds.map((tokenId) => (
                <Grid2 xs={6} sm={4} md={3} lg={2} key={tokenId}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                      border: selectedTokenIds.includes(tokenId)
                        ? "3px solid"
                        : "3px solid transparent",
                      borderColor: selectedTokenIds.includes(tokenId)
                        ? "primary.main"
                        : "transparent",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 20px rgba(196, 77, 255, 0.2)",
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => {
                        if (selectedTokenIds.includes(tokenId)) {
                          setTokenIds(
                            selectedTokenIds.filter((id) => id !== tokenId),
                          );
                        } else {
                          setTokenIds([...selectedTokenIds, tokenId]);
                        }
                      }}
                    >
                      <Box component="div" position="relative">
                        <CardMedia
                          component="img"
                          image={`https://fame.support/fls/thumb/${tokenId}`}
                          alt={`FLS #${Number(tokenId)}`}
                          sx={{
                            aspectRatio: "1",
                            objectFit: "cover",
                          }}
                        />
                        {selectedTokenIds.includes(tokenId) && (
                          <Box
                            component="div"
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              p: 0.5,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CheckCircle sx={{ fontSize: 20, color: "#fff" }} />
                          </Box>
                        )}
                      </Box>
                      <Box component="div" p={1.5} textAlign="center">
                        <Typography variant="body2" fontWeight={600}>
                          #{Number(tokenId)}
                        </Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid2>
              ))}
            </Grid2>
          </>
        ) : (
          <Box
            component="div"
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 2,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              textAlign: "center",
            }}
          >
            <Typography color="text.secondary">
              No Fame Lady Squad NFTs found in your wallet
            </Typography>
          </Box>
        )}

        <FormGroup sx={{ mb: 2 }}>
          <FormControlLabel
            onClick={(event) => {
              event.preventDefault();
              setTransferTo(!transferTo);
            }}
            control={
              <Switch
                checked={transferTo}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "primary.main",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "primary.main",
                  },
                }}
              />
            }
            label={
              <Typography fontWeight={500}>
                Wrap and transfer to different address
              </Typography>
            }
          />
          <TextField
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
            label="Recipient address or ENS"
            placeholder="0x... or name.eth"
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

        <Box component="div" sx={{ minHeight: 64, mb: 2 }}>
          {!transactionInProgress && isApprovedForAll === false && (
            <Typography variant="body2" color="warning.main">
              You must approve the contract to wrap your tokens
            </Typography>
          )}
          {!transactionInProgress && isApprovedForAll === true && tokenIds.length > 0 && (
            <>
              {/* Chip row - always reserve space */}
              <Box component="div" sx={{ minHeight: 32, display: "flex", alignItems: "center" }}>
                {selectedTokenIds.length > 0 && (
                  <Chip
                    label={`${selectedTokenIds.length} token${selectedTokenIds.length !== 1 ? "s" : ""} selected`}
                    size="small"
                    sx={{
                      background: "rgba(196, 77, 255, 0.15)",
                      color: "primary.main",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>

              {/* Status text row */}
              {(() => {
                if (selectedTokenIds.length === 0) {
                  return (
                    <Typography variant="body2" color="text.secondary">
                      Select tokens above to wrap individually
                    </Typography>
                  );
                }
                if (
                  transferTo &&
                  resolvedAddress &&
                  isAddress(resolvedAddress) &&
                  resolvedAddress !== address
                ) {
                  return (
                    <Typography variant="body2" color="text.secondary">
                      Wrapped tokens will be sent to{" "}
                      <Typography component="span" fontWeight={600} color="primary.main">
                        {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
                      </Typography>
                    </Typography>
                  );
                }
                if (
                  transferTo &&
                  sendToInput.length > 0 &&
                  !(resolvedAddress && isAddress(resolvedAddress))
                ) {
                  return (
                    <Typography variant="body2" color="error.main">
                      Invalid address
                    </Typography>
                  );
                }
                return (
                  <Typography variant="body2" color="text.secondary">
                    Wrapped tokens will be sent back to your wallet
                  </Typography>
                );
              })()}
            </>
          )}
        </Box>

        <Box component="div" display="flex" gap={2} flexWrap="wrap" alignItems="center">
          {isApprovedForAll === false && (
            <Button
              onClick={onApprove}
              variant="outlined"
              size="large"
              disabled={transactionInProgress}
              sx={{
                borderRadius: 2,
                px: 4,
                fontWeight: 600,
              }}
            >
              Approve Contract
            </Button>
          )}
          <Button
            onClick={() => onRequestWrapTip(false)}
            variant="contained"
            size="large"
            disabled={
              transactionInProgress ||
              !isApprovedForAll ||
              selectedTokenIds.length === 0 ||
              (transferTo && !(resolvedAddress && isAddress(resolvedAddress)))
            }
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 600,
              backgroundColor: "transparent !important",
              background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%) !important",
              color: "#fff !important",
              "&:hover": {
                backgroundColor: "transparent !important",
                background: "linear-gradient(135deg, #ff8cb5 0%, #d06aff 100%) !important",
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(255,255,255,0.12) !important",
                color: "rgba(255,255,255,0.3) !important",
                background: "none !important",
              },
            }}
          >
            Wrap {selectedTokenIds.length > 0 ? `${selectedTokenIds.length} Selected` : "Selected"}
          </Button>
          {isApprovedForAll === true && (
            <Button
              onClick={onRevoke}
              variant="text"
              size="small"
              disabled={transactionInProgress}
              sx={{
                ml: "auto",
                textTransform: "none",
                color: "text.secondary",
                fontSize: "0.75rem",
                "&:hover": {
                  color: "error.main",
                  backgroundColor: "rgba(244, 67, 54, 0.08)",
                },
              }}
            >
              Revoke Approval
            </Button>
          )}
        </Box>
      </Box>
      <DevTipModal
        handleClose={onHandleTipClose}
        open={isTipRequested}
        numberOfTokens={isTurboWrap ? tokenIds.length : selectedTokenIds.length}
        wrapCost={wrapCost}
      />
    </>
  );
};

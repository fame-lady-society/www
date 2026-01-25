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
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import { useEnsAddress } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
import { useAuthSession } from "@/hooks/useAuthSession";
import { withAuthHeaders } from "@/utils/authToken";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import FavoriteIcon from "@mui/icons-material/Favorite";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { isAddress } from "viem";

interface UnwrapCardProps {
  network: "mainnet" | "sepolia";
  transactionInProgress?: boolean;
  onUnwrapMany: (args: [`0x${string}`, bigint[]]) => void;
  nonce?: number;
}

export const UnwrapCard: FC<UnwrapCardProps> = ({
  network,
  transactionInProgress,
  onUnwrapMany,
  nonce,
}) => {
  const { address } = useAccount();
  const authSession = useAuthSession();
  const [expanded, setExpanded] = useState(false);
  const [tokenIds, setTokenIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedTokenIds, setSelectedTokenIds] = useState<bigint[]>([]);
  const [transferTo, setTransferTo] = useState(false);
  const [sendToInput, setSendToInput] = useState<string>("");
  const [showFarewellModal, setShowFarewellModal] = useState(false);

  const { data: sendTo, isLoading: ensAddressIsLoading } = useEnsAddress({
    name: sendToInput,
  });

  const fetchWrappedTokens = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const endpoint = network === "sepolia" ? "/api/sepolia/owned" : "/api/ethereum/owned";
      const response = await fetch(endpoint, {
        headers: withAuthHeaders(undefined, authSession?.token ? authSession : null),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setFetchError("Please sign in to view your wrapped tokens");
        } else {
          setFetchError("Failed to fetch tokens");
        }
        return;
      }
      
      const ownedTokens: number[] = await response.json();
      setTokenIds(ownedTokens.map((id) => BigInt(id)));
      setHasFetched(true);
    } catch (error) {
      setFetchError("Failed to fetch tokens");
    } finally {
      setIsLoading(false);
    }
  }, [address, authSession, network]);

  // Reset selection and refetch when nonce changes (after successful transaction)
  useEffect(() => {
    if (nonce && hasFetched) {
      setSelectedTokenIds([]);
      fetchWrappedTokens();
    }
  }, [nonce, hasFetched, fetchWrappedTokens]);

  const handleExpand = useCallback(() => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    if (newExpanded && !hasFetched && !isLoading) {
      fetchWrappedTokens();
    }
  }, [expanded, hasFetched, isLoading, fetchWrappedTokens]);

  const handleRefresh = useCallback(() => {
    setSelectedTokenIds([]);
    fetchWrappedTokens();
  }, [fetchWrappedTokens]);

  const handleUnwrapClick = useCallback(() => {
    setShowFarewellModal(true);
  }, []);

  const handleConfirmUnwrap = useCallback(() => {
    setShowFarewellModal(false);
    const recipient = transferTo && isAddress(sendTo || sendToInput)
      ? (sendTo || sendToInput) as `0x${string}`
      : address!;
    onUnwrapMany([recipient, selectedTokenIds]);
  }, [address, onUnwrapMany, selectedTokenIds, sendTo, sendToInput, transferTo]);

  const handleCancelUnwrap = useCallback(() => {
    setShowFarewellModal(false);
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedTokenIds([...tokenIds]);
  }, [tokenIds]);

  const handleDeselectAll = useCallback(() => {
    setSelectedTokenIds([]);
  }, []);

  const resolvedAddress = sendTo || sendToInput;

  return (
    <Box component="div">
      {/* Expandable Header */}
      <Box
        component="div"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={handleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleExpand();
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          p: 2,
          borderRadius: 2,
          background: expanded 
            ? "rgba(255, 152, 0, 0.08)" 
            : "rgba(255, 255, 255, 0.03)",
          border: expanded 
            ? "1px solid rgba(255, 152, 0, 0.3)" 
            : "1px solid rgba(255, 255, 255, 0.08)",
          transition: "all 0.2s ease",
          "&:hover": {
            background: "rgba(255, 152, 0, 0.12)",
            borderColor: "rgba(255, 152, 0, 0.4)",
          },
        }}
      >
        <Box component="div">
          <Typography fontWeight={600}>
            {expanded ? "Select tokens to unwrap" : "Load your wrapped tokens"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {expanded 
              ? hasFetched 
                ? `${tokenIds.length} wrapped token${tokenIds.length !== 1 ? "s" : ""} found`
                : "Loading..."
              : "Click to view and unwrap your Fame Lady Society NFTs"
            }
          </Typography>
        </Box>
        <Box
          component="div"
          sx={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            color: "#ff9800",
          }}
        >
          <ExpandMoreIcon />
        </Box>
      </Box>

      <Collapse in={expanded} unmountOnExit>
        <Box component="div" sx={{ pt: 3 }}>
          {isLoading ? (
            <Box
              component="div"
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 6,
              }}
            >
              <CircularProgress sx={{ color: "#ff9800", mb: 2 }} />
              <Typography color="text.secondary">
                Loading your wrapped tokens...
              </Typography>
            </Box>
          ) : fetchError ? (
            <Box
              component="div"
              sx={{
                p: 3,
                borderRadius: 2,
                background: "rgba(244, 67, 54, 0.08)",
                border: "1px solid rgba(244, 67, 54, 0.3)",
                textAlign: "center",
              }}
            >
              <Typography color="error.main" mb={2}>
                {fetchError}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
                sx={{
                  borderColor: "#ff9800",
                  color: "#ff9800",
                  "&:hover": {
                    borderColor: "#ffa726",
                    background: "rgba(255, 152, 0, 0.08)",
                  },
                }}
              >
                Try Again
              </Button>
            </Box>
          ) : tokenIds.length > 0 ? (
            <>
              <Box
                component="div"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography color="text.secondary">
                  Select wrapped tokens to unwrap
                </Typography>
                <Box component="div" display="flex" gap={1}>
                  <Button
                    size="small"
                    onClick={handleRefresh}
                    startIcon={<RefreshIcon />}
                    sx={{ textTransform: "none" }}
                  >
                    Refresh
                  </Button>
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
                  <Grid2 xs={6} sm={4} md={3} lg={2} key={String(tokenId)}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        transition: "all 0.2s ease",
                        border: selectedTokenIds.includes(tokenId)
                          ? "3px solid"
                          : "3px solid transparent",
                        borderColor: selectedTokenIds.includes(tokenId)
                          ? "#ff9800"
                          : "transparent",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 8px 20px rgba(255, 152, 0, 0.2)",
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => {
                          if (selectedTokenIds.includes(tokenId)) {
                            setSelectedTokenIds(
                              selectedTokenIds.filter((id) => id !== tokenId),
                            );
                          } else {
                            setSelectedTokenIds([...selectedTokenIds, tokenId]);
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
                                background: "#ff9800",
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
                          color: "#ff9800",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: "#ff9800",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography fontWeight={500}>
                      Unwrap and transfer to different address
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
                {!transactionInProgress && (
                  <>
                    {/* Chip row - always reserve space */}
                    <Box component="div" sx={{ minHeight: 32, display: "flex", alignItems: "center" }}>
                      {selectedTokenIds.length > 0 && (
                        <Chip
                          label={`${selectedTokenIds.length} token${selectedTokenIds.length !== 1 ? "s" : ""} selected`}
                          size="small"
                          sx={{
                            background: "rgba(255, 152, 0, 0.15)",
                            color: "#ff9800",
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
                            Select tokens above to unwrap
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
                            Original NFTs will be sent to{" "}
                            <Typography component="span" fontWeight={600} sx={{ color: "#ff9800" }}>
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
                          Original NFTs will be sent back to your wallet
                        </Typography>
                      );
                    })()}
                  </>
                )}
              </Box>

              <Box component="div" display="flex" gap={2} flexWrap="wrap">
                <Button
                  onClick={handleUnwrapClick}
                  variant="contained"
                  size="large"
                  disabled={
                    transactionInProgress ||
                    selectedTokenIds.length === 0 ||
                    (transferTo && !(resolvedAddress && isAddress(resolvedAddress)))
                  }
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    fontWeight: 600,
                    backgroundColor: "#ff9800 !important",
                    color: "#000 !important",
                    "&:hover": {
                      backgroundColor: "#ffa726 !important",
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "rgba(255,255,255,0.12) !important",
                      color: "rgba(255,255,255,0.3) !important",
                    },
                  }}
                >
                  {transactionInProgress ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: "inherit" }} />
                      Processing...
                    </>
                  ) : (
                    `Unwrap ${selectedTokenIds.length > 0 ? `${selectedTokenIds.length} Selected` : "Selected"}`
                  )}
                </Button>
              </Box>
            </>
          ) : (
            <Box
              component="div"
              sx={{
                p: 3,
                borderRadius: 2,
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                textAlign: "center",
              }}
            >
              <Typography color="text.secondary" mb={2}>
                No wrapped Fame Lady Society NFTs found in your wallet
              </Typography>
              <Button
                variant="outlined"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  "&:hover": {
                    borderColor: "rgba(255, 255, 255, 0.4)",
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Farewell Modal */}
      <Dialog
        open={showFarewellModal}
        onClose={handleCancelUnwrap}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
            border: "1px solid rgba(255, 107, 157, 0.3)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            pt: 4,
            pb: 2,
          }}
        >
          <Box
            component="div"
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <Box
              component="div"
              sx={{
                p: 2,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255, 107, 157, 0.2) 0%, rgba(196, 77, 255, 0.2) 100%)",
                animation: "pulse 2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { transform: "scale(1)", opacity: 1 },
                  "50%": { transform: "scale(1.1)", opacity: 0.8 },
                },
              }}
            >
              <FavoriteIcon sx={{ fontSize: 48, color: "#ff6b9d" }} />
            </Box>
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Wait... Before You Go
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box component="div" sx={{ textAlign: "center", px: 2 }}>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.8 }}
            >
              We can&apos;t stop you. But we have to ask...
            </Typography>

            <Typography
              variant="body1"
              sx={{ mb: 3, lineHeight: 1.8, fontStyle: "italic" }}
            >
              &ldquo;Remember where we came from. In 2021, we were deceived—three men
              posed as women to create what they claimed was the first major all-female
              NFT project. When the truth came out, our community didn&apos;t crumble.
              <strong> We rose.</strong>&rdquo;
            </Typography>

            <Divider sx={{ my: 3, borderColor: "rgba(255, 107, 157, 0.2)" }} />

            <Typography
              variant="body1"
              sx={{ mb: 3, lineHeight: 1.8 }}
            >
              The Fame Lady Society you hold isn&apos;t just an NFT—it&apos;s a symbol
              of <strong>resilience</strong>, <strong>sisterhood</strong>, and
              <strong> community triumph</strong>. We took back our narrative. We built
              a DAO. We launched <strong>$FAME</strong>. We proved that when women
              lead, we don&apos;t just survive—<em>we thrive</em>.
            </Typography>

            <Box
              component="div"
              sx={{
                p: 3,
                borderRadius: 2,
                background: "rgba(255, 107, 157, 0.08)",
                border: "1px solid rgba(255, 107, 157, 0.2)",
                mb: 3,
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                By unwrapping, you&apos;re leaving the Society and returning to the
                original Fame Lady Squad contract—a relic of the betrayal we overcame.
                Your voice in governance, your place in our sisterhood, your connection
                to everything we&apos;ve built together... it stays here.
              </Typography>
            </Box>

            <Typography
              variant="body1"
              fontWeight={600}
              sx={{
                color: "#ff6b9d",
                mb: 2,
              }}
            >
              Are you sure you want to leave the Society?
            </Typography>

            <Box
              component="div"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                color: "text.secondary",
                mb: 1,
              }}
            >
              <WarningAmberIcon sx={{ fontSize: 16, color: "#ff9800" }} />
              <Typography variant="caption">
                {selectedTokenIds.length} token{selectedTokenIds.length !== 1 ? "s" : ""} will be unwrapped
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            gap: 2,
            pb: 4,
            px: 4,
          }}
        >
          <Button
            onClick={handleCancelUnwrap}
            variant="contained"
            size="large"
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 600,
              backgroundColor: "transparent !important",
              background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%) !important",
              color: "#fff !important",
              "&:hover": {
                backgroundColor: "transparent !important",
                background: "linear-gradient(135deg, #ff85ad 0%, #d070ff 100%) !important",
              },
            }}
          >
            Stay With Us
          </Button>
          <Button
            onClick={handleConfirmUnwrap}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 600,
              borderColor: "rgba(255, 255, 255, 0.3) !important",
              color: "rgba(255, 255, 255, 0.7) !important",
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.5) !important",
                backgroundColor: "rgba(255, 255, 255, 0.05) !important",
              },
            }}
          >
            Leave Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

import { FC, useCallback, useEffect, useState } from "react";
import Card from "@mui/material/Card";
import Grid2 from "@mui/material/Unstable_Grid2";
import CardActionArea from "@mui/material/CardActionArea";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CheckCircle from "@mui/icons-material/CheckCircle";

export const DonateCard: FC<{
  isApprovedForAll?: boolean;
  tokenIds: readonly bigint[];
  transactionInProgress?: boolean;
  onDonate: (args: { tokenIds: bigint[] }) => void;
  onApprove: () => void;
  onRevoke: () => void;
  nonce: number;
}> = ({
  isApprovedForAll,
  tokenIds,
  transactionInProgress,
  onDonate,
  onApprove,
  onRevoke,
  nonce,
}) => {
  const [selectedTokenIds, setSelectedTokenIds] = useState<bigint[]>([]);

  useEffect(() => {
    setSelectedTokenIds([]);
  }, [nonce, tokenIds]);

  const handleDonate = useCallback(() => {
    if (
      transactionInProgress ||
      !isApprovedForAll ||
      selectedTokenIds.length === 0
    ) {
      return;
    }
    onDonate({
      tokenIds: Array.from(selectedTokenIds),
    });
  }, [transactionInProgress, isApprovedForAll, selectedTokenIds, onDonate]);

  const handleDonateAll = useCallback(() => {
    if (transactionInProgress || !isApprovedForAll || tokenIds.length === 0) {
      return;
    }
    const allTokenIds = Array.from(tokenIds);
    setSelectedTokenIds(allTokenIds);
    onDonate({
      tokenIds: allTokenIds,
    });
  }, [transactionInProgress, isApprovedForAll, tokenIds, onDonate]);

  const handleSelectAll = useCallback(() => {
    setSelectedTokenIds([...tokenIds]);
  }, [tokenIds]);

  const handleDeselectAll = useCallback(() => {
    setSelectedTokenIds([]);
  }, []);

  return (
    <Box component="div">
      <Box
        component="div"
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          background: "rgba(76, 175, 80, 0.1)",
          border: "1px solid rgba(76, 175, 80, 0.2)",
        }}
      >
        <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
          <strong>Wrap fees are waived</strong> when you donate directly to the
          community vault. Your donation helps support the Fame Lady Society
          treasury.
        </Typography>
      </Box>

      {tokenIds.length > 0 ? (
        <>
          <Box
            component="div"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography color="text.secondary">
              Select tokens to donate
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
                      ? "#4caf50"
                      : "transparent",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 20px rgba(76, 175, 80, 0.2)",
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
                            background: "#4caf50",
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

      <Box component="div" sx={{ minHeight: 64, mb: 2 }}>
        {!transactionInProgress && isApprovedForAll === false && (
          <Typography variant="body2" color="warning.main">
            You must approve the donation vault to transfer your tokens
          </Typography>
        )}
        {!transactionInProgress && isApprovedForAll === true && tokenIds.length > 0 && (
          <>
            {/* Chip row - always reserve space */}
            <Box component="div" sx={{ minHeight: 32, display: "flex", alignItems: "center" }}>
              {selectedTokenIds.length > 0 && (
                <Chip
                  label={`${selectedTokenIds.length} token${selectedTokenIds.length !== 1 ? "s" : ""} selected for donation`}
                  size="small"
                  sx={{
                    background: "rgba(76, 175, 80, 0.15)",
                    color: "#4caf50",
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>

            {/* Status text row */}
            {selectedTokenIds.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Select tokens above to donate
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Tokens will be donated to the Fame Lady Society treasury
              </Typography>
            )}
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
            Approve Vault
          </Button>
        )}
        <Button
          onClick={handleDonate}
          variant="contained"
          size="large"
          disabled={
            transactionInProgress ||
            !isApprovedForAll ||
            selectedTokenIds.length === 0
          }
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 600,
            backgroundColor: "#4caf50 !important",
            color: "#fff !important",
            "&:hover": {
              backgroundColor: "#66bb6a !important",
            },
            "&.Mui-disabled": {
              backgroundColor: "rgba(255,255,255,0.12) !important",
              color: "rgba(255,255,255,0.3) !important",
            },
          }}
        >
          Donate Selected
        </Button>
        <Button
          onClick={handleDonateAll}
          variant="outlined"
          size="large"
          disabled={
            transactionInProgress || !isApprovedForAll || tokenIds.length === 0
          }
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 600,
            borderColor: "#4caf50",
            color: "#4caf50",
            "&:hover": {
              borderColor: "#66bb6a",
              backgroundColor: "rgba(76, 175, 80, 0.1)",
            },
          }}
        >
          Donate All
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
  );
};

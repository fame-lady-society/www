import { FC, useCallback, useEffect, useState } from "react";
import Card from "@mui/material/Card";
import Grid2 from "@mui/material/Unstable_Grid2";
import CardActionArea from "@mui/material/CardActionArea";
import CardMedia from "@mui/material/CardMedia";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

export const DonateCard: FC<{
  isApprovedForAll?: boolean;
  tokenIds: readonly bigint[];
  transactionInProgress?: boolean;
  onDonate: (args: { tokenIds: bigint[] }) => void;
  onApprove: () => void;
  nonce: number;
}> = ({
  isApprovedForAll,
  tokenIds,
  transactionInProgress,
  onDonate,
  onApprove,
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

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div">
          donate
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          select the tokens you would like to donate to the vault
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          wrap fees are waived when you donate directly to the community vault
        </Typography>
        <Grid2 container spacing={1}>
          {tokenIds.map((tokenId) => (
            <Grid2 xs={12} sm={6} md={4} lg={3} key={tokenId}>
              <Card>
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
                  sx={{
                    ...(selectedTokenIds.includes(tokenId) && {
                      borderColor: "primary.main",
                      borderStyle: "solid",
                      borderWidth: 5,
                    }),
                  }}
                >
                  <CardHeader title={`FLS ${Number(tokenId)}`} />
                  <CardMedia
                    component="img"
                    image={`https://fame.support/fls/thumb/${tokenId}`}
                    sx={{
                      objectFit: "contain",
                      width: "100%",
                      transition: "transform 0.5s ease-in-out",
                    }}
                  />
                </CardActionArea>
              </Card>
            </Grid2>
          ))}
        </Grid2>

        <Box component="div" sx={{ height: 32 }}>
          {!transactionInProgress && isApprovedForAll === false && (
            <Typography variant="body2" color="text.warning">
              you must approve the donation vault to transfer your tokens
            </Typography>
          )}
          {!transactionInProgress && isApprovedForAll === true && (
            <>
              {(() => {
                if (tokenIds.length > 0) {
                  switch (selectedTokenIds.length) {
                    case 0:
                      return (
                        <Typography variant="body2" color="error">
                          select one or more tokens to donate
                        </Typography>
                      );
                    case 1:
                      return (
                        <Typography variant="body2" color="text.secondary">
                          1 token selected to donate
                        </Typography>
                      );
                    default:
                      return (
                        <Typography variant="body2" color="text.secondary">
                          {`${selectedTokenIds.length} tokens selected to donate`}
                        </Typography>
                      );
                  }
                }
              })()}
            </>
          )}
        </Box>
      </CardContent>
      <CardActions>
        {isApprovedForAll === false && (
          <Button onClick={onApprove}>Approve</Button>
        )}
        <Button
          onClick={handleDonate}
          disabled={
            transactionInProgress ||
            !isApprovedForAll ||
            selectedTokenIds.length === 0
          }
        >
          Donate
        </Button>
        <Button
          onClick={handleDonateAll}
          disabled={
            transactionInProgress || !isApprovedForAll || tokenIds.length === 0
          }
        >
          Donate All
        </Button>
      </CardActions>
    </Card>
  );
};

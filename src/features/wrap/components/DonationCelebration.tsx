import { FC } from "react";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Grid2 from "@mui/material/Unstable_Grid2";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CelebrationIcon from "@mui/icons-material/Celebration";
import { WrappedLink } from "@/components/WrappedLink";
import SurpriseShower from "./SupriseShower";

export const DonationCelebration: FC<{
  open: boolean;
  onClose: () => void;
  tokenIds: readonly string[];
  txHash?: string;
}> = ({ open, onClose, tokenIds, txHash }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "transparent",
          boxShadow: "none",
        },
      }}
    >
      {open ? (
        <SurpriseShower count={18}>
          <FavoriteIcon
            fontSize="large"
            color="error"
            sx={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}
          />
        </SurpriseShower>
      ) : null}

      <Card elevation={6} sx={{ mt: 4 }}>
        <CardContent>
          <Box
            component="div"
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={1}
            mb={2}
          >
            <CelebrationIcon color="primary" />
            <Typography component="span" variant="h5">
              Thank you for donating!
            </Typography>
            <CelebrationIcon color="primary" />
          </Box>
          <Typography variant="body1" textAlign="center" mb={2}>
            Your tokens are headed to the community vault, fee-free. We&apos;ll
            celebrate this generosity in future community awards.
          </Typography>
          <Grid2 container spacing={1} justifyContent="center">
            {tokenIds.map((tokenId) => (
              <Grid2 xs={6} sm={4} key={tokenId}>
                <Card variant="outlined">
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      component="img"
                      alt={`Fame Lady ${tokenId}`}
                      src={`https://fame.support/fls/thumb/${tokenId}`}
                      sx={{
                        width: "100%",
                        borderRadius: 1,
                        objectFit: "contain",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      FLS #{tokenId}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid2>
            ))}
          </Grid2>
        </CardContent>
        <CardActions
          sx={{
            flexDirection: "column",
            alignItems: "stretch",
            gap: 1,
            px: 3,
            pb: 3,
          }}
        >
          {txHash ? (
            <WrappedLink
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ width: "100%" }}
            >
              <Button variant="outlined" fullWidth>
                View transaction on Etherscan
              </Button>
            </WrappedLink>
          ) : null}
          <Button variant="contained" onClick={onClose} fullWidth>
            Keep wrapping
          </Button>
        </CardActions>
      </Card>
    </Dialog>
  );
};

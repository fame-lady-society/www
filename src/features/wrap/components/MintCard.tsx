import { FC, useCallback, useState, FormEventHandler } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNotifications } from "@/features/notifications/Context";

export const MintCard: FC<{
  onMint(count: bigint): void;
  transactionInProgress?: boolean;
}> = ({ onMint, transactionInProgress }) => {
  const { addNotification } = useNotifications();
  const [count, setCount] = useState("");

  const countError =
    count.length && (count === "0" || !Number.isInteger(Number(count)));

  const onUpdateTokenId = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCount(e.target.value);
  }, []);

  const onSubmit: FormEventHandler = useCallback(
    (e) => {
      e.preventDefault();
      onMint(BigInt(count));
    },
    [count, onMint],
  );

  const onClick = useCallback(() => {
    const bcount = BigInt(count);
    if (bcount > 25n) {
      addNotification({
        id: "mint-error",
        message: "You can only mint 25 tokens at a time",
        type: "error",
      });
      return;
    }
    onMint(bcount);
  }, [addNotification, count, onMint]);

  return (
    <Box component="div">
      <Box
        component="div"
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          background: "rgba(255, 193, 7, 0.1)",
          border: "1px solid rgba(255, 193, 7, 0.2)",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          For testing purposes, you can mint as many testnet NFTs as you need.
          Maximum 25 per transaction.
        </Typography>
      </Box>

      <FormGroup onSubmit={onSubmit}>
        <TextField
          value={count}
          onChange={onUpdateTokenId}
          fullWidth
          label="Number of NFTs to mint"
          placeholder="Enter amount (max 25)"
          error={!!countError}
          helperText={countError ? "Please enter a valid number" : ""}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
      </FormGroup>

      <Button
        size="large"
        onClick={onClick}
        disabled={!(Number(count) > 0) || transactionInProgress}
        variant="outlined"
      >
        Mint {count || "0"} Testnet NFT{Number(count) !== 1 ? "s" : ""}
      </Button>
    </Box>
  );
};

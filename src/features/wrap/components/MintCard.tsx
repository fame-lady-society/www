import { FC, useCallback, useState, FormEventHandler } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import TextField from "@mui/material/TextField";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";

export const MintCard: FC<{
  onMint(count: bigint): void;
  transactionInProgress?: boolean;
}> = ({ onMint, transactionInProgress }) => {
  // const { address: selectedAddress, chain: currentChain } = useAccount();
  const [count, setCount] = useState("");
  // const [mintProgress, setMintProgress] = useState(false);

  // const [transactionResult, setTransactionResult] =
  //   useState<WriteContractData>();

  // const { writeContractAsync } = useWriteContract();
  // const onMint = useCallback(async () => {
  //   if (writeContractAsync) {
  //     try {
  //       setMintProgress(true);
  //       const response = await writeContractAsync({
  //         args: [1n],
  //         abi: bulkMinterAbi,
  //         address: bulkMinterAddress[11155111],
  //         functionName: "mint",
  //       });
  //       setTransactionResult(response);
  //     } catch (e) {
  //       console.error(e);
  //       setTransactionResult(undefined);
  //       setMintProgress(false);
  //     }
  //   }
  // }, [writeContractAsync]);

  const countError =
    count.length && (count === "0" || !Number.isInteger(Number(count)));

  const onUpdateTokenId = useCallback((e: any) => {
    setCount(e.target.value);
  }, []);
  const onSubmit: FormEventHandler = useCallback(
    (e) => {
      e.preventDefault();
      onMint(bigint(count));
    },
    [count, onMint],
  );
  const onClick = useCallback(() => {
    onMint(Number(count));
  }, [count, onMint]);
  // const onMintSuccess = useCallback(() => {
  //   setMintProgress(false);
  //   setTransactionResult(undefined);
  // }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div">
          Mint testnet FLS
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          For testing purposes, any available token ID can be minted
        </Typography>
        <FormGroup onSubmit={onSubmit}>
          <TextField
            value={count}
            onChange={onUpdateTokenId}
            margin="normal"
            fullWidth
            helperText="Mint count"
            error={!!countError}
          />
        </FormGroup>
        {!!countError && (
          <Typography sx={{ mb: 1.5 }} color="text.error">
            Invalid count
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={onClick}
          disabled={!(Number(count) > 0) || transactionInProgress}
        >
          Mint
        </Button>
      </CardActions>
    </Card>
  );
};

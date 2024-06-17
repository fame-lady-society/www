import React, {
  ChangeEventHandler,
  FC,
  useCallback,
  useMemo,
  useState,
} from "react";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Button from "@mui/material/Button";
import Slider, { SliderProps } from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";

import FormGroup from "@mui/material/FormGroup";
import { styled } from "@mui/material/styles";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import Box from "@mui/material/Box";

const Input = styled(MuiInput)`
  width: 100%;
`;

function formatAsFixed(value: number, precision: number) {
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

function minAllocation(totalAllocation: bigint, currentBuyin: bigint) {
  return Math.ceil(
    Number(formatUnits(totalAllocation / 1000000n, 18)) +
      Number(formatUnits(currentBuyin, 18)) / 0.035,
  );
}

function maxAllocation(
  totalAllocation: bigint,
  currentBuyin: bigint,
  remainingBuy: bigint,
) {
  return Math.floor(
    Number(formatUnits(totalAllocation / 1000000n, 18)) +
      Number(
        formatUnits(
          currentBuyin > remainingBuy ? remainingBuy : currentBuyin,
          18,
        ),
      ) /
        0.035,
  );
}

export const ClaimEnoughModal: FC<{
  totalAllocation: bigint;
  currentBuyin: bigint;
  remainingBuy: bigint;
  onClose: () => void;
  onUpdateBuy: (amount: bigint) => void;
  onBuy: () => void;
}> = ({
  totalAllocation,
  currentBuyin,
  remainingBuy,
  onClose,
  onBuy,
  onUpdateBuy,
}) => {
  const [numberOfNFTs, setNumberOfNFTs] = useState(
    minAllocation(totalAllocation, currentBuyin),
  );
  const currentBuyPrice = useMemo(() => {
    const currentAllocation =
      Number(formatUnits(totalAllocation / 1000000n, 18)) +
      Number(formatUnits(currentBuyin, 18)) / 0.035;
    const neededAllocation = numberOfNFTs - currentAllocation;
    if (neededAllocation <= 0) {
      return 0;
    }
    return neededAllocation * 0.035 * 1.05;
  }, [currentBuyin, numberOfNFTs, totalAllocation]);

  const [requestBuy, setRequestBuy] = useState<bigint>(
    parseEther(currentBuyPrice.toString()),
  );
  const [buyInputError, setBuyInputError] = useState("");
  const [inputValue, setInputValue] = useState(currentBuyPrice.toString());

  // Calculate if the requested buy is less than the amount needed to buy one more NFT

  const starterAllocation = Math.floor(
    Number(formatUnits(totalAllocation / 1000000n, 18)) +
      Number(formatUnits(currentBuyin, 18)) / 0.035,
  );
  const isLessThanNextNft = numberOfNFTs <= starterAllocation;

  const onInputChanged: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = useCallback(
    (e) => {
      if (Number.isNaN(Number(e.target.value))) {
        return setBuyInputError("invalid input");
      }

      const newValue = parseUnits(e.target.value, 18);
      if (newValue > remainingBuy) {
        setBuyInputError("allocation exceeded");
      } else {
        setBuyInputError("");
      }

      setRequestBuy(newValue);
      setInputValue(e.target.value);
      setNumberOfNFTs(
        maxAllocation(totalAllocation, currentBuyin + newValue, remainingBuy),
      );
      onUpdateBuy(newValue);
    },
    [currentBuyin, onUpdateBuy, remainingBuy, totalAllocation],
  );

  const onInputBlur = useCallback(() => {}, []);

  const onHandleBuy = useCallback(() => {
    if (requestBuy > remainingBuy) {
      return setBuyInputError("allocation exceeded");
    }
    onClose();
    onBuy();
  }, [requestBuy, remainingBuy, onClose, onBuy]);

  const onSliderChange: Exclude<SliderProps["onChange"], undefined> =
    useCallback(
      (_, value) => {
        setNumberOfNFTs(value as number);
        const currentAllocation =
          Number(formatUnits(totalAllocation / 1000000n, 18)) +
          Number(formatUnits(currentBuyin, 18)) / 0.035;
        const neededAllocation = Number(value) - currentAllocation;
        if (neededAllocation <= 0) {
          setRequestBuy(0n);
          setInputValue("0");
        }
        let remainingBuyNeeded = neededAllocation * 0.035 * 1.05;
        if (parseEther(remainingBuyNeeded.toString()) > remainingBuy) {
          remainingBuyNeeded = Number(formatEther(remainingBuy));
        }
        setRequestBuy(parseEther(remainingBuyNeeded.toString()));
        setInputValue(remainingBuyNeeded.toString());
        onUpdateBuy(parseEther(remainingBuyNeeded.toString()));
      },
      [currentBuyin, onUpdateBuy, remainingBuy, totalAllocation],
    );

  return (
    <Dialog open onClose={() => onClose()}>
      <Card sx={{ pb: 1 }}>
        <CardHeader title="Presale helper" />
        <CardContent sx={{ mx: 2 }}>
          <Typography variant="body1">
            Currently between your free claim and presale buy, you have been
            allocated enough $FAME to claim {starterAllocation.toLocaleString()}{" "}
            NFT
            {starterAllocation > 1 ? "s" : ""}.
          </Typography>
          <Typography variant="body1" marginY={2}>
            A buffer of 5% will be added to your buy.
          </Typography>
          {currentBuyin > 0 && (
            <Typography variant="body1" marginY={2}>
              Current buy: {formatUnits(currentBuyin, 18)} E
            </Typography>
          )}

          <Box
            component="div"
            sx={{ ml: 2, mr: 6 }}
            display="flex"
            alignItems="center"
          >
            <Typography
              variant="body2"
              component="label"
              htmlFor="buy-slider"
              sx={{ mr: 1, width: "80px" }}
            >
              {numberOfNFTs}
              {"\u00A0"}NFT{numberOfNFTs > 1 ? "s" : ""}
            </Typography>
            <Slider
              id="buy-slider"
              value={numberOfNFTs}
              min={minAllocation(totalAllocation, currentBuyin)}
              max={27}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) =>
                `${value} Society NFT${value > 1 ? "s" : ""}`
              }
              onChange={onSliderChange}
            />
          </Box>
          <FormGroup
            onSubmit={onHandleBuy}
            sx={{
              mt: 2,
              mb: 1,
            }}
          >
            <Typography variant="body2" component="label" htmlFor="buy-input">
              Additional presale buy
            </Typography>
            <Input
              value={inputValue}
              onChange={onInputChanged}
              onBlur={onInputBlur}
              inputProps={{
                step: 0.01,
                min: 0,
                max: formatEther(remainingBuy),
                type: "number",
              }}
              endAdornment="E"
            />
          </FormGroup>
          <Typography variant="body2" color="error">
            {buyInputError || "\u00A0"}
          </Typography>
          <Typography variant="body2" color="yellow">
            {isLessThanNextNft
              ? "Your contribution is not enough to buy one more NFT"
              : null}
          </Typography>
        </CardContent>
        <CardActionArea>
          <Button onClick={onHandleBuy}>Buy</Button>
        </CardActionArea>
      </Card>
    </Dialog>
  );
};

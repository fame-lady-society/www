import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { styled } from "@mui/material/styles";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardActions from "@mui/material/CardActions";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import Button from "@mui/material/Button";
import LockIcon from "@mui/icons-material/Lock";
import Input from "@mui/material/Input";
import { isAddress } from "viem";
import { useEnsAddress } from "wagmi";

export const LockWithGuardianModal: FC<{
  open: boolean;
  handleClose: (reason: "cancel" | "confirm", address?: `0x${string}`) => void;
}> = ({ open, handleClose }) => {
  const [guardianAddressInput, setGuardianAddressInput] = useState<string>("");
  const [enableGuardian, setEnableGuardian] = useState(true);
  const { data: guardianEnsAddress } = useEnsAddress({
    name: guardianAddressInput,
  });
  const resolvedGuardianAddress = guardianEnsAddress || guardianAddressInput;
  const isAddressValid = isAddress(resolvedGuardianAddress);
  const isEnsNameValid = !!guardianEnsAddress;

  return (
    <Modal
      open={open}
      onClose={() => handleClose("cancel")}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      closeAfterTransition
    >
      <Container
        maxWidth="sm"
        sx={{
          position: "absolute" as "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Card
          variant="elevation"
          sx={{
            p: 2,
          }}
        >
          <CardHeader
            title={
              <>
                <Box
                  component="span"
                  display="flex"
                  justifyContent="center"
                  sx={{
                    mt: 2,
                  }}
                >
                  <LockIcon />
                </Box>
                <Typography
                  sx={{ mt: 2, mb: 2 }}
                  id="modal-modal-title"
                  variant="h6"
                  component="h2"
                  textAlign="center"
                >
                  Lock Tokens
                </Typography>
              </>
            }
          />
          <CardContent>
            <Typography
              id="modal-modal-description"
              sx={{ mb: 2 }}
              color="text.secondary"
            >
              Select an optional guardian to lock your tokens with.
            </Typography>

            <Typography sx={{ mb: 2 }} color="text.secondary">
              If a guardian is selected, you will be unable to transfer your
              tokens until the guardian unlocks them. If no guardian is
              selected, your tokens will be locked by you and cannot be
              transferred until you unlock them.
            </Typography>

            <Typography sx={{ mb: 2 }} color="text.secondary">
              It is recommended to select a guardian to lock your tokens with,
              but be sure you control the guardian&apos;s address.
            </Typography>
            <FormGroup
              sx={{
                mt: 2,
                mb: 1,
                opacity: enableGuardian ? 1 : 0.5,
                pointerEvents: enableGuardian ? "auto" : "none",
              }}
            >
              <Typography
                variant="body2"
                component="label"
                htmlFor="token-input"
              >
                Guardian Address
              </Typography>
              <Input
                id="guardian-address-input"
                value={guardianAddressInput}
                onChange={(e) => setGuardianAddressInput(e.target.value)}
                onBlur={() => {}}
                onKeyDown={() => {}}
                disabled={!enableGuardian}
                inputProps={{
                  type: "text",
                  placeholder: "0x...",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  height: "1.5em",
                  visibility: isAddressValid ? "visible" : "hidden",
                  color: "success.main",
                }}
              >
                ✓ Valid Ethereum address
                {isEnsNameValid ? ` (${guardianEnsAddress})` : ""}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  height: "1.5em",
                  visibility:
                    guardianAddressInput && !isAddressValid
                      ? "visible"
                      : "hidden",
                  color: "error.main",
                }}
              >
                Invalid Ethereum address
              </Typography>
            </FormGroup>
            <FormGroup sx={{ flexDirection: "row", alignItems: "center" }}>
              <Checkbox
                id="enable-guardian"
                checked={enableGuardian}
                onChange={(e) => setEnableGuardian(e.target.checked)}
              />
              <Typography
                variant="body2"
                component="label"
                htmlFor="enable-guardian"
                sx={{ cursor: "pointer" }}
              >
                Enable Guardian
              </Typography>
            </FormGroup>
          </CardContent>
          <CardActions>
            <Button
              onClick={() => {
                if (enableGuardian && isAddress(resolvedGuardianAddress)) {
                  handleClose("confirm", resolvedGuardianAddress);
                } else if (enableGuardian) {
                  handleClose("cancel");
                } else {
                  handleClose("confirm", undefined);
                }
              }}
              variant="contained"
              color="success"
              fullWidth
              className="bg-blue-500"
              disabled={enableGuardian && !isAddressValid}
            >
              Confirm
            </Button>
            <Button
              onClick={() => handleClose("cancel")}
              variant="outlined"
              color="error"
            >
              Cancel
            </Button>
          </CardActions>
        </Card>
      </Container>
    </Modal>
  );
};

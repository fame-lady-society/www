"use client";

import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

export function GalleryPurchaseDisclosureContent({
  doNotShowAgain,
  onDoNotShowAgainChange,
}: {
  doNotShowAgain: boolean;
  onDoNotShowAgainChange: (checked: boolean) => void;
}) {
  return (
    <Stack spacing={2}>
      <Typography>
        You are buying a FAME Society NFT from the FAME marketplace contract.
      </Typography>
      <Typography>
        To deliver the artwork you chose, the purchase may swap its metadata
        with a token from the mint or unrevealed token pools. That swap happens
        inside the same checkout transaction.
      </Typography>
      <Typography>
        The art and metadata are set on-chain. OpenSea, wallets, and other
        websites may show cached copies, so they can take several minutes or
        longer to display the updated NFT.
      </Typography>
      <Typography>
        The Society NFT smart contract emits ERC-4906 metadata update events
        when the metadata changes. Those events tell apps to refresh, but each
        app still controls when its cache is updated.
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={doNotShowAgain}
            onChange={(event) => onDoNotShowAgainChange(event.target.checked)}
          />
        }
        label="Do not show this again"
      />
    </Stack>
  );
}

export function GalleryPurchaseDisclosureActions({
  onCancel,
  onUnderstand,
}: {
  onCancel: () => void;
  onUnderstand: () => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outlined"
        onClick={onCancel}
        sx={{ minHeight: 44 }}
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="contained"
        onClick={onUnderstand}
        sx={{ minHeight: 44 }}
      >
        I understand
      </Button>
    </>
  );
}

export function GalleryPurchaseDisclosureModal({
  open,
  onCancel,
  onUnderstand,
}: {
  open: boolean;
  onCancel: () => void;
  onUnderstand: (doNotShowAgain: boolean) => void;
}) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  const cancel = () => {
    setDoNotShowAgain(false);
    onCancel();
  };
  const understand = () => {
    const remember = doNotShowAgain;
    setDoNotShowAgain(false);
    onUnderstand(remember);
  };

  return (
    <Dialog
      open={open}
      onClose={cancel}
      aria-labelledby="gallery-purchase-disclosure-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="gallery-purchase-disclosure-title">
        Before you buy
      </DialogTitle>
      <DialogContent dividers>
        <GalleryPurchaseDisclosureContent
          doNotShowAgain={doNotShowAgain}
          onDoNotShowAgainChange={setDoNotShowAgain}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <GalleryPurchaseDisclosureActions
          onCancel={cancel}
          onUnderstand={understand}
        />
      </DialogActions>
    </Dialog>
  );
}

import { FC, ReactNode, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import UploadIcon from "@mui/icons-material/Upload";
import { TransactionProgress } from "@/components/TransactionProgress";

export type Transaction<S = string, T = unknown> = {
  kind: S;
  hash?: `0x${string}`;
  context?: T;
};

const TransactionItem: FC<{
  transaction: Transaction;
  onConfirmed: (tx: Transaction) => void;
}> = ({ transaction, onConfirmed: doConfirmed }) => {
  const onConfirmed = useCallback(() => {
    doConfirmed(transaction);
  }, [doConfirmed, transaction]);
  return (
    <>
      -
      <Typography ml={1} mb={1} variant="body2" color="text.secondary">
        {`${transaction.hash ? "Submitting" : "Awaiting"} ${transaction.kind} transaction`}
      </Typography>
      {transaction.hash && (
        <TransactionProgress
          transactionHash={transaction.hash}
          onConfirmed={onConfirmed}
        />
      )}
    </>
  );
};

export const TransactionsModal: FC<{
  open: boolean;
  onClose: () => void;
  transactions?: Transaction[];
  onTransactionConfirmed: (tx: Transaction) => void;
  topContent?: ReactNode;
}> = ({ open, onClose, transactions, onTransactionConfirmed, topContent }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <Card
        sx={{
          px: {
            xs: 2,
            sm: 4,
            md: 6,
          },
          py: {
            xs: 2,
            sm: 4,
            md: 6,
          },
        }}
      >
        <CardHeader avatar={<UploadIcon />} title="Submitting Transaction" />
        <CardContent>
          {topContent}
          {transactions?.map((tx) => (
            <TransactionItem
              key={tx.hash}
              transaction={tx}
              onConfirmed={onTransactionConfirmed}
            />
          ))}
        </CardContent>
      </Card>
    </Dialog>
  );
};

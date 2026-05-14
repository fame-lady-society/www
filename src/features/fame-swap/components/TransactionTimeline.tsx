"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PendingIcon from "@mui/icons-material/Pending";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Hash } from "viem";
import type { CSSProperties, FC, ReactNode } from "react";
import type { FameSwapTransactionState } from "../hooks/useFameSwapTransaction";

interface TransactionStep {
  label: string;
  status: "waiting" | "active" | "complete" | "error";
}

export interface FameSwapTransactionTimelineProps {
  quoteReady: boolean;
  approvalRequired: boolean;
  transaction: FameSwapTransactionState;
}

function txLabel(hash: Hash): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

const timelineStyle: CSSProperties = {
  border: "1px solid rgba(127, 127, 127, 0.35)",
  borderRadius: 8,
  padding: 16,
};

function pillStyle(status: TransactionStep["status"]): CSSProperties {
  return {
    alignItems: "center",
    border:
      status === "active"
        ? "1px solid #64b5f6"
        : "1px solid rgba(127, 127, 127, 0.35)",
    borderRadius: 999,
    display: "flex",
    gap: 6,
    padding: "4px 8px",
  };
}

function iconForStatus(status: TransactionStep["status"]): ReactNode {
  if (status === "complete") {
    return <CheckCircleIcon color="success" fontSize="small" />;
  }
  if (status === "error") {
    return <ErrorOutlineIcon color="error" fontSize="small" />;
  }
  if (status === "active") {
    return <PendingIcon color="primary" fontSize="small" />;
  }
  return <RadioButtonUncheckedIcon color="disabled" fontSize="small" />;
}

export const FameSwapTransactionTimeline: FC<
  FameSwapTransactionTimelineProps
> = ({ quoteReady, approvalRequired, transaction }) => {
  const quoteStatus: TransactionStep["status"] =
    transaction.reverted && transaction.submissionKind !== "approval"
      ? "error"
      : transaction.protectedSimulationReady
        ? "complete"
        : quoteReady || transaction.protectedSimulationPending
          ? "active"
          : "waiting";
  const approvalStatus: TransactionStep["status"] =
    transaction.reverted && transaction.submissionKind === "approval"
      ? "error"
      : transaction.approvalConfirmed || !approvalRequired
        ? "complete"
        : transaction.approvalPending
          ? "active"
          : "waiting";
  const swapStatus: TransactionStep["status"] =
    transaction.reverted && transaction.submissionKind === "swap"
      ? "error"
      : transaction.swapConfirmed
        ? "complete"
        : transaction.swapPending
          ? "active"
          : "waiting";
  const steps: TransactionStep[] = [
    {
      label: "Quote",
      status: quoteStatus,
    },
    ...(approvalRequired
      ? [
          {
            label: "Approval",
            status: approvalStatus,
          } satisfies TransactionStep,
        ]
      : []),
    {
      label: "Swap",
      status: swapStatus,
    },
  ];

  return (
    <div style={timelineStyle}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Status</Typography>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.25}>
          {steps.map((step) => (
            <div key={step.label} style={pillStyle(step.status)}>
              {iconForStatus(step.status)}
              <Typography variant="caption">{step.label}</Typography>
            </div>
          ))}
        </Stack>

        {transaction.hash ? (
          <Typography variant="body2">
            {transaction.swapConfirmed ? "Confirmed" : "Pending"} transaction{" "}
            <Link
              href={`https://basescan.org/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              {txLabel(transaction.hash)}
            </Link>
          </Typography>
        ) : null}
      </Stack>
    </div>
  );
};

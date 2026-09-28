"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getConnection } from "@wagmi/core";
import { isAddressEqual, type Address, type Hash } from "viem";
import { base } from "viem/chains";
import {
  useConfig,
  useConnection,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { fameApprovalRead, fameApprovalRevoke } from "./fameApproval";

export function FameApprovalWarning() {
  const { address, isConnected } = useConnection();
  return isConnected && address ? (
    <ConnectedWarning key={address.toLowerCase()} account={address} />
  ) : null;
}

function ConnectedWarning({ account }: { account: Address }) {
  const config = useConfig();
  const client = usePublicClient({ chainId: base.id });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const approval = useReadContract({
    ...fameApprovalRead(account),
    query: { refetchInterval: 15_000 },
  });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<Hash>();
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const assertWallet = () => {
    const connection = getConnection(config);
    if (
      !mounted.current ||
      !connection.isConnected ||
      !connection.address ||
      !isAddressEqual(connection.address, account) ||
      connection.chainId !== base.id
    )
      throw new Error(
        "Reconnect the original wallet on Base to revoke this approval.",
      );
  };

  const revoke = async () => {
    if (busy.current || !client) return;
    busy.current = true;
    setError(null);
    try {
      let transactionHash = hash;
      if (!transactionHash) {
        setStatus("Switching to Base…");
        if (getConnection(config).chainId !== base.id) {
          await switchChainAsync({ chainId: base.id });
        }
        assertWallet();
        setStatus("Checking revocation…");
        const { request } = await client.simulateContract(
          fameApprovalRevoke(account),
        );
        assertWallet();
        setStatus("Confirm revocation in your wallet…");
        transactionHash = await writeContractAsync(request);
        if (!mounted.current) return;
        setHash(transactionHash);
      }
      setStatus("Waiting for Base confirmation…");
      const receipt = await client.waitForTransactionReceipt({
        hash: transactionHash,
        onReplaced: ({ transaction }) => {
          if (mounted.current) setHash(transaction.hash);
        },
      });
      if (!mounted.current) return;
      if (receipt.status !== "success") {
        setHash(undefined);
        throw new Error(
          "Revocation reverted. Your approval is still at risk; try again.",
        );
      }
      setStatus("Verifying approval is revoked…");
      const result = await approval.refetch();
      if (result.isError || result.data !== false) {
        // A mined cancellation or different replacement must allow a fresh revoke.
        if (!result.isError) setHash(undefined);
        throw new Error("Approval is not confirmed revoked. Check again.");
      }
      setHash(undefined);
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof Error && "shortMessage" in cause
            ? String(cause.shortMessage)
            : cause instanceof Error
              ? cause.message
              : "Could not revoke approval. Try again.",
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setStatus(null);
    }
  };

  return (
    <FameApprovalWarningView
      approved={approval.data}
      readError={approval.isError}
      status={status}
      error={error}
      hash={hash}
      disabled={!client}
      onRevoke={revoke}
      onRetry={() => {
        void approval.refetch();
      }}
    />
  );
}

export function FameApprovalWarningView({
  approved,
  readError = false,
  status = null,
  error = null,
  hash,
  disabled = false,
  onRevoke,
  onRetry,
}: {
  approved?: boolean;
  readError?: boolean;
  status?: string | null;
  error?: string | null;
  hash?: Hash;
  disabled?: boolean;
  onRevoke: () => void;
  onRetry: () => void;
}) {
  if (approved === false || (approved !== true && !readError && !hash))
    return null;

  return (
    <Snackbar open anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
      <Alert
        severity={approved === true || hash ? "error" : "warning"}
        sx={{ maxWidth: 520, width: "100%" }}
      >
        <Stack spacing={1}>
          <Typography fontWeight={700}>
            {approved === true || hash
              ? "Revoke this approval or your FAME is at risk."
              : "We couldn’t check your FAME approval."}
          </Typography>
          {approved === true || hash ? (
            <Typography variant="body2">
              Limit Break’s Payment Processor has permission to transfer your
              Society NFTs, which can also move the FAME backing them.
            </Typography>
          ) : null}
          {status ? (
            <Typography role="status" variant="body2">
              {status}
            </Typography>
          ) : null}
          {error ? (
            <Typography role="alert" variant="body2">
              {error}
            </Typography>
          ) : null}
          {hash ? (
            <Link
              href={`https://basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View revocation transaction
            </Link>
          ) : null}
          <Button
            variant="contained"
            color="error"
            disabled={status !== null || disabled}
            sx={{ alignSelf: "flex-start", minHeight: 44 }}
            onClick={approved === true || hash ? onRevoke : onRetry}
          >
            {hash
              ? "Check revocation"
              : approved === true
                ? "Revoke approval"
                : "Retry approval check"}
          </Button>
        </Stack>
      </Alert>
    </Snackbar>
  );
}

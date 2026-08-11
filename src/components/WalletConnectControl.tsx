"use client";

import type { ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import { useConnection } from "wagmi";

import { useWalletModal } from "@/hooks/useWalletModal";

type WalletConnectControlState = {
  open: () => void;
  isConnecting: boolean;
  error: string | null;
};

export function WalletConnectControl({
  children,
}: {
  children: (state: WalletConnectControlState) => ReactNode;
}) {
  const { isConnecting, isReconnecting } = useConnection();
  const { error, openConnect, isInitialized, isLoading } = useWalletModal();

  return children({
    open: () => void openConnect(),
    isConnecting: !isInitialized || isConnecting || isReconnecting || isLoading,
    error,
  });
}

export function WalletConnectButton(props: ButtonProps) {
  return (
    <WalletConnectControl>
      {({ error, open, isConnecting }) => (
        <Button
          variant="contained"
          {...props}
          disabled={isConnecting || props.disabled}
          title={error ?? props.title}
          onClick={(event) => {
            props.onClick?.(event);
            if (!event.defaultPrevented) open();
          }}
        >
          {isConnecting
            ? "Connecting…"
            : error
              ? "Retry Wallet Connection"
              : props.children ?? "Connect Wallet"}
        </Button>
      )}
    </WalletConnectControl>
  );
}

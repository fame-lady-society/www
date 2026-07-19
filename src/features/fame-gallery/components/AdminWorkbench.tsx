"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ConnectKitButton } from "connectkit";
import { useEffect } from "react";
import { baseSepolia } from "viem/chains";
import { useSwitchChain } from "wagmi";
import { usePageAttentionRefresh } from "@/features/society-nft-auction/hooks/usePageAttentionRefresh";
import { useAccount } from "@/hooks/useAccount";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import { formatTestAmount } from "../format";
import { useGalleryAuthority } from "../hooks/useGalleryAuthority";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import type { GalleryGlobalState, GalleryHookProjection } from "../types";
import { AdminGate, type AdminGateState } from "./AdminGate";
import { AdminMarketActions } from "./AdminMarketActions";

type AuthorizedState = {
  status: "authorized";
  account: `0x${string}`;
  connectedChainId: number | undefined;
  global: GalleryHookProjection<GalleryGlobalState>;
  isSwitching: boolean;
  onSwitchChain: () => void;
  actions?: React.ReactNode;
};

export type AdminWorkbenchViewState = AdminGateState | AuthorizedState;

function AddressRow({ label, address }: { label: string; address: string }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 0.5, sm: 2 }}
      justifyContent="space-between"
    >
      <Typography color="text.secondary">{label}</Typography>
      <Typography
        component="code"
        sx={{ overflowWrap: "anywhere", textAlign: { sm: "right" } }}
      >
        {address}
      </Typography>
    </Stack>
  );
}

function MarketplaceSummary({
  global,
}: {
  global: GalleryHookProjection<GalleryGlobalState>;
}) {
  if (global.status === "idle" || global.status === "loading") {
    return (
      <Typography role="status" aria-live="polite">
        Loading marketplace state…
      </Typography>
    );
  }
  if (global.status === "failure") {
    return (
      <Alert severity="error" role="alert">
        Marketplace state read failed: {global.message}
      </Alert>
    );
  }

  const { data } = global;
  return (
    <Stack spacing={1.25}>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="text.secondary">Status</Typography>
        <Typography fontWeight={700}>
          {data.paused ? "Paused" : "Live"}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="text.secondary">Premium</Typography>
        <Typography>{formatTestAmount(data.premium)} TEST</Typography>
      </Stack>
      <AddressRow label="Fee recipient" address={data.feeRecipient} />
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="text.secondary">Marketplace inventory</Typography>
        <Typography>{data.inventory.toString()} NFTs</Typography>
      </Stack>
      <AddressRow label="Current owner" address={data.owner} />
      <Typography variant="caption" color="text.secondary">
        Canonical read block {global.blockNumber.toString()}
      </Typography>
    </Stack>
  );
}

export function AdminWorkbenchView({
  state,
}: {
  state: AdminWorkbenchViewState;
}) {
  if (state.status !== "authorized") {
    return <AdminGate state={state} />;
  }

  const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
  const wrongChain = state.connectedChainId !== baseSepolia.id;
  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h5">
            Marketplace context
          </Typography>
          <AddressRow label="Connected owner" address={state.account} />
          <AddressRow label="Marketplace" address={config.addresses.gallery} />
          <Link
            href={`${config.explorerBaseUrl}/address/${config.addresses.gallery}`}
            target="_blank"
            rel="noreferrer"
            sx={{
              alignSelf: "flex-start",
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            View contract on BaseScan
          </Link>
          {wrongChain ? (
            <Alert
              severity="warning"
              action={
                <Button
                  type="button"
                  color="inherit"
                  disabled={state.isSwitching}
                  onClick={state.onSwitchChain}
                  sx={{ minHeight: 44 }}
                >
                  {state.isSwitching ? "Switching…" : "Switch to Base Sepolia"}
                </Button>
              }
            >
              Switching to Base Sepolia for marketplace actions.
            </Alert>
          ) : null}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h5">
            Current marketplace state
          </Typography>
          <MarketplaceSummary global={state.global} />
        </Stack>
      </Paper>

      {state.actions ?? (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Typography role="status" color="text.secondary">
            Marketplace controls are loading…
          </Typography>
        </Paper>
      )}
    </Stack>
  );
}

export function AdminWorkbench() {
  const account = useAccount();
  const authority = useGalleryAuthority(account.address ?? null);
  const isAuthorized =
    authority.projection.status === "success" &&
    authority.projection.data.authority === "owner";
  const global = useGalleryGlobalState({ enabled: isAuthorized });
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();
  const shouldSwitch =
    account.isConnected && account.chainId !== baseSepolia.id;

  useEffect(() => {
    if (shouldSwitch) {
      switchChain({ chainId: baseSepolia.id });
    }
  }, [shouldSwitch, switchChain]);

  usePageAttentionRefresh(async () => {
    await authority.refresh();
    if (isAuthorized) await global.refresh();
  }, Boolean(account.address));

  let state: AdminWorkbenchViewState;
  if (!account.isConnected || !account.address) {
    state = {
      status: "disconnected",
      connectionControl: <ConnectKitButton />,
    };
  } else if (
    account.isConnecting ||
    authority.projection.status === "idle" ||
    authority.projection.status === "loading"
  ) {
    state = { status: "checking" };
  } else if (authority.projection.status === "failure") {
    state = {
      status: "failure",
      onRetry: () => void authority.refresh(),
    };
  } else if (authority.projection.data.authority === "denied") {
    state = { status: "denied" };
  } else {
    state = {
      status: "authorized",
      account: account.address,
      connectedChainId: account.chainId,
      global: global.projection,
      isSwitching,
      onSwitchChain: () => switchChain({ chainId: baseSepolia.id }),
      actions: (
        <AdminMarketActions
          global={global.projection}
          refreshGlobal={global.refresh}
        />
      ),
    };
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}
    >
      <Stack spacing={3}>
        <header>
          <Typography component="h1" variant="h3">
            TEST marketplace admin
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Operate the Universal Pool Art Marketplace on Base Sepolia.
          </Typography>
        </header>
        <AdminWorkbenchView state={state} />
      </Stack>
    </Container>
  );
}

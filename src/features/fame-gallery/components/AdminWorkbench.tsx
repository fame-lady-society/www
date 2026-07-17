"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ConnectKitButton } from "connectkit";
import { formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { useSwitchChain } from "wagmi";
import { usePageAttentionRefresh } from "@/features/society-nft-auction/hooks/usePageAttentionRefresh";
import { useAccount } from "@/hooks/useAccount";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import { useGalleryAuthority } from "../hooks/useGalleryAuthority";
import { useGalleryGlobalState } from "../hooks/useGalleryGlobalState";
import type {
  GalleryAuthority,
  GalleryGlobalState,
  GalleryHookProjection,
} from "../types";
import { AdminGate, type AdminGateState } from "./AdminGate";

type AuthorizedState = {
  status: "authorized";
  account: `0x${string}`;
  connectedChainId: number | undefined;
  authority: Exclude<GalleryAuthority, "denied">;
  global: GalleryHookProjection<GalleryGlobalState>;
  isSwitching: boolean;
  onSwitchChain: () => void;
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

function GlobalDiagnostics({
  global,
}: {
  global: GalleryHookProjection<GalleryGlobalState>;
}) {
  if (global.status === "idle" || global.status === "loading") {
    return (
      <Typography role="status" aria-live="polite">
        Loading gallery state…
      </Typography>
    );
  }
  if (global.status === "failure") {
    return (
      <Alert severity="error" role="alert">
        Gallery state read failed: {global.message}
      </Alert>
    );
  }

  return (
    <Stack spacing={1.25}>
      <AddressRow label="TEST token" address={global.data.fame} />
      <AddressRow label="Society NFT mirror" address={global.data.mirror} />
      <AddressRow label="CreatorMagic" address={global.data.creatorMagic} />
      <AddressRow label="TEST renderer" address={global.data.renderer} />
      <AddressRow label="Fee recipient" address={global.data.feeRecipient} />
      <Divider />
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="text.secondary">Gallery inventory</Typography>
        <Typography>{global.data.inventory.toString()} NFTs</Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="text.secondary">Accrued fees</Typography>
        <Typography>
          {formatUnits(global.data.accruedProtocolFees, 18)} TEST
        </Typography>
      </Stack>
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

  const wrongChain = state.connectedChainId !== baseSepolia.id;
  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h5">
            Gallery context
          </Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1, md: 4 }}
          >
            <div>
              <Typography variant="caption" color="text.secondary">
                Recognized authority
              </Typography>
              <Typography sx={{ textTransform: "capitalize" }}>
                {state.authority}
              </Typography>
            </div>
            <div>
              <Typography variant="caption" color="text.secondary">
                Connected chain
              </Typography>
              <Typography>
                {state.connectedChainId === baseSepolia.id
                  ? "Base Sepolia"
                  : state.connectedChainId
                    ? `Chain ${state.connectedChainId}`
                    : "Unknown"}
              </Typography>
            </div>
          </Stack>
          <AddressRow label="Connected account" address={state.account} />
          <AddressRow
            label="Gallery"
            address={BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery}
          />
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
              Base Sepolia is required before a write. Contract read access
              remains available.
            </Alert>
          ) : null}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h5">
            Deployed TEST stack
          </Typography>
          <GlobalDiagnostics global={state.global} />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography component="h2" variant="h5">
          Market actions
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Listing, rotation, recovery, and fee controls will appear here.
        </Typography>
      </Paper>
    </Stack>
  );
}

export function AdminWorkbench() {
  const account = useAccount();
  const authority = useGalleryAuthority(account.address ?? null);
  const isAuthorized =
    authority.projection.status === "success" &&
    authority.projection.data.authority !== "denied";
  const global = useGalleryGlobalState({ enabled: isAuthorized });
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

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
      authority: authority.projection.data.authority,
      global: global.projection,
      isSwitching,
      onSwitchChain: () => {
        void switchChainAsync({ chainId: baseSepolia.id }).catch(
          () => undefined,
        );
      },
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
            TEST gallery admin
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Inspect and operate the deployed Base Sepolia market.
          </Typography>
        </header>
        <AdminWorkbenchView state={state} />
      </Stack>
    </Container>
  );
}

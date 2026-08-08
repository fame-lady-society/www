"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/LinkButton";
import { formatTestAmount } from "../format";
import {
  existingProviderPerSaleShare,
  prospectiveProviderPerSaleShare,
} from "../liquidity/position";
import type { GalleryLiquidityProviderPosition } from "../liquidity/reads";
import type { GalleryGlobalState, GalleryHookProjection } from "../types";

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, minWidth: 0 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography fontWeight={700} sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    </Paper>
  );
}

function FameAmount({ amount }: { amount: bigint }) {
  return <>{formatTestAmount(amount)} FAME</>;
}

export function GalleryLiquidityCta() {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
      >
        <Typography component="h2" variant="h5">
          Back marketplace liquidity.
        </Typography>
        <LinkButton
          href="/fame/market/stake"
          variant="contained"
          sx={{ minHeight: 40, flexShrink: 0 }}
        >
          Stake your Society NFTs
        </LinkButton>
      </Stack>
    </Paper>
  );
}

export function GalleryLiquidityEducationCard({
  global,
  showCta = true,
}: {
  global: GalleryGlobalState | null;
  showCta?: boolean;
}) {
  const prospectiveShare = global
    ? prospectiveProviderPerSaleShare(
        global.providerFee,
        global.totalProviderUnits,
      )
    : null;
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "flex-start" }}
          spacing={2}
        >
          <div>
            <Typography component="h2" variant="h4">
              Back marketplace liquidity.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
              Stake a whole Society NFT with its attached 1,000,000 FAME and
              earn FAME on every marketplace sale.
            </Typography>
          </div>
          {showCta ? (
            <LinkButton
              href="/fame/market/stake"
              variant="contained"
              sx={{ minHeight: 48, flexShrink: 0 }}
            >
              Stake your Society NFTs
            </LinkButton>
          ) : null}
        </Stack>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Pool inventory"
            value={
              global
                ? `${global.inventory.toString()} Society NFTs`
                : "Loading…"
            }
          />
          <Stat
            label="Active providers"
            value={
              global
                ? `${global.activeProviderCount.toString()} / ${global.activeProviderCap.toString()}`
                : "Loading…"
            }
          />
          <Stat
            label="Credited provider units"
            value={global ? global.totalProviderUnits.toString() : "Loading…"}
          />
          <Stat
            label="Prospective 1-unit current share"
            value={
              prospectiveShare === null ? (
                "Loading…"
              ) : (
                <>
                  <FameAmount amount={prospectiveShare} /> per marketplace sale
                </>
              )
            }
          />
          <Stat
            label="Total premium"
            value={global ? <FameAmount amount={global.premium} /> : "Loading…"}
          />
          <Stat
            label="Provider portion"
            value={
              global ? <FameAmount amount={global.providerFee} /> : "Loading…"
            }
          />
          <Stat
            label="Community portion"
            value={
              global ? <FameAmount amount={global.communityFee} /> : "Loading…"
            }
          />
        </div>

        <Stack spacing={1}>
          <Typography>
            You deposit a whole Society NFT with its attached 1,000,000 FAME.
          </Typography>
          <Typography>
            You may withdraw a different Society from the marketplace. Your
            original NFT is not reserved.
          </Typography>
          <Typography>
            The withdrawal premium reaches 0 after 24 hours. You can exit sooner
            by paying the current premium.
          </Typography>
          <Typography color="warning.main" fontWeight={700}>
            Do not transfer Society NFTs directly to the marketplace. They
            become irreversible, uncredited donations. Use the staking actions
            on these pages.
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Your per-sale share can change as the pool changes.
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

export function GalleryProviderPositionCard({
  global,
  position,
  walletControl,
}: {
  global: GalleryGlobalState | null;
  position: GalleryHookProjection<GalleryLiquidityProviderPosition>;
  walletControl?: ReactNode;
}) {
  if (position.status === "idle") {
    return (
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography component="h2" variant="h5">
            Your liquidity position
          </Typography>
          <Typography color="text.secondary">
            Connect a wallet to see credited provider units and exit options.
          </Typography>
          {walletControl}
        </Stack>
      </Paper>
    );
  }
  if (position.status === "loading") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }} role="status">
        <Typography>Loading your liquidity position…</Typography>
      </Paper>
    );
  }
  if (position.status === "failure") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        {position.message}
      </Paper>
    );
  }

  const units = position.data.unitCount;
  const share = global
    ? existingProviderPerSaleShare(
        global.providerFee,
        units,
        global.totalProviderUnits,
      )
    : null;
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Stack spacing={2}>
        <div>
          <Typography component="h2" variant="h5">
            Your liquidity position
          </Typography>
          <Typography sx={{ mt: 1 }} fontWeight={700}>
            {units.toString()} credited provider{" "}
            {units === 1n ? "unit" : "units"}
          </Typography>
          <Typography color="text.secondary">
            {share === null ? (
              "Loading current share…"
            ) : (
              <>
                <FameAmount amount={share} /> current share per marketplace sale
              </>
            )}
          </Typography>
        </div>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <LinkButton href="/fame/market/stake/deposit" variant="contained">
            Add Society NFTs
          </LinkButton>
          {units > 0n ? (
            <LinkButton href="/fame/market/stake/unstake" variant="outlined">
              Exit liquidity
            </LinkButton>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}

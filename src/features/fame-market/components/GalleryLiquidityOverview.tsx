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
              Contribute whole Society NFTs as market liquidity and earn an
              equal-weight share of the provider portion of marketplace premiums
              for every credited unit you provide.
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
            Each staked Society stays a whole DN404 unit with its attached
            1,000,000 FAME while the marketplace holds it. Your original token
            ID is not reserved.
          </Typography>
          <Typography>
            When you exit, choose one current marketplace Society and accept
            the provider-specific withdrawal premium shown before the wallet
            action.
          </Typography>
          <Typography>
            The exiting unit is removed before provider-fee distribution. Any
            remaining credited units may still receive their normal provider
            share.
          </Typography>
          <Typography color="warning.main" fontWeight={700}>
            Direct Society NFT transfers to the marketplace are
            irreversible, uncredited donations. Use only the staking actions on
            these pages.
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Shares shown here use current contract state.
            They are per marketplace transaction, not a promise of future sales
            or earnings.
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

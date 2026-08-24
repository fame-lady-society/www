"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
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
import { MarketplaceStakingExplainer } from "./MarketplaceStakingExplainer";

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
        <div>
          <Typography component="h2" variant="h5">
            Put your Society to work.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Stake a whole Society NFT and earn FAME on marketplace sales.
          </Typography>
        </div>
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
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Stack spacing={0}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "flex-start" }}
          spacing={2}
          sx={{ p: { xs: 2.5, sm: 4 } }}
        >
          <div>
            <Typography component="h2" variant="h4">
              How marketplace staking works.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
              You are providing inventory to a live marketplace—not parking an
              NFT in a vault. Understand what can happen to it before you stake.
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

        <MarketplaceStakingExplainer />

        <Box sx={{ p: { xs: 2.5, sm: 4 }, pt: { xs: 1, sm: 1.5 } }} component="div">
          <Typography component="h3" variant="h5">
            Live marketplace numbers
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
            Your fee share changes as NFTs and providers enter or leave the
            marketplace.
          </Typography>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="NFTs in marketplace"
              value={
                global
                  ? `${global.inventory.toString()} Society ${global.inventory === 1n ? "NFT" : "NFTs"}`
                  : "Loading…"
              }
            />
            <Stat
              label="Active liquidity providers"
              value={
                global
                  ? `${global.activeProviderCount.toString()} / ${global.activeProviderCap.toString()}`
                  : "Loading…"
              }
            />
            <Stat
              label="Provider NFTs staked"
              value={global ? global.totalProviderUnits.toString() : "Loading…"}
            />
            <Stat
              label="Your share with 1 NFT"
              value={
                prospectiveShare === null ? (
                  "Loading…"
                ) : (
                  <>
                    <FameAmount amount={prospectiveShare} /> per marketplace
                    sale
                  </>
                )
              }
            />
            <Stat
              label="Marketplace fee per sale"
              value={
                global ? <FameAmount amount={global.premium} /> : "Loading…"
              }
            />
            <Stat
              label="Paid to providers"
              value={
                global ? <FameAmount amount={global.providerFee} /> : "Loading…"
              }
            />
            <Stat
              label="Paid to community"
              value={
                global ? (
                  <FameAmount amount={global.communityFee} />
                ) : (
                  "Loading…"
                )
              }
            />
          </div>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Typography>
              The withdrawal fee reaches 0 after 24 hours. You can exit sooner
              by paying the current withdrawal fee.
            </Typography>
            <Alert severity="warning" variant="outlined">
              <strong>Only use the staking actions on these pages.</strong> Do
              not transfer Society NFTs directly to the marketplace contract.
              Direct transfers become irreversible, uncredited donations.
            </Alert>
          </Stack>
        </Box>
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

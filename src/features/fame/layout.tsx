"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import NextImage from "next/image";
import Link from "next/link";
import type { FC, ReactNode } from "react";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import { DefaultProvider } from "@/context/default";
import { FameMarketBoard } from "@/features/fame-landing/components/FameMarketBoard";
import type { LandingMarketPresentation } from "@/features/fame-landing/pricePresentation";
import { FameFAQ } from "@/features/fame/components/FameFAQ";
import { FameMain } from "@/features/fame/components/FameShell";
import { fameFromNetwork } from "@/features/fame/contract";
import { AuctionLiveCta } from "@/features/society-nft-auction/components/AuctionLiveCta";
import { SocietyNftReadinessRail } from "@/features/society-nft-readiness/components/SocietyNftReadinessRail";

const CopyButton = styled(Button)({
  border: 0,
  justifyContent: "flex-start",
  minWidth: 0,
  padding: 0,
  textTransform: "none",
});

function Arrow() {
  return <span aria-hidden>↗</span>;
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="fame-action fame-focus inline-flex min-h-12 items-center justify-center bg-[#c9aa67] px-6 text-sm font-bold text-[#0d0c0a]"
    >
      {children}
    </Link>
  );
}

function TextLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className="fame-action fame-focus inline-flex items-center gap-2 border-b border-[#c9aa67]/50 pb-1 text-sm font-semibold text-[#f4eee2] hover:border-[#c9aa67] hover:text-[#e4cd96]"
    >
      {children}
    </Link>
  );
}

function ContractRow({ label, address }: { label: string; address: string }) {
  return (
    <div className="grid gap-2 border-t border-[#c9aa67]/20 py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#918878]">
        {label}
      </p>
      <CopyToClipboard text={address} clipboard>
        {(handleClick) => (
          <CopyButton
            onClick={handleClick}
            endIcon={<ContentCopyIcon sx={{ fontSize: 17 }} />}
            sx={{
              color: "text.primary",
              "&:hover": {
                backgroundColor: "transparent",
                color: "primary.light",
              },
            }}
          >
            <Typography
              component="span"
              fontFamily="monospace"
              sx={{
                overflowWrap: "anywhere",
                textAlign: "left",
                fontSize: { xs: "0.72rem", sm: "0.84rem" },
              }}
            >
              {address}
            </Typography>
          </CopyButton>
        )}
      </CopyToClipboard>
    </div>
  );
}

const Content: FC<{ market: LandingMarketPresentation }> = ({ market }) => {
  const fameTokenAddress = fameFromNetwork(8453);
  const fameNftAddress = "0xbb5ed04dd7b207592429eb8d599d103ccad646c4";

  return (
    <div className="fame-landing overflow-hidden">
      <section className="relative isolate border-b border-[#c9aa67]/15">
        <div className="pointer-events-none absolute left-[-10rem] top-[-8rem] -z-10 h-[34rem] w-[34rem] rounded-full bg-[#c9aa67]/[0.07] blur-[120px]" />
        <div className="mx-auto grid min-h-[calc(100dvh-68px)] max-w-[1440px] items-center gap-10 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-12 lg:px-12 lg:pb-24 lg:pt-20">
          <div className="relative z-10 lg:col-span-7 lg:py-12">
            <p className="fame-kicker">Base · token meets collection</p>
            <h1 className="fame-display mt-6 max-w-4xl text-balance text-[clamp(4.2rem,9vw,8.8rem)] leading-[0.82]">
              Hold the token.
              <span className="mt-2 block text-[#c9aa67]">Meet Society.</span>
            </h1>
            <p className="mt-8 max-w-xl text-pretty text-base leading-7 text-[#bdb4a4] sm:text-lg sm:leading-8">
              One million FAME resolves to one Society NFT. Trade the token,
              collect the artwork, or rotate toward the Society you want—all on
              Base.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <PrimaryLink href="/fame/swap">Trade FAME</PrimaryLink>
              <TextLink href="/fame/market">
                Browse the marketplace <Arrow />
              </TextLink>
              <TextLink href="/fame/rotate">Open the rotator</TextLink>
            </div>
            <div className="mt-10 max-w-xl">
              <AuctionLiveCta />
            </div>
          </div>

          <div className="relative flex min-h-[30rem] items-center justify-center lg:col-span-5 lg:min-h-[42rem]">
            <p
              aria-hidden
              className="fame-display absolute right-[-10%] top-[7%] -z-10 select-none text-[clamp(10rem,22vw,23rem)] leading-none text-[#c9aa67]/[0.035]"
            >
              F
            </p>
            <NextImage
              src="/images/fame/gold-leaf-square-nobg.png"
              alt="Gold FAME Society mark"
              width={760}
              height={1520}
              priority
              loading="eager"
              style={{ width: "auto" }}
              className="h-[30rem] w-auto object-contain drop-shadow-[0_30px_55px_rgba(111,83,25,0.22)] sm:h-[36rem] lg:h-[42rem]"
            />
            <div className="absolute bottom-2 right-0 border-l border-[#c9aa67] bg-[#0d0c0a]/90 py-3 pl-4 pr-5 backdrop-blur sm:bottom-12">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#918878]">
                The balance
              </p>
              <p className="mt-1 font-mono text-sm tabular-nums text-[#f4eee2]">
                1 million $FAME = 1 Society NFT
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-[1320px] px-4 sm:px-8">
        <FameMarketBoard market={market} />
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-28 sm:px-8 lg:py-40">
        <header className="grid gap-6 border-b border-[#c9aa67]/25 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="fame-kicker">Three ways in</p>
            <h2 className="fame-display mt-4 max-w-4xl text-balance text-5xl leading-[0.94] sm:text-7xl">
              A market designed around the art.
            </h2>
          </div>
          <p className="max-w-md text-pretty text-sm leading-6 text-[#9f9789] lg:col-span-4">
            Buy FAME through preferred liquidity, collect a Society work, or
            follow the waiting pool toward a specific target.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <article className="group relative min-h-[34rem] overflow-hidden bg-[#17130d] lg:col-span-7">
            <NextImage
              src="/images/fame/fame.png"
              alt="FAME token artwork"
              width={960}
              height={960}
              style={{ height: "auto" }}
              className="fame-artwork absolute bottom-[-18%] right-[-10%] h-auto w-[82%] max-w-[42rem] opacity-90"
            />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#17130d] via-[#17130d]/80 to-transparent" />
            <div className="relative z-10 flex h-full max-w-md flex-col justify-between p-7 sm:p-10">
              <div>
                <p className="fame-kicker">01 · Marketplace</p>
                <h3 className="fame-display mt-4 text-5xl sm:text-6xl">
                  Collect a Society.
                </h3>
                <p className="mt-5 max-w-sm text-sm leading-6 text-[#bdb4a4]">
                  Choose artwork first, then pay directly with FAME or use an
                  atomic route from ETH or USDC.
                </p>
              </div>
              <div className="mt-20">
                <TextLink href="/fame/market">
                  Enter the market <Arrow />
                </TextLink>
              </div>
            </div>
          </article>

          <div className="grid gap-6 lg:col-span-5">
            <article className="group flex min-h-[16rem] flex-col justify-between bg-[#c9aa67] p-7 text-[#0d0c0a] sm:p-9">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#0d0c0a]/60">
                  02 · Swap
                </p>
                <h3 className="fame-display mt-3 text-4xl sm:text-5xl">
                  Trade through preferred pools.
                </h3>
              </div>
              <Link
                href="/fame/swap"
                className="fame-action fame-focus mt-8 inline-flex w-fit items-center gap-2 border-b border-[#0d0c0a]/50 pb-1 text-sm font-bold"
              >
                Open FAME swap <span aria-hidden>↗</span>
              </Link>
            </article>
            <article className="group relative flex min-h-[16rem] flex-col justify-between overflow-hidden border border-[#c9aa67]/25 bg-[#11100d] p-7 sm:p-9">
              <div className="absolute -right-10 -top-10 size-40 rounded-full border border-[#c9aa67]/20" />
              <div>
                <p className="fame-kicker">03 · Rotator</p>
                <h3 className="fame-display mt-3 max-w-md text-4xl sm:text-5xl">
                  Swap from the waiting Society.
                </h3>
              </div>
              <div className="mt-8">
                <TextLink href="/fame/rotate">
                  See the queue <Arrow />
                </TextLink>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-[#c9aa67]/20 bg-[#11100d]">
        <div className="mx-auto grid max-w-[1320px] lg:grid-cols-12">
          <div className="relative min-h-[22rem] overflow-hidden lg:col-span-7 lg:min-h-[34rem]">
            <NextImage
              src="/images/fame/eyes.png"
              alt="Painted eyes from a Society portrait"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-contain object-center p-8 sm:p-14"
            />
          </div>
          <div className="flex flex-col justify-center border-t border-[#c9aa67]/20 px-6 py-16 sm:px-10 lg:col-span-5 lg:border-l lg:border-t-0 lg:px-14">
            <p className="fame-kicker">Community-owned since 2023</p>
            <h2 className="fame-display mt-5 text-balance text-5xl sm:text-6xl">
              The collection outlived its creators.
            </h2>
            <p className="mt-7 max-w-md text-pretty text-base leading-7 text-[#bdb4a4]">
              Fame Lady Society grew from a community takeover of the original
              all-female generative PFP project. FAME carries that same idea
              forward: the market, the artwork, and the next chapter belong to
              the people holding them.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              <TextLink href="https://t.me/famesocietybase" external>
                Telegram
              </TextLink>
              <TextLink href="https://x.com/fameladysociety" external>
                X / Twitter
              </TextLink>
              <TextLink href="https://discord.gg/jkAdAPXEpw" external>
                Discord
              </TextLink>
              <TextLink href="https://warpcast.com/fameladysociety" external>
                Farcaster
              </TextLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1320px] gap-12 px-5 py-28 sm:px-8 lg:grid-cols-12 lg:py-36">
        <div className="lg:col-span-4">
          <p className="fame-kicker">Verified coordinates</p>
          <h2 className="fame-display mt-4 text-5xl sm:text-6xl">
            Find FAME on Base.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#9f9789]">
            Use the contract addresses below when adding the token or checking
            the Society collection.
          </p>
        </div>
        <div className="lg:col-span-8">
          <ContractRow label="ERC-20 / FAME" address={fameTokenAddress} />
          <ContractRow label="ERC-721 / Society" address={fameNftAddress} />
          <nav
            aria-label="FAME resources"
            className="flex flex-wrap gap-x-7 gap-y-3 border-t border-[#c9aa67]/20 pt-6"
          >
            <TextLink
              href="https://dexscreener.com/search?q=0xf307e242BfE1EC1fF01a4Cef2fdaa81b10A52418"
              external
            >
              Dexscreener <Arrow />
            </TextLink>
            <TextLink
              href="https://opensea.io/collection/fameladysociety"
              external
            >
              OpenSea <Arrow />
            </TextLink>
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 pb-24 sm:px-8">
        <div className="border-t border-[#c9aa67]/25 pt-10">
          <h2 className="fame-display mb-8 text-4xl">Questions, answered.</h2>
          <div>
            <FameFAQ />
          </div>
        </div>
      </section>

      <footer className="border-t border-[#c9aa67]/20 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5 text-xs leading-5 text-[#918878] sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-2xl">
            $FAME is a community token for the Fame Lady Society. No intrinsic
            value, expectation of financial return, or utility is guaranteed
            outside its use within the community.
          </p>
          <p className="font-mono tabular-nums">Base · Chain 8453</p>
        </div>
      </footer>
    </div>
  );
};

const Header: FC<{ market: LandingMarketPresentation }> = ({ market }) => (
  <FameMain title="$FAME" activeFamePage="landing">
    <SocietyNftReadinessRail surface="fame" />
    <Content market={market} />
  </FameMain>
);

export const Layout: FC<{ market: LandingMarketPresentation }> = ({
  market,
}) => (
  <DefaultProvider mainnet base polygon fame>
    <Header market={market} />
  </DefaultProvider>
);

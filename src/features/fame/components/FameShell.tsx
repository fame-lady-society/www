"use client";

import MenuList from "@mui/material/MenuList";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import NextLink from "next/link";
import type { PropsWithChildren, ReactNode } from "react";
import { DefaultProvider } from "@/context/default";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { Main } from "@/layouts/Main";
import type { FameNavigationPage } from "@/features/appbar/fameNavigation";

const fameDestinations: ReadonlyArray<{
  href: string;
  label: string;
  page: FameNavigationPage;
}> = [
  { href: "/fame", label: "FAME", page: "landing" },
  { href: "/fame/market", label: "Market", page: "marketplace" },
  { href: "/fame/gallery", label: "Gallery", page: "gallery" },
  { href: "/fame/rotate", label: "Rotate", page: "rotator" },
  { href: "/fame/swap", label: "Swap", page: "swap" },
];

function FameTopNavigation({ activePage }: { activePage: FameNavigationPage }) {
  return (
    <Box
      component="nav"
      aria-label="FAME"
      sx={{
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        gap: 0.5,
      }}
    >
      {fameDestinations.map(({ href, label, page }) => {
        const active = activePage === page;
        return (
          <Link
            key={href}
            component={NextLink}
            href={href}
            aria-current={active ? "page" : undefined}
            underline="none"
            sx={{
              px: 1.25,
              py: 1,
              color: active ? "primary.light" : "text.secondary",
              fontSize: 13,
              fontWeight: active ? 700 : 600,
              letterSpacing: "0.06em",
              transition: "color 180ms ease",
              "&:hover": { color: "text.primary" },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 2,
              },
            }}
          >
            {label}
          </Link>
        );
      })}
    </Box>
  );
}

export function FameMain({
  children,
  title = "FAME",
  activeFamePage = "landing",
}: PropsWithChildren<{
  title?: ReactNode;
  activeFamePage?: FameNavigationPage;
}>) {
  return (
    <Main
      menu={
        <MenuList dense disablePadding>
          <LinksMenuItems />
          <SiteMenu activeFamePage={activeFamePage} />
        </MenuList>
      }
      title={
        <Typography
          component="span"
          sx={{
            ml: { xs: 0, sm: 1 },
            fontWeight: 600,
            fontSize: { xs: 16, sm: 20 },
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </Typography>
      }
      right={<FameTopNavigation activePage={activeFamePage} />}
    >
      <Toolbar />
      <Box
        component="a"
        href="#fame-content"
        sx={{
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: 1400,
          px: 2,
          py: 1,
          color: "background.default",
          backgroundColor: "primary.main",
          transform: "translateY(-150%)",
          transition: "transform 160ms ease",
          "&:focus": { transform: "translateY(0)" },
        }}
      >
        Skip to content
      </Box>
      <div id="fame-content" className="fame-surface">
        {children}
      </div>
    </Main>
  );
}

export function FameShell({
  children,
  title,
  activeFamePage = "landing",
}: PropsWithChildren<{
  title?: ReactNode;
  activeFamePage?: FameNavigationPage;
}>) {
  return (
    <DefaultProvider fame>
      <FameMain title={title} activeFamePage={activeFamePage}>
        {children}
      </FameMain>
    </DefaultProvider>
  );
}

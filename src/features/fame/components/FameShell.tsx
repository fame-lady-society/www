"use client";

import MenuList from "@mui/material/MenuList";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { PropsWithChildren, ReactNode } from "react";
import { DefaultProvider } from "@/context/default";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { Main } from "@/layouts/Main";
import type { FameNavigationPage } from "@/features/appbar/fameNavigation";

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
            fontWeight: 700,
            fontSize: { xs: 16, sm: 20 },
          }}
        >
          {title}
        </Typography>
      }
    >
      <Toolbar />
      {children}
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
    <DefaultProvider base>
      <FameMain title={title} activeFamePage={activeFamePage}>
        {children}
      </FameMain>
    </DefaultProvider>
  );
}

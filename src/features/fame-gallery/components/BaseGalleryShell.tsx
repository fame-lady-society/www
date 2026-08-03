"use client";

import MenuList from "@mui/material/MenuList";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { PropsWithChildren } from "react";
import { DefaultProvider } from "@/context/default";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { Main } from "@/layouts/Main";
import type { GalleryRuntimeConfig } from "../config/galleryRuntime";
import { GalleryRuntimeProvider } from "../config/galleryRuntime";

export function BaseGalleryShell({
  config,
  children,
}: PropsWithChildren<{ config: GalleryRuntimeConfig }>) {
  return (
    <DefaultProvider base>
      <GalleryRuntimeProvider config={config}>
        <Main
          menu={
            <MenuList dense disablePadding>
              <LinksMenuItems />
              <SiteMenu />
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
              FAME Gallery
            </Typography>
          }
        >
          <Toolbar />
          {children}
        </Main>
      </GalleryRuntimeProvider>
    </DefaultProvider>
  );
}

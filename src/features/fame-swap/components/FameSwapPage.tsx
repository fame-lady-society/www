"use client";

import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { DefaultProvider } from "@/context/default";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { Main } from "@/layouts/Main";
import { FameSwapWidget } from "./FameSwapWidget";

export function FameSwapPage() {
  return (
    <DefaultProvider base>
      <Main
        menu={
          <MenuList dense disablePadding>
            <LinksMenuItems />
            <SiteMenu isFameSwap />
          </MenuList>
        }
        title={
          <Typography variant="h5" component="h1" marginLeft={2}>
            FAME swap
          </Typography>
        }
      >
        <div className="flex min-h-[calc(100vh-64px)] items-start px-0 pb-2 pt-12 sm:px-2 sm:pb-5 sm:pt-10">
          <FameSwapWidget mode="full" />
        </div>
      </Main>
    </DefaultProvider>
  );
}

"use client";
import { FC } from "react";
import { DefaultProvider } from "@/context/default";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import useMediaQuery from "@mui/material/useMediaQuery";
import theme from "@/theme";
import { LoreContent } from "@/features/lore/LoreContent";

const Content: FC = () => {
  const tinyScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const roomForTitle = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Main
      menu={
        <MenuList dense disablePadding>
          <LinksMenuItems />
          <SiteMenu isLore />
        </MenuList>
      }
      title={
        tinyScreen ? null : (
          <Typography variant="h5" component="h1" marginLeft={2}>
            {roomForTitle ? "Our Lore" : "Lore"}
          </Typography>
        )
      }
    >
      <LoreContent />
    </Main>
  );
};

const LorePage: FC = () => {
  return (
    <DefaultProvider>
      <Content />
    </DefaultProvider>
  );
};

export default LorePage;

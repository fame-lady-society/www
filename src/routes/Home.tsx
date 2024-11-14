"use client";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import Button from "@mui/material/Button";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { WrappedLink } from "@/components/WrappedLink";
import { Layout } from "@/features/home/Layout";
import useMediaQuery from "@mui/material/useMediaQuery";
import theme from "@/theme";
import { FC } from "react";

const Content: FC<{}> = () => {
  const tinyScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const roomForTitle = useMediaQuery(theme.breakpoints.up("md"));
  return (
    <Main
      menu={
        <>
          <MenuList dense disablePadding>
            <LinksMenuItems />
            <SiteMenu isHome />
          </MenuList>
        </>
      }
      title={
        <>
          {tinyScreen ? null : (
            <Typography variant="h5" component="h1" marginLeft={2}>
              {roomForTitle ? "Fame Lady Society" : "FLS"}
            </Typography>
          )}
          <Button
            component={WrappedLink}
            href="/fame"
            variant="outlined"
            sx={{ ml: 2 }}
          >
            <Typography variant="h5" component="h1">
              FAME
            </Typography>
          </Button>
          <Button
            component={WrappedLink}
            href="/wrap"
            variant="outlined"
            sx={{ ml: 2 }}
          >
            <Typography variant="h5" component="h1">
              WRAP
            </Typography>
          </Button>
        </>
      }
    >
      <Layout />
    </Main>
  );
};

const HomePage: NextPage<{}> = () => {
  return (
    <DefaultProvider mainnet base>
      <Content />
    </DefaultProvider>
  );
};
export default HomePage;

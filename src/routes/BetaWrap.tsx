import Head from "next/head";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import Box from "@mui/material/Box";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { MintCard } from "@/features/wrap/components/MintCard";
import useClient from "@/hooks/useClient";
import Grid2 from "@mui/material/Unstable_Grid2";
import { FC, useEffect } from "react";
import { BetaTurboWrap } from "@/features/wrap/components/BetaTurboWrap";
import { BetaWrapCard } from "@/features/wrap/components/BetaWrapCard";
import { UnwrapCard } from "@/features/wrap/components/UnWrapCard";
import useLocalStorage from "use-local-storage";
import { AgreeModal } from "@/features/wrap/components/AgreeModal";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { WrapPage } from "@/features/wrap/components/WrapPage";

const BetaWrap: NextPage<{
  hasMint?: boolean;
}> = ({ hasMint = true }) => {
  return (
    <DefaultProvider>
      <Head>
        <title>Fame Lady Society Wrap</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Main
        menu={
          <>
            <MenuList dense disablePadding>
              <LinksMenuItems />
              <SiteMenu isWrap />
            </MenuList>
          </>
        }
        title={
          <Typography variant="h5" component="h1" marginLeft={2}>
            it&apos;s a wrap
          </Typography>
        }
      >
        <WrapPage hasMint={hasMint} />
      </Main>
    </DefaultProvider>
  );
};
export default BetaWrap;

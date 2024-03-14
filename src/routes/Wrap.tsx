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
import { WrapCard } from "@/features/wrap/components/WrapCard";
import { FC, useEffect } from "react";
import { TurboWrap } from "@/features/wrap/components/TurboWrap";
import { UnwrapCard } from "@/features/wrap/components/UnWrapCard";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";

const Content: FC<{
  hasMint?: boolean;
}> = ({ hasMint = true }) => {
  const isClient = useClient();
  return (
    <Container maxWidth="lg">
      <Grid2 container spacing={2}>
        {hasMint ? (
          <Grid2 xs={12} sm={12} md={12}>
            <Box component="div" sx={{ mt: 4 }}>
              {isClient && <MintCard />}
            </Box>
          </Grid2>
        ) : null}
        <Grid2 xs={12} sm={12} md={12}>
          <Box component="div" sx={{ mt: 4 }}>
            {/* {isClient && <TurboWrap />} */}
          </Box>
        </Grid2>
        <Grid2 xs={12} sm={12} md={12}>
          <Box component="div" sx={{ mt: 4 }}>
            {isClient && <WrapCard minTokenId={0} maxTokenId={8887} />}
          </Box>
        </Grid2>
        <Grid2 xs={12} sm={12} md={12}>
          <Box component="div" sx={{ mt: 4 }}>
            {isClient && <UnwrapCard />}
          </Box>
        </Grid2>
      </Grid2>
    </Container>
  );
};

const FaqPage: NextPage<{
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
        <Content hasMint={hasMint} />
      </Main>
    </DefaultProvider>
  );
};
export default FaqPage;

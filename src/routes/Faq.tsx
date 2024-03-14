import Head from "next/head";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import useMediaQuery from "@mui/material/useMediaQuery";
import theme from "@/theme";
import FAQ from "@/features/faq";
import Box from "@mui/material/Box";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";

const FaqPage: NextPage<{}> = () => {
  const title = "Fame Lady Society - FAQ";
  const description = "Frequently Asked Questions about wrapping";
  const roomForTitle = useMediaQuery(theme.breakpoints.up("sm"));
  return (
    <DefaultProvider>
      <Head>
        <title>Fame Lady Society</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta property="og:site_name" content="#itsawrap" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:image"
          content="https://fameladysociety.com/images/fls-wrap.gif"
        />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta content="verification" name="LR1011" />
        <meta
          property="twitter:image"
          content="https://fameladysociety.com/images/Flsociety_morg_mock.jpeg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@FameLadySociety" />
      </Head>
      <Main
        menu={
          <>
            <MenuList dense disablePadding>
              <LinksMenuItems />
              <SiteMenu isFaq />
            </MenuList>
          </>
        }
        title={
          <Typography variant="h5" component="h1" marginLeft={2}>
            {roomForTitle ? "frequently asked questions" : "FAQ"}
          </Typography>
        }
      >
        <Container maxWidth="lg">
          <Box component="div" sx={{ mt: 4 }} />
          <FAQ />
        </Container>
      </Main>
    </DefaultProvider>
  );
};
export default FaqPage;

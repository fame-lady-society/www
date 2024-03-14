import Head from "next/head";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import Box from "@mui/material/Box";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { CountDown } from "@/components/CountDown";
import NextImage from "next/image";
import { RandomWrapVideo } from "@/features/reveal/components/RandomWrapVideo";
import { PostReveal } from "@/features/reveal/components/PostReveal";
import { useState } from "react";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { WrappedLink } from "@/components/WrappedLink";

const HomePage: NextPage<{}> = () => {
  const title = "Fame Lady Society";
  const description = "Unstoppable";
  const [isRevealed, setIsRevealed] = useState(false);

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
              <SiteMenu isHome />
            </MenuList>
          </>
        }
        title={
          <>
            <Typography variant="h5" component="h1" marginLeft={2}>
              {isRevealed ? "Fame Lady Society" : "coming soon"}
            </Typography>
            {isRevealed ? (
              <WrappedLink href="/wrap">
                <Typography variant="h5" component="h1" marginLeft={2}>
                  wrap here
                </Typography>
              </WrappedLink>
            ) : null}
          </>
        }
      >
        {isRevealed ? (
          <PostReveal />
        ) : (
          <Container maxWidth="lg">
            <Box component="div" sx={{ mt: 4 }}>
              <NextImage
                src="/images/Flsociety_morg_mock.png"
                alt="hero"
                layout="responsive"
                width={1920}
                height={1080}
              />
            </Box>
            <Box component="div" sx={{ mt: 4 }}>
              <CountDown onEnd={() => setIsRevealed(true)} />
            </Box>
          </Container>
        )}
      </Main>
      {isRevealed ? null : (
        <RandomWrapVideo
          urls={[
            "/videos/wrap1.mp4",
            "/videos/wrap2.mp4",
            "/videos/wrap3.mp4",
            "/videos/wrap4.mp4",
            "/videos/wrap5.mp4",
            "/videos/wrap6.mp4",
            "/videos/wrap7.mp4",
            "/videos/wrap8.mp4",
            "/videos/wrap9.mp4",
            "/videos/wrap10.mp4",
          ]}
          interval={10000}
        />
      )}
    </DefaultProvider>
  );
};
export default HomePage;

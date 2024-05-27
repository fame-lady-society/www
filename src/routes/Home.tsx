"use client";
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
          content="https://fls-www.vercel.app/images/fls-wrap.gif"
        />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta content="verification" name="LR1011" />
        <meta
          property="twitter:image"
          content="https://fls-www.vercel.app/images/Flsociety_morg_mock.jpeg"
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
              Fame Lady Society
            </Typography>
            <WrappedLink href="/wrap">
              <Typography variant="h5" component="h1" marginLeft={2}>
                wrap here
              </Typography>
            </WrappedLink>
          </>
        }
      >
        <PostReveal />
      </Main>
    </DefaultProvider>
  );
};
export default HomePage;

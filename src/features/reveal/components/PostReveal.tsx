import { FC, useEffect, useRef, useState } from "react";
import { Parallax, ParallaxLayer } from "@react-spring/parallax";
import { useScroll, animated, useSpring } from "@react-spring/web";

import NextImage from "next/image";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Unstable_Grid2";
import { Card, CardActionArea, Typography } from "@mui/material";
import { WrappedLink } from "@/components/WrappedLink";

export const PostReveal = () => {
  return (
    <>
      <Parallax pages={3}>
        <ParallaxLayer offset={0} speed={0.5}>
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

            <Typography variant="h6" align="center">
              down
            </Typography>
            <Typography variant="h6" align="center">
              \/
            </Typography>
          </Container>
        </ParallaxLayer>
        <ParallaxLayer offset={1} speed={0.5}>
          <Container maxWidth="xl">
            <WrappedLink href="/wrap">
              <Typography
                variant="h2"
                align="center"
                sx={{
                  textShadow: "0 0 3px #FF0000, 0 0 5px #0000FF",
                }}
              >
                #itsawrap
              </Typography>
            </WrappedLink>
          </Container>
        </ParallaxLayer>
        <ParallaxLayer
          offset={2.1}
          onClick={() => {
            // send user to https://discord.gg/fameladysociety in a new tab
            window.open("https://discord.gg/fameladysociety", "_blank");
          }}
        >
          <Container maxWidth="xl">
            <Grid2 container justifyContent="flex-start" alignContent="start">
              <Grid2
                xs={6}
                sm={6}
                md={4}
                lg={3}
                sx={{
                  ml: {
                    sm: 0,
                    md: 4,
                  },
                }}
              >
                <Box component="div" display="flex" flexDirection="column">
                  <NextImage
                    src="/images/Flsociety_morg_mock.png"
                    alt="hero"
                    layout="responsive"
                    width={640}
                    height={480}
                  />
                  <Box
                    component="div"
                    minHeight={{
                      xs: 10,
                      sm: 10,
                      md: 100,
                      lg: 100,
                      xl: 200,
                    }}
                  />
                  <Card variant="elevation">
                    <CardActionArea
                      sx={{
                        my: 4,
                      }}
                      href="https://discord.gg/fameladysociety"
                    >
                      <Typography variant="h6" align="center">
                        Join our
                      </Typography>
                      <Box component="div" paddingX={2}>
                        <NextImage
                          src="/images/reveal/discord-dark.png"
                          alt="discord"
                          layout="responsive"
                          width={240}
                          height={60}
                        />
                      </Box>
                      <Typography variant="h6" align="center">
                        for more information
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Box>
              </Grid2>
            </Grid2>
          </Container>
        </ParallaxLayer>
        <ParallaxLayer
          offset={2.1}
          onClick={() => {
            // send user to https://discord.gg/fameladysociety in a new tab
            window.open("https://discord.gg/fameladysociety", "_blank");
          }}
        >
          <Container maxWidth="xl">
            <Grid2 container justifyContent="flex-end" alignContent="end">
              <Grid2 xs={6} sm={6} md={4} lg={3}>
                <NextImage
                  src="/images/reveal/fls_wrap.png"
                  alt="hero"
                  layout="responsive"
                  width={440}
                  height={800}
                />
              </Grid2>
            </Grid2>
          </Container>
        </ParallaxLayer>
      </Parallax>
    </>
  );
};

"use client";
import Head from "next/head";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import Container from "@mui/material/Container";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import Box, { BoxProps } from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardActionArea from "@mui/material/CardActionArea";
import Button from "@mui/material/Button";
import DownloadIcon from "@mui/icons-material/Download";
import NextImage from "next/image";
import { AdjustableChecker } from "@/features/claim/components/AdjustableChecker";
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useInView } from "react-intersection-observer";
import { useSpring, animated } from "react-spring";
import { Parallax, ParallaxProvider } from "react-scroll-parallax";
import { Sticky } from "react-sticky";

const StickyImage: FC<PropsWithChildren> = ({ children }) => {
  const [height, setHeight] = useState("100vh");
  const [paddingTop, setPaddingTop] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const newHeight = Math.max(window.innerHeight - window.scrollY, 650);
      setHeight(`${newHeight}px`);
      console.log(newHeight);
      if (newHeight > 650) {
        const newPaddingTop = Math.max(window.scrollY, 0);
        setPaddingTop(newPaddingTop);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      style={{
        overflow: "hidden",
        paddingTop: `${paddingTop}px`,
        height,
      }}
    >
      {children}
    </div>
  );
};

const ParallaxImage: FC<PropsWithChildren> = ({ children, ...rest }) => {
  return <Parallax translateY={[-20, 20]}>{children}</Parallax>;
};

const AnimatedBox = animated(Box);

const AnimatedBoxFallIn: FC<PropsWithChildren<BoxProps>> = ({
  children,
  ...rest
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5, // Adjusts when the animation triggers
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(-150px)",
    config: { mass: 1, tension: 210, friction: 20 },
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const AnimatedBoxFadeIn: FC<PropsWithChildren<BoxProps>> = ({
  children,
  ...rest
}) => {
  const { ref, inView } = useInView({
    threshold: 1, // Adjusts when the animation triggers
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    config: { mass: 10, tension: 120, friction: 50 },
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const AnimatedBoxPopAndFadeIn: FC<PropsWithChildren<BoxProps>> = ({
  children,
  ...rest
}) => {
  const { ref, inView } = useInView({
    threshold: 0.5, // Adjusts when the animation triggers
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "scale(1)" : "scale(0.5)",
    config: { mass: 1, tension: 210, friction: 20 },
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const AnimatedSlideInLeft: FC<PropsWithChildren<BoxProps>> = ({
  children,
  ...rest
}) => {
  const { ref, inView } = useInView({
    threshold: 0.5, // Adjusts when the animation triggers
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateX(0)" : "translateX(-150px)",
    config: { mass: 1, tension: 210, friction: 20 },
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const AnimatedSlideInRight: FC<PropsWithChildren<BoxProps>> = ({
  children,
  ...rest
}) => {
  const { ref, inView } = useInView({
    threshold: 0.5, // Adjusts when the animation triggers
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateX(0)" : "translateX(150px)",
    config: { mass: 1, tension: 210, friction: 20 },
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const Content: FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));
  const imageWidth = isSmallScreen ? window.innerWidth : 1000;
  const imageHeight = 383;

  return (
    <Main
      title={
        <Typography variant="h5" component="h1" marginLeft={2}>
          $FAME
        </Typography>
      }
    >
      <Container sx={{ mt: 2 }}>
        <Grid2 container spacing={2}>
          <Grid2 xs={12}>
            <AnimatedBoxFallIn
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={8}
            >
              <StickyImage>
                <NextImage
                  src="/images/fame/Cool_Lady.jpeg"
                  alt="Fame Society"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                  }}
                  layout="responsive"
                  width={imageWidth}
                  height={imageWidth * (imageHeight / imageWidth)}
                />
              </StickyImage>
            </AnimatedBoxFallIn>
          </Grid2>
          <Grid2 xs={12}>
            <AnimatedBoxFadeIn
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={6}
            >
              <Typography variant="h2" textTransform="uppercase">
                presents
              </Typography>
            </AnimatedBoxFadeIn>
          </Grid2>
          <Grid2 xs={12}>
            <AnimatedBoxPopAndFadeIn
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={8}
            >
              <NextImage
                src="/images/fame/fame.png"
                alt="Fame Society"
                width={500}
                height={500}
              />
            </AnimatedBoxPopAndFadeIn>
          </Grid2>
          <Grid2 xs={12}>
            <AnimatedBoxPopAndFadeIn
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={8}
            >
              <Typography
                variant="h3"
                textTransform="uppercase"
                textAlign="center"
              >
                a community token
              </Typography>
            </AnimatedBoxPopAndFadeIn>
          </Grid2>
          <Grid2
            lg={3}
            sm={12}
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
          >
            <AnimatedSlideInLeft
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={8}
            >
              <NextImage
                src="/images/fame/bala.png"
                alt="Fame Society"
                width={300}
                height={300}
                style={{ marginTop: 32 }}
              />
            </AnimatedSlideInLeft>
          </Grid2>
          <Grid2
            lg={6}
            sm={12}
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
          >
            <AnimatedBoxFallIn
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={8}
            >
              <NextImage
                src="/images/fame/zepeto.png"
                alt="Fame Society"
                width={550}
                height={400}
              />
            </AnimatedBoxFallIn>
          </Grid2>
          <Grid2
            lg={3}
            sm={12}
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
          >
            <AnimatedSlideInRight
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={8}
            >
              <NextImage
                src="/images/fame/gm-bri-bam2.png"
                alt="Fame Society"
                width={250}
                height={400}
              />
            </AnimatedSlideInRight>
          </Grid2>
          <Grid2 xs={12}>
            <AnimatedBoxPopAndFadeIn
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={8}
            >
              <Typography
                variant="h3"
                textTransform="uppercase"
                textAlign="center"
              >
                by and for the fame ladies
              </Typography>
            </AnimatedBoxPopAndFadeIn>
          </Grid2>
          <Grid2 xs={12}>
            <AnimatedBoxPopAndFadeIn
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={8}
            >
              <NextImage
                src="/images/fame/eyes.png"
                alt="Fame Society"
                width={1000}
                height={500}
              />
            </AnimatedBoxPopAndFadeIn>
          </Grid2>
          <Grid2 xs={12}>
            <AnimatedBoxPopAndFadeIn
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={50}
            >
              <Typography
                variant="h3"
                textTransform="uppercase"
                textAlign="center"
              >
                a DN404 project
              </Typography>
            </AnimatedBoxPopAndFadeIn>
          </Grid2>
          <Grid2 xs={12}>
            <AnimatedBoxPopAndFadeIn
              component="div"
              display="flex"
              justifyContent="center"
              alignItems="center"
              marginTop={2}
              marginBottom={50}
            >
              <Typography
                variant="h3"
                textTransform="uppercase"
                textAlign="center"
              >
                coming soon....
              </Typography>
            </AnimatedBoxPopAndFadeIn>
          </Grid2>
        </Grid2>
      </Container>
    </Main>
  );
};

const NextPage: NextPage<{}> = () => {
  return (
    <DefaultProvider>
      <ParallaxProvider>
        <Head>
          <title>Fame Society Admin</title>
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
          />
        </Head>
        <Content />
      </ParallaxProvider>
    </DefaultProvider>
  );
};
export default NextPage;

"use client";
import { DefaultProvider } from "@/context/default";
import Container from "@mui/material/Container";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import Box, { BoxProps } from "@mui/material/Box";
import NextImage from "next/image";
import { FC, PropsWithChildren, useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useInView } from "react-intersection-observer";
import { useSpring, animated } from "react-spring";
import { Parallax, ParallaxProvider, useParallax } from "react-scroll-parallax";
import { TwitterIcon } from "@/components/icons/twitter";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import { WrappedLink } from "@/components/WrappedLink";
import { OpenSeaIcon } from "@/components/icons/opensea";
import { SlimChecker } from "@/features/claim-to-fame/components/SlimChecker";
import MenuList from "@mui/material/MenuList";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { styled } from "@mui/material/styles";
import { useAccount } from "@/hooks/useAccount";
import { useReadContract } from "wagmi";
import {
  fameLadySocietyAbi,
  fameLadySocietyAddress,
  fameSaleAbi,
} from "@/wagmi";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import { fameFromNetwork, fameSaleAddress } from "@/features/fame/contract";
import { FameFAQ } from "@/features/presale/components/FameFAQ";
import {
  OG_AGE_BOOST,
  OG_RANK_BOOST,
} from "@/features/claim-to-fame/hooks/constants";
import { SingleTokenChecker } from "@/features/claim-to-fame/components/SingleTokenChecker";

const BASE_URL = "https://fame.support/thumb/";
function ImageForToken({ tokenId }: { tokenId: bigint }) {
  return (
    <NextImage
      src={`${BASE_URL}${tokenId.toString()}`}
      alt={`Burned token ${tokenId.toString()}`}
      width={400}
      height={400}
    />
  );
}

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

const AnimatedBoxFallUp: FC<PropsWithChildren<BoxProps>> = ({
  children,
  ...rest
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5, // Adjusts when the animation triggers
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(150px)",
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

const AnimatedBoxSlowFadeIn: FC<PropsWithChildren<BoxProps>> = ({
  children,
  ...rest
}) => {
  const { ref, inView } = useInView({
    threshold: 1, // Adjusts when the animation triggers
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    config: { mass: 10, tension: 75, friction: 26 },
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
    threshold: 0.1, // Adjusts when the animation triggers
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateX(0)" : "translateX(-150px)",
    config: { mass: 2, tension: 50, friction: 20 },
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
    threshold: 0.1, // Adjusts when the animation triggers
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateX(0)" : "translateX(150px)",
    config: { mass: 2, tension: 50, friction: 20 },
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const CopyButton = styled(Button)({
  border: 0,
  justifyContent: "start",
  textTransform: "none", // Keeps the text style similar to Typography
});

const Content: FC<{
  burnPool: number[];
  unrevealed: string[];
}> = ({ burnPool, unrevealed }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));
  const isTinyScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const imageWidth = isSmallScreen ? 200 : 400;
  const imageHeight = Math.floor(imageWidth * 2);
  const eyesRef = useRef<HTMLImageElement>(null);
  const eyesContainer = useParallax<HTMLDivElement>({
    onProgressChange: (progress) => {
      if (eyesRef.current) {
        // when progress is at 0.5, opacity is 1, when progress is at 0 or 1, opacity is 0
        eyesRef.current.style.opacity = (progress * (1 - progress)).toString();
      }
    },
  });

  return (
    <Grid2 container spacing={2} sx={{ mt: 4, mx: 4, pt: 2 }}>
      <Grid2
        xs={12}
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        mt={8}
        overflow="hidden"
      >
        <NextImage
          src="/images/fame/gold-leaf-square-nobg.png"
          alt="Fame Society"
          width={imageWidth}
          height={imageHeight}
        />
      </Grid2>
      <Grid2
        xs={12}
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        overflow="hidden"
      >
        <AnimatedBoxSlowFadeIn
          component="div"
          display="flex"
          justifyContent="center"
          alignItems="center"
          marginTop={2}
          marginBottom={6}
        >
          <Typography
            variant="h2"
            textTransform="uppercase"
            fontSize={isSmallScreen ? "32px" : "96px"}
          >
            $FAME Society
          </Typography>
        </AnimatedBoxSlowFadeIn>
      </Grid2>
      <Grid2
        xs={12}
        sm={6}
        md={3}
        marginBottom={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <AnimatedBoxPopAndFadeIn component="div">
          <WrappedLink
            href="https://t.me/famesocietybase"
            underline="none"
            target="_blank"
            rel="noreferrer"
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <NextImage
              src="/images/logos/telegram.png"
              alt="reservoir"
              width={25}
              height={25}
              style={{
                maxWidth: "100%",
                height: "auto",
                marginRight: 8,
              }}
            />
            <Typography variant="body1">Telegram</Typography>
          </WrappedLink>
        </AnimatedBoxPopAndFadeIn>
      </Grid2>
      <Grid2
        xs={12}
        sm={6}
        md={3}
        marginTop={2}
        marginBottom={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <AnimatedBoxPopAndFadeIn component="div">
          <WrappedLink
            href="https://x.com/fameladysociety"
            underline="none"
            target="_blank"
            rel="noreferrer"
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <TwitterIcon sx={{ marginRight: 1 }} />
            <Typography variant="body1">Twitter</Typography>
          </WrappedLink>
        </AnimatedBoxPopAndFadeIn>
      </Grid2>
      <Grid2
        xs={12}
        sm={6}
        md={3}
        marginBottom={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <AnimatedBoxPopAndFadeIn component="div">
          <WrappedLink
            href="https://discord.gg/jkAdAPXEpw"
            underline="none"
            target="_blank"
            rel="noreferrer"
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <NextImage
              src="/images/logos/discord-dark.png"
              alt="discord"
              width={25}
              height={25}
              style={{
                maxWidth: "100%",
                height: "auto",
                marginRight: 8,
              }}
            />
            <Typography variant="body1">Discord</Typography>
          </WrappedLink>
        </AnimatedBoxPopAndFadeIn>
      </Grid2>

      <Grid2
        xs={12}
        sm={6}
        md={3}
        marginBottom={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <AnimatedBoxPopAndFadeIn component="div">
          <WrappedLink
            href="https://warpcast.com/fameladysociety"
            underline="none"
            target="_blank"
            rel="noreferrer"
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <NextImage
              src="/images/logos/warpcast.png"
              alt="discord"
              width={25}
              height={25}
              style={{
                maxWidth: "100%",
                height: "auto",
                marginRight: 8,
              }}
            />
            <Typography variant="body1">Farcaster</Typography>
          </WrappedLink>
        </AnimatedBoxPopAndFadeIn>
      </Grid2>
      <Grid2
        xs={12}
        height={isSmallScreen ? "700px" : "420px"}
        marginBottom={4}
      >
        <Box
          component="div"
          sx={{
            position: "absolute",
            left: "50%",
            width: "100vw",
            height: isSmallScreen ? "700px" : "420px",
            backgroundColor: "white",
            transform: "translateX(-50%)",
            zIndex: 1, // Ensure it's above other content
          }}
        >
          <Grid2
            container
            justifyContent="flex-start"
            alignItems="center"
            spacing="4"
            color="black"
          >
            <Grid2 xs={4} sm={2} px={2}>
              <Typography
                variant="h5"
                textAlign="start"
                fontSize={isSmallScreen ? "16px" : "24px"}
              >
                chain
              </Typography>
            </Grid2>
            <Grid2 xs={8} sm={10} px={2}>
              <Typography
                variant="h5"
                mt={0.05}
                fontSize={isSmallScreen ? "16px" : "24px"}
              >
                base
              </Typography>
            </Grid2>

            <Grid2 xs={12} sm={2} px={2}>
              <Typography
                variant="h5"
                textAlign="start"
                fontSize={isSmallScreen ? "16px" : "24px"}
              >
                erc20
              </Typography>
            </Grid2>
            <Grid2 xs={12} sm={10} pl={1}>
              <CopyToClipboard text={fameFromNetwork(8453)}>
                {(handleClick) => (
                  <CopyButton
                    endIcon={
                      <ContentCopyIcon
                        sx={{
                          color: "black",
                        }}
                      />
                    }
                    onClick={handleClick}
                  >
                    <Typography
                      variant="h5"
                      mt={0.05}
                      color="black"
                      fontSize={isSmallScreen ? "16px" : "24px"}
                    >
                      {fameFromNetwork(8453)}
                    </Typography>
                  </CopyButton>
                )}
              </CopyToClipboard>
            </Grid2>
            <Grid2 xs={12} sm={2} px={2}>
              <Typography
                variant="h5"
                textAlign="start"
                fontSize={isSmallScreen ? "16px" : "24px"}
              >
                erc721
              </Typography>
            </Grid2>
            <Grid2 xs={12} sm={10} pl={1}>
              <CopyToClipboard
                text={"0xbb5ed04dd7b207592429eb8d599d103ccad646c4"}
              >
                {(handleClick) => (
                  <CopyButton
                    endIcon={
                      <ContentCopyIcon
                        sx={{
                          color: "black",
                        }}
                      />
                    }
                    onClick={handleClick}
                  >
                    <Typography
                      variant="h5"
                      mt={0.05}
                      color="black"
                      fontSize={isSmallScreen ? "16px" : "24px"}
                    >
                      0xbb5ed04dd7b207592429eb8d599d103ccad646c4
                    </Typography>
                  </CopyButton>
                )}
              </CopyToClipboard>
            </Grid2>
            <Grid2 xs={6} md={3} p={4}>
              <Card>
                <CardActionArea
                  href="https://base.equalizer.exchange/swap?fromToken=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&toToken=0xf307e242BfE1EC1fF01a4Cef2fdaa81b10A52418"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <CardContent
                    sx={{
                      height: "220px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant={isTinyScreen ? "body1" : "h5"}
                      textAlign="center"
                      textTransform="uppercase"
                      sx={{
                        width: "100%",
                      }}
                    >
                      equalizer (swap)
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid2>
            <Grid2 xs={6} md={3} p={4}>
              <Card>
                <CardActionArea
                  href="https://dexscreener.com/search?q=0xf307e242BfE1EC1fF01a4Cef2fdaa81b10A52418"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <CardContent
                    sx={{
                      height: "220px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant={isTinyScreen ? "body1" : "h5"}
                      textAlign="center"
                      textTransform="uppercase"
                      sx={{
                        width: "100%",
                      }}
                    >
                      dexscreener
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid2>
            <Grid2 xs={6} md={3} p={4}>
              <Card>
                <CardActionArea
                  href="https://v3.nftx.io/base/collections/famesociety/info/society-8"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <CardContent
                    sx={{
                      height: "220px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant={isTinyScreen ? "body1" : "h5"}
                      textAlign="center"
                      textTransform="uppercase"
                      sx={{
                        width: "100%",
                      }}
                    >
                      nftx vault
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid2>
            <Grid2 xs={6} md={3} p={4}>
              <Card>
                <CardActionArea
                  href="https://opensea.io/collection/fameladysociety"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <CardContent
                    sx={{
                      height: "220px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant={isTinyScreen ? "body1" : "h5"}
                      textAlign="center"
                      textTransform="uppercase"
                      sx={{
                        width: "100%",
                      }}
                    >
                      opensea
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid2>
          </Grid2>
        </Box>
      </Grid2>
      {burnPool.length > 0 && (
        <Grid2 xs={12} sx={{ marginTop: 4 }}>
          <Typography variant="h4" textAlign="center">
            The next $FAME Ladies to be minted
          </Typography>
          <Typography variant="h5" textAlign="center">
            In this order (left to right).
          </Typography>
        </Grid2>
      )}
      {burnPool.map((tokenId) => (
        <Grid2 xs={6} md={3} key={tokenId}>
          <ImageForToken tokenId={BigInt(tokenId)} />
        </Grid2>
      ))}
      {unrevealed.length > 0 && (
        <Grid2 xs={12} sx={{ marginTop: 4 }}>
          <Typography variant="h4" textAlign="center">
            The unrevealed $FAME Ladies.
          </Typography>
          <Typography variant="h5" textAlign="center">
            In no particular order.
          </Typography>
        </Grid2>
      )}
      {unrevealed.map((uri) => (
        <Grid2 xs={6} md={3} key={uri}>
          <NextImage src={uri} alt="Unrevealed" width={400} height={400} />
        </Grid2>
      ))}
      <Grid2 xs={12}>
        <AnimatedBoxFadeIn
          component="div"
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          marginTop={2}
          marginBottom={8}
        >
          <Typography variant="h5" textAlign="center">
            1 million $FAME = 1 Society NFT
          </Typography>
          <Typography textAlign="center" marginY={2}>
            WE are the Fame Lady Society and this is $FAME, a revolutionary
            DN-404 project featuring 888 stunning Fame inspired female NFT’s
            liquidity backed by 888 million $FAME tokens.
          </Typography>
          <Typography textAlign="center" marginY={2}>
            Buy 1 million $FAME and one of our rare and exclusive Society Ladies
            mint into your wallet making you feel special and complete.
          </Typography>
          <Typography textAlign="center" marginY={2}>
            Sell any portion of that million $FAME and she will disappear
            leaving you heart broken and bewildered.
          </Typography>
          <Typography textAlign="center" marginY={2}>
            So the choice is yours.
          </Typography>
          <Typography textAlign="center" marginY={2}>
            One thing is for sure the $FAME/Society token/NFT will change the
            way the World thinks about NFT assets and how they can be traded and
            gamified.
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
          overflow="hidden"
        >
          <NextImage
            src="/images/fame/fame.png"
            alt="Fame Society"
            width={isTinyScreen ? 250 : 500}
            height={isTinyScreen ? 250 : 500}
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
          overflow="hidden"
        >
          <Typography variant="h3" textTransform="uppercase" textAlign="center">
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
        overflow="hidden"
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
            width={isTinyScreen ? 150 : 300}
            height={isTinyScreen ? 150 : 300}
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
        overflow="hidden"
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
            width={isTinyScreen ? 225 : 550}
            height={isTinyScreen ? 200 : 400}
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
        overflow="hidden"
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
            width={isTinyScreen ? 125 : 250}
            height={isTinyScreen ? 200 : 400}
          />
        </AnimatedSlideInRight>
      </Grid2>
      <Grid2 xs={12} overflow="hidden">
        <AnimatedBoxPopAndFadeIn
          component="div"
          display="flex"
          justifyContent="center"
          alignItems="center"
          marginTop={2}
          marginBottom={8}
        >
          <Typography variant="h3" textTransform="uppercase" textAlign="center">
            by and for the fame ladies
          </Typography>
        </AnimatedBoxPopAndFadeIn>
      </Grid2>
      <Grid2
        ref={eyesContainer.ref}
        xs={12}
        marginBottom={20}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        overflow="hidden"
      >
        <Parallax speed={-30}>
          <NextImage
            ref={eyesRef}
            src="/images/fame/eyes.png"
            alt="Fame Society"
            width={1000}
            height={500}
            style={{
              position: "relative",
              top: 180,
              marginBottom: 32,
            }}
          />
        </Parallax>
        <Parallax speed={10}>
          <Typography
            variant="h3"
            textTransform="uppercase"
            textAlign="center"
            marginTop={2}
            marginBottom={50}
            position="relative"
            top={-100}
          >
            a DN404 project
          </Typography>
        </Parallax>
      </Grid2>
      <Grid2 xs={12}>
        <AnimatedBoxFadeIn
          component="div"
          display="flex"
          justifyContent="center"
          alignItems="center"
          marginTop={2}
          marginBottom={8}
        >
          <Typography variant="h5" textAlign="left">
            The Fame Lady Society (FLSoc) is a vibrant community of NFT
            collectors and creators dedicated to the original Fame Lady Squad
            (FLS) NFTs, the pioneering all-female generative PFP project on the
            Ethereum blockchain. With a strong focus on transparency, community
            governance, inclusivity, and women&apos;s empowerment, FLSoc aims to
            transform Web3 into &lsquo;webWE,&rsquo; fostering a collaborative
            and supportive environment.
          </Typography>
        </AnimatedBoxFadeIn>
      </Grid2>
      <Grid2 xs={12}>
        <AnimatedBoxFadeIn
          component="div"
          display="flex"
          justifyContent="center"
          alignItems="center"
          marginTop={2}
          marginBottom={8}
        >
          <Typography variant="h5" textAlign="left">
            Fame Lady Society&apos;s mission is to ensure that every member has
            a voice in shaping the project&apos;s future, promoting true
            decentralization and sustainability for the benefit of the entire
            community. FLSoc emerged from the challenges faced by the original
            FLS, including a fraudulent foundation and a community-driven
            takeover led by passionate members determined to reclaim and honor
            the project&apos;s promise.
          </Typography>
        </AnimatedBoxFadeIn>
      </Grid2>
      <Grid2 xs={12}>
        <AnimatedBoxFadeIn
          component="div"
          display="flex"
          justifyContent="center"
          alignItems="center"
          marginTop={2}
          marginBottom={16}
        >
          <Typography variant="h5" textAlign="left">
            Established on December 11, 2022, the Fame Lady Society continues to
            fight for the return of the original smart contract while offering
            an alternative through a newly created smart contract by 0xflick.
            This effort ensures that the community can maintain ownership and
            governance of their assets, reinforcing the society&apos;s
            commitment to a decentralized and inclusive future.
          </Typography>
        </AnimatedBoxFadeIn>
      </Grid2>
      <Grid2 xs={12} marginY="4">
        <AnimatedBoxFadeIn
          component="div"
          display="flex"
          justifyContent="center"
          alignItems="center"
          marginTop={2}
          marginBottom={8}
        >
          <Typography variant="h4" textAlign="center">
            Join the Society
          </Typography>
        </AnimatedBoxFadeIn>
      </Grid2>
      <Grid2
        xs={12}
        sm={6}
        md={3}
        marginBottom={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <AnimatedBoxFallUp component="div">
          <WrappedLink
            href="https://x.com/fameladysociety"
            underline="none"
            target="_blank"
            rel="noreferrer"
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <TwitterIcon sx={{ marginRight: 1 }} />
            <Typography variant="body1">Twitter</Typography>
          </WrappedLink>
        </AnimatedBoxFallUp>
      </Grid2>
      <Grid2
        xs={12}
        sm={6}
        md={3}
        marginBottom={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <AnimatedBoxFallUp component="div">
          <WrappedLink
            href="https://discord.gg/jkAdAPXEpw"
            underline="none"
            target="_blank"
            rel="noreferrer"
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <NextImage
              src="/images/reveal/discord-dark.png"
              alt="discord"
              width={90}
              height={25}
              style={{
                maxWidth: "100%",
                height: "auto",
                marginRight: 8,
              }}
            />
            <Typography variant="body1" color="white">
              invite
            </Typography>
          </WrappedLink>
        </AnimatedBoxFallUp>
      </Grid2>
      <Grid2
        xs={12}
        sm={6}
        md={3}
        marginBottom={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <AnimatedBoxFallUp component="div">
          <WrappedLink
            href="https://buy.fameladysociety.com"
            underline="none"
            target="_blank"
            rel="noreferrer"
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <NextImage
              src="/images/logos/reservoir.svg"
              alt="reservoir"
              width={25}
              height={25}
              style={{
                maxWidth: "100%",
                height: "auto",
                marginRight: 8,
              }}
            />
            <Typography variant="body1">Marketplace</Typography>
          </WrappedLink>
        </AnimatedBoxFallUp>
      </Grid2>
      <Grid2
        xs={12}
        sm={6}
        md={3}
        marginBottom={2}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <AnimatedBoxFallUp component="div">
          <WrappedLink
            href="https://opensea.io/collection/fameladysociety"
            underline="none"
            target="_blank"
            rel="noreferrer"
            display="flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <OpenSeaIcon sx={{ marginRight: 1 }} />
            <Typography variant="body1">OpenSea</Typography>
          </WrappedLink>
        </AnimatedBoxFallUp>
      </Grid2>
      <Grid2
        xs={12}
        sx={{
          marginTop: 8,
        }}
      >
        <SingleTokenChecker />
      </Grid2>

      <Grid2 xs={12} marginY="4">
        <Typography variant="body1" textAlign="center">
          $FAME is a community token for the Fame Lady Society. No intrinsic
          value, expectation of financial return, or utility is guaranteed
          outside of the use of the token within the community.
        </Typography>
      </Grid2>

      <Grid2 xs={12} marginY="4">
        <Card>
          <CardContent>
            <FameFAQ />
          </CardContent>
        </Card>
      </Grid2>
    </Grid2>
  );
};

const Header: FC<{ burnPool: number[]; unrevealed: string[] }> = ({
  burnPool,
  unrevealed,
}) => {
  const { address } = useAccount();
  const { data: balance } = useReadContract({
    address: fameLadySocietyAddress[1],
    abi: fameLadySocietyAbi,
    chainId: 1,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  const { data: isPaused } = useReadContract({
    abi: fameSaleAbi,
    address: fameSaleAddress(8453),
    functionName: "isPaused",
    chainId: 1,
  });

  const theme = useTheme();
  const tinyScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const smallScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Main
      menu={
        <>
          <MenuList dense disablePadding>
            <LinksMenuItems />
            <SiteMenu isFame />
          </MenuList>
        </>
      }
      title={
        <>
          {tinyScreen ? null : (
            <Typography variant="h5" component="h1" marginLeft={2}>
              $FAME
            </Typography>
          )}
        </>
      }
    >
      <ParallaxProvider>
        <Content burnPool={burnPool} unrevealed={unrevealed} />
      </ParallaxProvider>
    </Main>
  );
};

export const Layout: FC<{ burnPool: number[]; unrevealed: string[] }> = ({
  burnPool,
  unrevealed,
}) => {
  return (
    <DefaultProvider mainnet base polygon>
      <Header burnPool={burnPool} unrevealed={unrevealed} />
    </DefaultProvider>
  );
};

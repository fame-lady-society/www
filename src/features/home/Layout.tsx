"use client";
import { FC, PropsWithChildren } from "react";
import { useInView } from "react-intersection-observer";
import { useSpring, animated } from "react-spring";
import NextImage from "next/image";
import Container from "@mui/material/Container";
import Box, { type BoxProps } from "@mui/material/Box";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { WrappedLink } from "@/components/WrappedLink";
import { TwitterIcon } from "@/components/icons/twitter";
import GitHubIcon from "@mui/icons-material/GitHub";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const AnimatedBox = animated(Box);

const AnimatedFadeIn: FC<
  PropsWithChildren<BoxProps & { delay?: number }>
> = ({ children, delay = 0, ...rest }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(40px)",
    config: { mass: 1, tension: 100, friction: 20 },
    delay: delay,
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const AnimatedScaleIn: FC<
  PropsWithChildren<BoxProps & { delay?: number }>
> = ({ children, delay = 0, ...rest }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "scale(1)" : "scale(0.9)",
    config: { mass: 1, tension: 180, friction: 20 },
    delay: delay,
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const GradientText: FC<PropsWithChildren<{ variant?: "primary" | "secondary" }>> = ({
  children,
  variant = "primary",
}) => (
  <Box
    component="span"
    sx={{
      background:
        variant === "primary"
          ? "linear-gradient(135deg, #ff6b9d 0%, #c44dff 50%, #6b5bff 100%)"
          : "linear-gradient(135deg, #ffd700 0%, #ff8c00 50%, #ff6347 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}
  >
    {children}
  </Box>
);

const FeatureCard: FC<{
  icon: string;
  title: string;
  description: string;
  delay?: number;
}> = ({ icon, title, description, delay = 0 }) => (
  <AnimatedFadeIn component="div" delay={delay}>
    <Card
      sx={{
        height: "100%",
        background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: "rgba(196, 77, 255, 0.3)",
          boxShadow: "0 20px 40px rgba(196, 77, 255, 0.1)",
        },
      }}
    >
      <CardContent sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h2" sx={{ mb: 2, fontSize: "3rem" }}>
          {icon}
        </Typography>
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ letterSpacing: "-0.02em" }}
        >
          {title}
        </Typography>
        <Typography color="text.secondary" lineHeight={1.7}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  </AnimatedFadeIn>
);

const StatCard: FC<{
  value: string;
  label: string;
  delay?: number;
}> = ({ value, label, delay = 0 }) => (
  <AnimatedScaleIn component="div" delay={delay}>
    <Box component="div" textAlign="center" p={2}>
      <Typography
        variant="h2"
        fontWeight={800}
        sx={{
          background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: { xs: "2.5rem", md: "3.5rem" },
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        textTransform="uppercase"
        letterSpacing="0.1em"
        fontSize="0.85rem"
        fontWeight={500}
      >
        {label}
      </Typography>
    </Box>
  </AnimatedScaleIn>
);

const SocialCard: FC<{
  href: string;
  icon: React.ReactNode;
  label: string;
  delay?: number;
}> = ({ href, icon, label, delay = 0 }) => (
  <AnimatedFadeIn component="div" delay={delay}>
    <Card
      component={WrappedLink}
      href={href}
      target="_blank"
      rel="noreferrer"
      sx={{
        textDecoration: "none",
        textAlign: "center",
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.1)",
        transition: "all 0.3s ease",
        "&:hover": {
          backgroundColor: "rgba(255,255,255,0.05)",
          borderColor: "rgba(196, 77, 255, 0.4)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        component="div"
        sx={{
          width: 48,
          height: 48,
          mb: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "& svg": { fontSize: 40 },
          "& img": { objectFit: "contain" },
        }}
      >
        {icon}
      </Box>
      <Typography fontWeight={500}>{label}</Typography>
    </Card>
  </AnimatedFadeIn>
);

export const Layout: FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isTinyScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      component="div"
      sx={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, rgba(196, 77, 255, 0.08) 0%, transparent 50%)",
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: 8 }}>
        <Grid2 container spacing={4} alignItems="center">
          <Grid2 xs={12} md={6}>
            <AnimatedFadeIn component="div">
              <Typography
                variant="overline"
                sx={{
                  color: "primary.main",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  mb: 2,
                  display: "block",
                }}
              >
                EST. JULY 12, 2021
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontSize: isTinyScreen ? "2.5rem" : isSmallScreen ? "3.5rem" : "4.5rem",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  mb: 3,
                }}
              >
                The First
                <br />
                <GradientText>All-Female</GradientText>
                <br />
                Generative PFP
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 4, lineHeight: 1.7, maxWidth: 480 }}
              >
                Fame Lady Society is a community-owned Web3 project celebrating women&apos;s empowerment, radical transparency,
                and true decentralization.
              </Typography>
              <Box component="div" display="flex" flexWrap="wrap" gap={2}>
                <Button
                  component={WrappedLink}
                  href="/fame"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    backgroundColor: "transparent !important",
                    background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%) !important",
                    color: "#fff !important",
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: "1rem",
                    "&:hover": {
                      backgroundColor: "transparent !important",
                      background: "linear-gradient(135deg, #ff8cb5 0%, #d06aff 100%) !important",
                    },
                  }}
                >
                  Explore $FAME
                </Button>
                <Button
                  component={WrappedLink}
                  href="/wrap"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: "1rem",
                    borderColor: "rgba(255,255,255,0.3)",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "rgba(196, 77, 255, 0.1)",
                    },
                  }}
                >
                  Wrap Your NFT
                </Button>
                <Button
                  component={WrappedLink}
                  href="/lore"
                  variant="text"
                  size="large"
                  sx={{
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    color: "text.secondary",
                    "&:hover": {
                      color: "primary.main",
                    },
                  }}
                >
                  Read Our Story →
                </Button>
              </Box>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={12} md={6}>
            <AnimatedScaleIn component="div" delay={200}>
              <Box
                component="div"
                sx={{
                  position: "relative",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: "10%",
                    left: "10%",
                    right: "10%",
                    bottom: "10%",
                    background: "radial-gradient(circle, rgba(196, 77, 255, 0.3) 0%, transparent 70%)",
                    filter: "blur(60px)",
                    zIndex: 0,
                  },
                }}
              >
                <NextImage
                  src="/images/Flsociety_morg_mock.png"
                  alt="Fame Lady Society"
                  width={800}
                  height={600}
                  priority
                  style={{
                    width: "100%",
                    height: "auto",
                    position: "relative",
                    zIndex: 1,
                  }}
                />
              </Box>
            </AnimatedScaleIn>
          </Grid2>
        </Grid2>
      </Container>

      {/* Stats Section */}
      <Box
        component="section"
        sx={{
          py: 6,
          background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Container maxWidth="lg">
          <Grid2 container spacing={2}>
            <Grid2 xs={6} sm={3}>
              <StatCard value="8,888" label="Original NFTs" delay={0} />
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <StatCard value="100%" label="Community-Owned" delay={100} />
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <StatCard value="888M" label="$FAME Tokens" delay={200} />
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <StatCard value="0" label="Paid Team" delay={300} />
            </Grid2>
          </Grid2>
        </Container>
      </Box>

      {/* HERstoric Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <AnimatedFadeIn component="div">
          <Typography
            variant="h2"
            textAlign="center"
            fontWeight={800}
            sx={{
              mb: 2,
              fontSize: { xs: "2rem", md: "3rem" },
              letterSpacing: "-0.02em",
            }}
          >
            An <GradientText>HERstoric</GradientText> Journey
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            maxWidth={700}
            mx="auto"
            mb={8}
            lineHeight={1.7}
          >
            When the original founders were exposed as frauds, the community
            didn&apos;t walk away—we took over. Today, Fame Lady Society stands
            as proof that Web3 is truly about community.
          </Typography>
        </AnimatedFadeIn>

        <Grid2 container spacing={4}>
          <Grid2 xs={12} md={4}>
            <FeatureCard
              icon="🎭"
              title="From Scandal to Strength"
              description="Launched as the first all-female PFP project, then exposed as a fraud. The community seized control and rebuilt everything—the right way."
              delay={0}
            />
          </Grid2>
          <Grid2 xs={12} md={4}>
            <FeatureCard
              icon="👑"
              title="Community First"
              description="No VCs, no corporate interests. Every decision is made by and for the community through the FAMEus DAO. Your voice matters here."
              delay={100}
            />
          </Grid2>
          <Grid2 xs={12} md={4}>
            <FeatureCard
              icon="💎"
              title="True Ownership"
              description="Wrap your original NFT for gas-efficient transfers, or collect $FAME tokens—1 million $FAME automatically mints a Society Lady to your wallet."
              delay={200}
            />
          </Grid2>
        </Grid2>
      </Container>

      {/* $FAME Section */}
      <Box
        component="section"
        sx={{
          py: 12,
          background: "linear-gradient(180deg, rgba(196, 77, 255, 0.05) 0%, transparent 50%, rgba(107, 91, 255, 0.05) 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Grid2 container spacing={6} alignItems="center">
            <Grid2 xs={12} md={5}>
              <AnimatedScaleIn component="div">
                <Box
                  component="div"
                  sx={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <NextImage
                    src="/images/fame/fame.png"
                    alt="$FAME Token"
                    width={400}
                    height={400}
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                    }}
                  />
                </Box>
              </AnimatedScaleIn>
            </Grid2>
            <Grid2 xs={12} md={7}>
              <AnimatedFadeIn component="div" delay={100}>
                <Typography
                  variant="overline"
                  sx={{
                    color: "primary.main",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    mb: 1,
                    display: "block",
                  }}
                >
                  LAUNCHED JULY 12, 2024
                </Typography>
                <Typography
                  variant="h2"
                  fontWeight={800}
                  sx={{
                    mb: 3,
                    fontSize: { xs: "2rem", md: "3rem" },
                    letterSpacing: "-0.02em",
                  }}
                >
                  Introducing <GradientText variant="secondary">$FAME</GradientText>
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3, lineHeight: 1.8, fontSize: "1.1rem" }}
                >
                  A revolutionary DN404 token on Base that bridges ERC20 liquidity
                  with NFT art. 888 unique Society NFTs are backed by 888 million
                  $FAME tokens.
                </Typography>
                <Box
                  component="div"
                  sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    mb={1}
                  >
                    1,000,000 $FAME = 1 Society Lady
                  </Typography>
                  <Typography color="text.secondary">
                    Collect 1 million $FAME, and a Society Lady NFT automatically
                    mints to your wallet. True liquidity-backed art.
                  </Typography>
                </Box>
                <Button
                  component={WrappedLink}
                  href="/fame"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    backgroundColor: "transparent !important",
                    background: "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%) !important",
                    color: "#000 !important",
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    "&:hover": {
                      backgroundColor: "transparent !important",
                      background: "linear-gradient(135deg, #ffe033 0%, #ffa033 100%) !important",
                    },
                  }}
                >
                  Get $FAME
                </Button>
              </AnimatedFadeIn>
            </Grid2>
          </Grid2>
        </Container>
      </Box>

      {/* Wrapping Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Grid2 container spacing={6} alignItems="center">
          <Grid2 xs={12} md={7} order={{ xs: 2, md: 1 }}>
            <AnimatedFadeIn component="div">
              <Typography
                variant="overline"
                sx={{
                  color: "primary.main",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  mb: 1,
                  display: "block",
                }}
              >
                MODERNIZED SMART CONTRACT
              </Typography>
              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  mb: 3,
                  fontSize: { xs: "2rem", md: "3rem" },
                  letterSpacing: "-0.02em",
                }}
              >
                Wrap Your <GradientText>Fame Lady</GradientText>
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.8, fontSize: "1.1rem" }}
              >
                Own an original Fame Lady Squad NFT? Wrap it to receive a Fame Lady
                Society NFT with the same artwork. Your original is held safely in
                the contract—unwrap anytime.
              </Typography>
              <Box component="div" sx={{ mb: 4 }}>
                {[
                  "Gas-efficient transfers on modern ERC721 contract",
                  "Royalties directed to the community treasury",
                  "Same beautiful artwork, enhanced functionality",
                  "Fully reversible—unwrap to reclaim your original",
                ].map((item, index) => (
                  <Box
                    key={index}
                    component="div"
                    display="flex"
                    alignItems="center"
                    mb={1.5}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 2,
                        fontSize: "0.8rem",
                      }}
                    >
                      ✓
                    </Box>
                    <Typography color="text.secondary">{item}</Typography>
                  </Box>
                ))}
              </Box>
              <Button
                component={WrappedLink}
                href="/wrap"
                variant="outlined"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  borderWidth: 2,
                  "&:hover": {
                    borderWidth: 2,
                  },
                }}
              >
                Start Wrapping
              </Button>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={12} md={5} order={{ xs: 1, md: 2 }}>
            <AnimatedScaleIn component="div" delay={100}>
              <Box
                component="div"
                sx={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <NextImage
                  src="/images/reveal/fls_wrap.png"
                  alt="Wrap your Fame Lady"
                  width={440}
                  height={800}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                  }}
                />
              </Box>
            </AnimatedScaleIn>
          </Grid2>
        </Grid2>
      </Container>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

      {/* Community Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <AnimatedFadeIn component="div">
          <Typography
            variant="h2"
            textAlign="center"
            fontWeight={800}
            sx={{
              mb: 2,
              fontSize: { xs: "2rem", md: "3rem" },
              letterSpacing: "-0.02em",
            }}
          >
            Join the <GradientText>Society</GradientText>
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            maxWidth={600}
            mx="auto"
            mb={6}
            lineHeight={1.7}
          >
            Whether you&apos;re a longtime holder or just discovering us, there&apos;s
            a place for you in the Fame Lady Society.
          </Typography>
        </AnimatedFadeIn>

        <Grid2 container spacing={3} justifyContent="center">
          <Grid2 xs={6} sm={4} md={2}>
            <SocialCard
              href="https://discord.gg/jkAdAPXEpw"
              icon={
                <NextImage
                  src="/images/logos/discord-dark.png"
                  alt="Discord"
                  width={40}
                  height={40}
                />
              }
              label="Discord"
              delay={0}
            />
          </Grid2>
          <Grid2 xs={6} sm={4} md={2}>
            <SocialCard
              href="https://x.com/fameladysociety"
              icon={<TwitterIcon sx={{ fontSize: 40 }} />}
              label="Twitter/X"
              delay={50}
            />
          </Grid2>
          <Grid2 xs={6} sm={4} md={2}>
            <SocialCard
              href="https://t.me/famesocietybase"
              icon={
                <NextImage
                  src="/images/logos/telegram.png"
                  alt="Telegram"
                  width={40}
                  height={40}
                />
              }
              label="Telegram"
              delay={100}
            />
          </Grid2>
          <Grid2 xs={6} sm={4} md={2}>
            <SocialCard
              href="https://warpcast.com/fameladysociety"
              icon={
                <NextImage
                  src="/images/logos/warpcast.png"
                  alt="Farcaster"
                  width={40}
                  height={40}
                />
              }
              label="Farcaster"
              delay={150}
            />
          </Grid2>
          <Grid2 xs={6} sm={4} md={2}>
            <SocialCard
              href="https://www.tally.xyz/gov/fameus-dao"
              icon={<AccountBalanceIcon sx={{ fontSize: 40 }} />}
              label="FAMEus DAO"
              delay={200}
            />
          </Grid2>
          <Grid2 xs={6} sm={4} md={2}>
            <SocialCard
              href="https://github.com/fame-lady-society"
              icon={<GitHubIcon sx={{ fontSize: 40 }} />}
              label="GitHub"
              delay={250}
            />
          </Grid2>
        </Grid2>
      </Container>

      {/* OpenSea CTA */}
      <Box
        component="section"
        sx={{
          py: 10,
          background: "linear-gradient(180deg, transparent 0%, rgba(196, 77, 255, 0.08) 100%)",
        }}
      >
        <Container maxWidth="md">
          <AnimatedFadeIn component="div">
            <Card
              sx={{
                p: { xs: 4, md: 6 },
                textAlign: "center",
                background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Typography
                variant="h3"
                fontWeight={800}
                mb={2}
                sx={{
                  fontSize: { xs: "1.75rem", md: "2.5rem" },
                  letterSpacing: "-0.02em",
                }}
              >
                Ready to become a <GradientText>Fame Lady</GradientText>?
              </Typography>
              <Typography
                color="text.secondary"
                mb={4}
                maxWidth={500}
                mx="auto"
                lineHeight={1.7}
              >
                Browse the collection on OpenSea and find your perfect Fame Lady.
                Join 234+ unique holders in owning a piece of Web3 HERstory.
              </Typography>
              <Button
                component={WrappedLink}
                href="https://opensea.io/collection/fameladysociety"
                target="_blank"
                rel="noreferrer"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: "transparent !important",
                  background: "linear-gradient(135deg, #2081e2 0%, #1868b7 100%) !important",
                  color: "#fff !important",
                  px: 5,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: "1rem",
                  "&:hover": {
                    backgroundColor: "transparent !important",
                    background: "linear-gradient(135deg, #3d9aff 0%, #2081e2 100%) !important",
                  },
                }}
              >
                View on OpenSea
              </Button>
            </Card>
          </AnimatedFadeIn>
        </Container>
      </Box>

      {/* Footer Note */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <AnimatedFadeIn component="div">
          <Typography
            variant="body2"
            textAlign="center"
            color="text.secondary"
            sx={{ opacity: 0.7 }}
          >
            Fame Lady Society is run entirely by volunteers. No paid team, no
            corporate backing—just a passionate community keeping the dream alive.
          </Typography>
        </AnimatedFadeIn>
      </Container>
    </Box>
  );
};

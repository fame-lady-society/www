"use client";
import { FC, PropsWithChildren } from "react";
import Container from "@mui/material/Container";
import Box, { type BoxProps } from "@mui/material/Box";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import NextImage from "next/image";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useInView } from "react-intersection-observer";
import { useSpring, animated } from "react-spring";
import { WrappedLink } from "@/components/WrappedLink";
import { TwitterIcon } from "@/components/icons/twitter";
import GitHubIcon from "@mui/icons-material/GitHub";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

const AnimatedBox = animated(Box);

const AnimatedFadeIn: FC<PropsWithChildren<BoxProps>> = ({
  children,
  ...rest
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(30px)",
    config: { mass: 1, tension: 120, friction: 20 },
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const TimelineItem: FC<{
  date: string;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}> = ({ date, title, children, highlight }) => {
  return (
    <AnimatedFadeIn component="div">
      <Card
        sx={{
          mb: 4,
          borderLeft: highlight ? "4px solid" : "2px solid",
          borderColor: highlight ? "primary.main" : "grey.700",
          backgroundColor: highlight ? "rgba(255,255,255,0.05)" : "transparent",
        }}
      >
        <CardContent>
          <Typography
            variant="overline"
            color="primary"
            fontWeight={700}
            fontSize="0.9rem"
          >
            {date}
          </Typography>
          <Typography variant="h5" component="h3" mt={1} mb={2}>
            {title}
          </Typography>
          {children}
        </CardContent>
      </Card>
    </AnimatedFadeIn>
  );
};

const Section: FC<{
  title: string;
  children: React.ReactNode;
  id?: string;
}> = ({ title, children, id }) => {
  return (
    <Box component="section" id={id} sx={{ mb: 8 }}>
      <AnimatedFadeIn component="div">
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          mb={4}
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {title}
        </Typography>
      </AnimatedFadeIn>
      {children}
    </Box>
  );
};

export const LoreContent: FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isTinyScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Container maxWidth="lg" sx={{ mt: 12, pb: 8 }}>
      {/* Hero Section */}
      <Box component="div" textAlign="center" mb={8}>
        <AnimatedFadeIn component="div">
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontSize: isTinyScreen ? "2rem" : isSmallScreen ? "3rem" : "4rem",
              fontWeight: 700,
              mb: 3,
            }}
          >
            The Lore of
            <br />
            <Box
              component="span"
              sx={{
                background: "linear-gradient(90deg, #ff6b9d, #c44dff, #6b5bff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Fame Lady Society
            </Box>
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            maxWidth="800px"
            mx="auto"
          >
            The HERstoric story of how the first all-female generative PFP
            project became a beacon of community ownership and women&apos;s
            empowerment in Web3.
          </Typography>
        </AnimatedFadeIn>
      </Box>

      {/* Quick Stats */}
      <AnimatedFadeIn component="div">
        <Grid2
          container
          spacing={3}
          justifyContent="center"
          mb={8}
          sx={{
            textAlign: "center",
          }}
        >
          <Grid2 xs={6} sm={3}>
            <Typography variant="h3" fontWeight={700} color="primary">
              8,888
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Original NFTs
            </Typography>
          </Grid2>
          <Grid2 xs={6} sm={3}>
            <Typography variant="h3" fontWeight={700} color="primary">
              2021
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Founded
            </Typography>
          </Grid2>
          <Grid2 xs={6} sm={3}>
            <Typography variant="h3" fontWeight={700} color="primary">
              100%
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Community-Owned
            </Typography>
          </Grid2>
          <Grid2 xs={6} sm={3}>
            <Typography variant="h3" fontWeight={700} color="primary">
              0
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Paid Team Members
            </Typography>
          </Grid2>
        </Grid2>
      </AnimatedFadeIn>

      <Divider sx={{ mb: 8 }} />

      {/* Our Story Timeline */}
      <Section title="Our Story" id="story">
        <TimelineItem
          date="July 12, 2021"
          title="The Beginning"
          highlight
        >
          <Typography mb={2}>
            Fame Lady Squad launched as the <strong>first all-female generative
            PFP project</strong> on the Ethereum blockchain. A collection of
            8,888 unique, bold, and beautiful women entered the NFT space,
            promising to empower and celebrate women in Web3.
          </Typography>
          <Typography>
            The project garnered immediate attention and excitement. Women and
            allies from around the world rallied around the vision of a
            female-forward NFT community.
          </Typography>
        </TimelineItem>

        <TimelineItem date="August 2021" title="The Revelation">
          <Typography mb={2}>
            The community discovered a devastating truth: the &quot;three women
            founders&quot; were actually <strong>Russian men pretending to be
            women</strong>. The promise of female empowerment had been built on
            deception.
          </Typography>
          <Typography>
            Rather than abandon the project, the community chose to fight. What
            could have been the end became the beginning of something far more
            powerful.
          </Typography>
        </TimelineItem>

        <TimelineItem
          date="August 11, 2021"
          title="The Takeover"
          highlight
        >
          <Typography mb={2}>
            In an unprecedented move, the smart contract was transferred to an
            elected community steward. For the first time in NFT history, a
            project&apos;s community had successfully reclaimed their project
            from fraudulent founders.
          </Typography>
          <Typography>
            The steward held the contract until a multi-signature wallet could
            be established on behalf of the entire community. The Fame Ladies
            had taken control of their own destiny.
          </Typography>
        </TimelineItem>

        <TimelineItem date="2021-2022" title="The Challenge">
          <Typography mb={2}>
            Despite the community takeover, access to the original smart
            contract remained complicated. The elected steward, while
            well-intentioned, held sole control over critical infrastructure.
          </Typography>
          <Typography>
            The community worked tirelessly to establish proper governance and
            regain full control, but progress was slow. The Fame Ladies needed a
            new path forward.
          </Typography>
        </TimelineItem>

        <TimelineItem
          date="December 11, 2022"
          title="Fame Lady Society is Born"
          highlight
        >
          <Typography mb={2}>
            The <strong>Fame Lady Society</strong> was officially established—a
            new chapter built entirely by and for the community. A new smart
            contract was created by community developer 0xflick, allowing
            holders to &quot;wrap&quot; their original Fame Lady Squad NFTs into
            Fame Lady Society NFTs.
          </Typography>
          <Typography>
            This wrapping mechanism preserved the original artwork while giving
            holders access to a modern, community-controlled smart contract with
            royalties assigned to the community and gas-efficient transfers.
          </Typography>
        </TimelineItem>

        <TimelineItem
          date="July 12, 2024"
          title="$FAME Launches"
          highlight
        >
          <Typography mb={2}>
            On the 3rd anniversary of the original launch, the community
            introduced <strong>$FAME</strong>—a revolutionary DN404 token that
            bridges the worlds of ERC20 tokens and NFTs.
          </Typography>
          <Typography>
            888 unique Society NFTs are backed by 888 million $FAME tokens.
            Collect 1 million $FAME, and a Society Lady automatically mints to
            your wallet. True liquidity-backed NFTs, created by and for the
            Fame Lady Society.
          </Typography>
        </TimelineItem>

        <TimelineItem date="Present Day" title="The Society Continues">
          <Typography>
            Today, Fame Lady Society stands as a testament to what community can
            achieve. Run entirely by volunteers, governed by its holders, and
            committed to the original vision of women&apos;s empowerment in
            Web3—done right this time, by the community itself.
          </Typography>
        </TimelineItem>
      </Section>

      <Divider sx={{ mb: 8 }} />

      {/* Our Mission */}
      <Section title="Our Mission" id="mission">
        <Grid2 container spacing={4}>
          <Grid2 xs={12} md={6}>
            <AnimatedFadeIn component="div">
              <Card sx={{ height: "100%", p: 2 }}>
                <CardContent>
                  <Typography variant="h5" mb={2} color="primary">
                    🌟 Community First
                  </Typography>
                  <Typography>
                    Every decision is made by and for the community. No
                    VCs, no corporate interests—just passionate volunteers
                    working together. Our governance ensures every voice
                    matters.
                  </Typography>
                </CardContent>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={12} md={6}>
            <AnimatedFadeIn component="div">
              <Card sx={{ height: "100%", p: 2 }}>
                <CardContent>
                  <Typography variant="h5" mb={2} color="primary">
                    💪 Women&apos;s Empowerment
                  </Typography>
                  <Typography>
                    We&apos;re fulfilling the original promise—for real this
                    time. FLS is a space where women lead, create, and thrive
                    in Web3. We&apos;re turning &quot;web3&quot; into
                    &quot;webWE.&quot;
                  </Typography>
                </CardContent>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={12} md={6}>
            <AnimatedFadeIn component="div">
              <Card sx={{ height: "100%", p: 2 }}>
                <CardContent>
                  <Typography variant="h5" mb={2} color="primary">
                    🔓 True Decentralization
                  </Typography>
                  <Typography>
                    We learned the hard way what centralized control means.
                    That&apos;s why Fame Lady Society is built on transparent,
                    decentralized governance. The FAMEus DAO gives every
                    Society holder a vote.
                  </Typography>
                </CardContent>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={12} md={6}>
            <AnimatedFadeIn component="div">
              <Card sx={{ height: "100%", p: 2 }}>
                <CardContent>
                  <Typography variant="h5" mb={2} color="primary">
                    🤝 Radical Transparency
                  </Typography>
                  <Typography>
                    After being deceived by fake founders, we demand honesty.
                    Everything we do is open and verifiable. Our code is public,
                    our decisions are documented, and our community is real.
                  </Typography>
                </CardContent>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
        </Grid2>
      </Section>

      <Divider sx={{ mb: 8 }} />

      {/* How It Works */}
      <Section title="How It Works" id="how-it-works">
        <Grid2 container spacing={4}>
          <Grid2 xs={12} md={4}>
            <AnimatedFadeIn component="div">
              <Box component="div" textAlign="center" p={3}>
                <Typography variant="h1" mb={2}>
                  🎭
                </Typography>
                <Typography variant="h5" mb={2}>
                  Fame Lady Squad (Original)
                </Typography>
                <Typography color="text.secondary">
                  8,888 NFTs on Ethereum launched July 2021. These are the
                  original tokens from the first all-female PFP collection.
                </Typography>
              </Box>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={12} md={4}>
            <AnimatedFadeIn component="div">
              <Box component="div" textAlign="center" p={3}>
                <Typography variant="h1" mb={2}>
                  🔄
                </Typography>
                <Typography variant="h5" mb={2}>
                  Wrap to Society
                </Typography>
                <Typography color="text.secondary">
                  Wrap your original FLS NFT to receive a Fame Lady Society NFT.
                  The original is held in the contract; you can unwrap anytime.
                </Typography>
              </Box>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={12} md={4}>
            <AnimatedFadeIn component="div">
              <Box component="div" textAlign="center" p={3}>
                <Typography variant="h1" mb={2}>
                  💎
                </Typography>
                <Typography variant="h5" mb={2}>
                  $FAME & Society NFTs
                </Typography>
                <Typography color="text.secondary">
                  $FAME is our DN404 token on Base. 1 million $FAME = 1 Society
                  NFT. Liquidity-backed art that you truly own.
                </Typography>
              </Box>
            </AnimatedFadeIn>
          </Grid2>
        </Grid2>
      </Section>

      <Divider sx={{ mb: 8 }} />

      {/* Join Us */}
      <Section title="Join the Society" id="join">
        <AnimatedFadeIn component="div">
          <Box component="div" textAlign="center" mb={4}>
            <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
              Whether you&apos;re a longtime holder or just discovering us,
              there&apos;s a place for you in the Fame Lady Society.
            </Typography>
          </Box>
        </AnimatedFadeIn>

        <Grid2 container spacing={3} justifyContent="center">
          <Grid2 xs={6} sm={4} md={3}>
            <AnimatedFadeIn component="div">
              <Card
                component={WrappedLink}
                href="https://discord.gg/jkAdAPXEpw"
                target="_blank"
                rel="noreferrer"
                sx={{
                  textDecoration: "none",
                  textAlign: "center",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  overflow: "hidden",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                }}
              >
                <Box
                  component="div"
                  sx={{
                    width: 40,
                    height: 40,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    "& > span": {
                      width: "100% !important",
                      height: "100% !important",
                      display: "flex !important",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    "& img": {
                      objectFit: "contain",
                      width: "100%",
                      height: "100%",
                    },
                  }}
                >
                  <NextImage
                    src="/images/logos/discord-dark.png"
                    alt="Discord"
                    width={40}
                    height={40}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography>Discord</Typography>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={6} sm={4} md={3}>
            <AnimatedFadeIn component="div">
              <Card
                component={WrappedLink}
                href="https://x.com/fameladysociety"
                target="_blank"
                rel="noreferrer"
                sx={{
                  textDecoration: "none",
                  textAlign: "center",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  overflow: "hidden",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                }}
              >
                <Box
                  component="div"
                  sx={{
                    width: 40,
                    height: 40,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TwitterIcon sx={{ fontSize: 40, width: "100%", height: "100%" }} />
                </Box>
                <Typography>Twitter/X</Typography>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={6} sm={4} md={3}>
            <AnimatedFadeIn component="div">
              <Card
                component={WrappedLink}
                href="https://t.me/famesocietybase"
                target="_blank"
                rel="noreferrer"
                sx={{
                  textDecoration: "none",
                  textAlign: "center",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  overflow: "hidden",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                }}
              >
                <Box
                  component="div"
                  sx={{
                    width: 40,
                    height: 40,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    "& > span": {
                      width: "100% !important",
                      height: "100% !important",
                      display: "flex !important",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    "& img": {
                      objectFit: "contain",
                      width: "100%",
                      height: "100%",
                    },
                  }}
                >
                  <NextImage
                    src="/images/logos/telegram.png"
                    alt="Telegram"
                    width={40}
                    height={40}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography>Telegram</Typography>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={6} sm={4} md={3}>
            <AnimatedFadeIn component="div">
              <Card
                component={WrappedLink}
                href="https://warpcast.com/fameladysociety"
                target="_blank"
                rel="noreferrer"
                sx={{
                  textDecoration: "none",
                  textAlign: "center",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  overflow: "hidden",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                }}
              >
                <Box
                  component="div"
                  sx={{
                    width: 40,
                    height: 40,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    "& > span": {
                      width: "100% !important",
                      height: "100% !important",
                      display: "flex !important",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    "& img": {
                      objectFit: "contain",
                      width: "100%",
                      height: "100%",
                    },
                  }}
                >
                  <NextImage
                    src="/images/logos/warpcast.png"
                    alt="Farcaster"
                    width={40}
                    height={40}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography>Farcaster</Typography>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={6} sm={4} md={3}>
            <AnimatedFadeIn component="div">
              <Card
                component={WrappedLink}
                href="https://www.tally.xyz/gov/fameus-dao"
                target="_blank"
                rel="noreferrer"
                sx={{
                  textDecoration: "none",
                  textAlign: "center",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  overflow: "hidden",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                }}
              >
                <Box
                  component="div"
                  sx={{
                    width: 40,
                    height: 40,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AccountBalanceIcon sx={{ fontSize: 40, width: "100%", height: "100%" }} />
                </Box>
                <Typography>FAMEus DAO</Typography>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
          <Grid2 xs={6} sm={4} md={3}>
            <AnimatedFadeIn component="div">
              <Card
                component={WrappedLink}
                href="https://github.com/fame-lady-society"
                target="_blank"
                rel="noreferrer"
                sx={{
                  textDecoration: "none",
                  textAlign: "center",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  overflow: "hidden",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                }}
              >
                <Box
                  component="div"
                  sx={{
                    width: 40,
                    height: 40,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GitHubIcon sx={{ fontSize: 40, width: "100%", height: "100%" }} />
                </Box>
                <Typography>GitHub</Typography>
              </Card>
            </AnimatedFadeIn>
          </Grid2>
        </Grid2>

        <AnimatedFadeIn component="div">
          <Box component="div" textAlign="center" mt={6}>
            <Typography variant="body2" color="text.secondary">
              Fame Lady Society is run entirely by volunteers. No paid team, no
              corporate backing—just a passionate community keeping the dream
              alive.
            </Typography>
          </Box>
        </AnimatedFadeIn>
      </Section>
    </Container>
  );
};

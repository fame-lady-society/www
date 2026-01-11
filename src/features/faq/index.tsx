"use client";
import { FC, ReactNode, PropsWithChildren, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Box, { type BoxProps } from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useInView } from "react-intersection-observer";
import { useSpring, animated } from "react-spring";
import { WrappedLink } from "@/components/WrappedLink";

const AnimatedBox = animated(Box);

const AnimatedFadeIn: FC<PropsWithChildren<BoxProps & { delay?: number }>> = ({
  children,
  delay = 0,
  ...rest
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const props = useSpring({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(20px)",
    config: { mass: 1, tension: 120, friction: 20 },
    delay: delay,
  });

  return (
    <AnimatedBox style={props} ref={ref} {...rest}>
      {children}
    </AnimatedBox>
  );
};

const QA: FC<{
  question: ReactNode;
  answer: ReactNode;
  defaultExpanded?: boolean;
}> = ({ question, answer, defaultExpanded = false }) => (
  <Accordion
    defaultExpanded={defaultExpanded}
    sx={{
      background: "transparent",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "none",
      "&:before": { display: "none" },
      "&.Mui-expanded": {
        margin: 0,
      },
    }}
  >
    <AccordionSummary
      expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
      sx={{
        px: 0,
        py: 1,
        "&:hover": {
          "& .MuiTypography-root": {
            color: "primary.main",
          },
        },
      }}
    >
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{
          transition: "color 0.2s ease",
          fontSize: { xs: "1rem", md: "1.15rem" },
        }}
      >
        {question}
      </Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ px: 0, pb: 3 }}>
      {typeof answer === "string" ? (
        <Typography color="text.secondary" lineHeight={1.8}>
          {answer}
        </Typography>
      ) : (
        answer
      )}
    </AccordionDetails>
  </Accordion>
);

const Section: FC<{
  title: string;
  icon: string;
  children: ReactNode;
  delay?: number;
}> = ({ title, icon, children, delay = 0 }) => (
  <AnimatedFadeIn component="div" delay={delay} sx={{ mb: 6 }}>
    <Box
      component="div"
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 3,
        pb: 2,
        borderBottom: "2px solid",
        borderColor: "primary.main",
      }}
    >
      <Typography variant="h4" sx={{ mr: 2, fontSize: "1.5rem" }}>
        {icon}
      </Typography>
      <Typography
        variant="h4"
        fontWeight={700}
        sx={{
          fontSize: { xs: "1.25rem", md: "1.5rem" },
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </Typography>
    </Box>
    {children}
  </AnimatedFadeIn>
);

export const FAQ: FC = () => {
  return (
    <Box component="div" sx={{ pb: 8 }}>
      {/* Hero Header */}
      <AnimatedFadeIn component="div">
        <Box component="div" textAlign="center" mb={8}>
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{
              mb: 2,
              fontSize: { xs: "2rem", md: "3rem" },
              letterSpacing: "-0.03em",
            }}
          >
            Frequently Asked{" "}
            <Box
              component="span"
              sx={{
                background:
                  "linear-gradient(135deg, #ff6b9d 0%, #c44dff 50%, #6b5bff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Questions
            </Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            maxWidth={600}
            mx="auto"
            lineHeight={1.7}
          >
            Everything you need to know about Fame Lady Society, wrapping, $FAME
            tokens, and our community governance.
          </Typography>
        </Box>
      </AnimatedFadeIn>

      {/* Quick Navigation */}
      <AnimatedFadeIn component="div" delay={100}>
        <Box
          component="div"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "center",
            mb: 6,
          }}
        >
          {[
            { label: "About FLS", href: "#about" },
            { label: "Wrapping", href: "#wrapping" },
            { label: "$FAME Token", href: "#fame" },
            { label: "Governance", href: "#governance" },
          ].map((item) => (
            <Chip
              key={item.href}
              label={item.label}
              component="a"
              href={item.href}
              clickable
              sx={{
                px: 1,
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.2)",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "rgba(196, 77, 255, 0.1)",
                },
              }}
            />
          ))}
        </Box>
      </AnimatedFadeIn>

      {/* About Fame Lady Society */}
      <Box component="div" id="about">
        <Section title="About Fame Lady Society" icon="👑" delay={150}>
          <QA
            question="What is the Fame Lady Society?"
            defaultExpanded
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  The Fame Lady Society (FLSoc) is a community-owned NFT project
                  and the evolution of the Fame Lady Squad—the{" "}
                  <strong>first all-female generative PFP project</strong> on
                  Ethereum, launched July 12, 2021 with 8,888 unique tokens.
                </Typography>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  After the original founders were exposed as Russian men
                  pretending to be women, the community took control of the
                  project on August 11, 2021. This historic takeover made Fame
                  Lady Society one of the first truly community-owned NFT
                  projects in Web3.
                </Typography>
                <Typography color="text.secondary" lineHeight={1.8}>
                  Today, Fame Lady Society operates with zero paid team
                  members—every contributor is a volunteer passionate about
                  women&apos;s empowerment, transparency, and true
                  decentralization in Web3.
                </Typography>
              </>
            }
          />
          <QA
            question="What makes Fame Lady Society different from other NFT projects?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  Fame Lady Society stands apart for several reasons:
                </Typography>
                <Box component="ul" sx={{ pl: 3, color: "text.secondary" }}>
                  <li>
                    <Typography lineHeight={1.8}>
                      <strong>HERstoric significance:</strong> The first
                      all-female generative PFP collection ever created
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <strong>Community takeover:</strong> One of the first NFT
                      projects to be reclaimed by its community
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <strong>100% volunteer-run:</strong> No paid team, no VC
                      backing, no corporate interests
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <strong>Radical transparency:</strong> All decisions are
                      documented and governance is on-chain
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <strong>Innovative tokenomics:</strong> The $FAME DN404
                      token bridges NFTs and DeFi liquidity
                    </Typography>
                  </li>
                </Box>
              </>
            }
          />
          <QA
            question="What happened with the original founders?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  In August 2021, the community discovered that the &quot;three
                  women founders&quot; were actually Russian men who had
                  fabricated their identities. This revelation could have
                  destroyed the project.
                </Typography>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  Instead, the community rallied together. The smart contract
                  was transferred to an elected community steward on August 11,
                  2021. This marked a pivotal moment in NFT history—proving that
                  a community could reclaim and rebuild a project from
                  fraudulent founders.
                </Typography>
                <Typography color="text.secondary" lineHeight={1.8}>
                  The Fame Lady Society was officially established in December
                  2022 with a new, community-controlled smart contract,
                  fulfilling the original promise of female empowerment—done
                  right this time.
                </Typography>
              </>
            }
          />
          <QA
            question="Where can I learn more about the history of Fame Lady Society?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8}>
                  Visit our{" "}
                  <WrappedLink href="/lore" sx={{ color: "primary.main" }}>
                    Lore page
                  </WrappedLink>{" "}
                  for the complete HERstoric timeline of Fame Lady Society—from
                  the original launch through the scandal, community takeover,
                  and rebirth as a truly decentralized project.
                </Typography>
              </>
            }
          />
        </Section>
      </Box>

      {/* Wrapping */}
      <Box component="div" id="wrapping">
        <Section title="Wrapping Your NFT" icon="🔄" delay={200}>
          <QA
            question="What is wrapping?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  Wrapping is the process of exchanging your original Fame Lady
                  Squad NFT for a Fame Lady Society NFT. When you wrap, your
                  original NFT is deposited into the Fame Lady Society smart
                  contract, and you receive a new Society NFT with the{" "}
                  <strong>same artwork and token ID</strong>.
                </Typography>
                <Typography color="text.secondary" lineHeight={1.8}>
                  Think of it as upgrading your NFT to a modern, gas-efficient
                  contract while preserving everything that makes your Fame Lady
                  unique.
                </Typography>
              </>
            }
          />
          <QA
            question="Why should I wrap my Fame Lady Squad NFT?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  Wrapping offers several important benefits:
                </Typography>
                <Box component="ul" sx={{ pl: 3, color: "text.secondary" }}>
                  <li>
                    <Typography lineHeight={1.8}>
                      <strong>Gas-efficient transfers:</strong> The modern Fame
                      Lady Society contract is optimized for lower gas fees
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <strong>Community royalties:</strong> Trading fees support
                      the Fame Lady Society treasury
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <strong>Active community:</strong> The original Fame Lady
                      Squad contract is inactive; wrapping keeps you connected
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <strong>Future benefits:</strong> Access to community
                      airdrops, events, and governance participation
                    </Typography>
                  </li>
                </Box>
              </>
            }
          />
          <QA
            question="What happens to my NFT when I wrap it?"
            answer="Your original Fame Lady Squad NFT is deposited into the Fame Lady Society smart contract and becomes immovable—it's safely held by the contract. You receive an equivalent Fame Lady Society NFT with the same token ID and artwork. You can then use your new Society NFT to participate in the community."
          />
          <QA
            question="Can I unwrap my Fame Lady Society NFT?"
            answer="Yes! Wrapping is fully reversible. You can unwrap your Fame Lady Society NFT at any time to receive your original Fame Lady Squad NFT back. When you unwrap, you relinquish the Society NFT and the original is released from the contract to your wallet."
          />
          <QA
            question="Can I send my wrapped NFT to a different wallet?"
            answer="Yes! During the wrapping process, you have the option to send your new Fame Lady Society NFT to a different address than the one holding your original. This is perfect for moving to a hardware wallet like Ledger—you save gas by combining the wrap and transfer into one transaction."
          />
          <QA
            question="How do I wrap my Fame Lady Squad NFT?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8}>
                  Visit our{" "}
                  <WrappedLink href="/wrap" sx={{ color: "primary.main" }}>
                    Wrap page
                  </WrappedLink>
                  , connect your wallet containing your Fame Lady Squad NFT, and
                  follow the guided process. You&apos;ll approve the contract to
                  access your NFT, then confirm the wrap transaction.
                </Typography>
              </>
            }
          />
        </Section>
      </Box>

      {/* $FAME Token */}
      <Box component="div" id="fame">
        <Section title="$FAME Token" icon="💎" delay={250}>
          <QA
            question="What is $FAME?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  $FAME is a revolutionary DN404 token launched on July 12,
                  2024—the 3rd anniversary of the original Fame Lady Squad
                  launch. It&apos;s deployed on Base (Ethereum L2) and bridges
                  the worlds of ERC20 tokens and NFTs.
                </Typography>
                <Typography color="text.secondary" lineHeight={1.8}>
                  888 unique Society NFTs are backed by 888 million $FAME
                  tokens. This creates true liquidity-backed art—you can trade
                  $FAME on decentralized exchanges, or accumulate enough to
                  automatically receive an NFT.
                </Typography>
              </>
            }
          />
          <QA
            question="How do I get a Society NFT through $FAME?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  When you collect <strong>1,000,000 $FAME tokens</strong>, a
                  Society Lady NFT automatically mints to your wallet. It&apos;s
                  that simple—no minting interface needed, no additional
                  transactions required.
                </Typography>
                <Typography color="text.secondary" lineHeight={1.8}>
                  If you sell or transfer enough $FAME to drop below 1 million,
                  the NFT will automatically burn. This creates a fascinating
                  dynamic where NFT ownership is directly tied to token
                  holdings.
                </Typography>
              </>
            }
          />
          <QA
            question="Where can I buy $FAME?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8}>
                  Visit our{" "}
                  <WrappedLink href="/fame" sx={{ color: "primary.main" }}>
                    $FAME page
                  </WrappedLink>{" "}
                  for direct links to purchase $FAME on various decentralized
                  exchanges on Base. You can also view the live price, check
                  claim eligibility for wrapped NFT holders, and explore the
                  token details.
                </Typography>
              </>
            }
          />
          <QA
            question="What is DN404?"
            answer="DN404 is an experimental token standard that combines ERC20 fungibility with ERC721 NFT mechanics. It allows tokens to automatically convert between fungible tokens and NFTs based on your balance. This gives $FAME the liquidity benefits of tokens while maintaining the collectible nature of NFTs."
          />
          <QA
            question="Can Fame Lady Society NFT holders claim $FAME?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8}>
                  Yes! Wrapped Fame Lady Society NFT holders are eligible for
                  $FAME token claims. Visit the{" "}
                  <WrappedLink href="/fame" sx={{ color: "primary.main" }}>
                    $FAME page
                  </WrappedLink>{" "}
                  and use the claim checker to see your eligibility and claim
                  your tokens.
                </Typography>
              </>
            }
          />
        </Section>
      </Box>

      {/* Governance */}
      <Box component="div" id="governance">
        <Section title="Governance & Community" icon="🏛️" delay={300}>
          <QA
            question="How is Fame Lady Society governed?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  Fame Lady Society is governed by its NFT holders through the{" "}
                  <strong>FAMEus DAO</strong>. Every Fame Lady Society NFT
                  holder has the power to vote on proposals concerning the
                  operational affairs of the community.
                </Typography>
                <Typography color="text.secondary" lineHeight={1.8}>
                  The Society is guided by an elected Community Council voted in
                  by verified holders. The Council is responsible for planning
                  the overall direction, vision, and long-term strategy of the
                  project.
                </Typography>
              </>
            }
          />
          <QA
            question="How can I participate in governance?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8}>
                  Hold a Fame Lady Society NFT (either wrapped or through
                  $FAME), then visit{" "}
                  <WrappedLink
                    href="https://www.tally.xyz/gov/fameus-dao"
                    target="_blank"
                    rel="noreferrer"
                    sx={{ color: "primary.main" }}
                  >
                    FAMEus DAO on Tally
                  </WrappedLink>{" "}
                  to view and vote on active proposals. You can also create
                  proposals if you meet the threshold requirements.
                </Typography>
              </>
            }
          />
          <QA
            question="Is there a paid team behind Fame Lady Society?"
            answer="No! Fame Lady Society is run entirely by volunteers. There are no paid team members, no VC funding, and no corporate backing. Every person contributing to the project does so because they believe in the mission of community ownership and women's empowerment in Web3."
          />
          <QA
            question="Where can I connect with the community?"
            answer={
              <>
                <Typography color="text.secondary" lineHeight={1.8} mb={2}>
                  Join us on multiple platforms:
                </Typography>
                <Box component="ul" sx={{ pl: 3, color: "text.secondary" }}>
                  <li>
                    <Typography lineHeight={1.8}>
                      <WrappedLink
                        href="https://discord.gg/jkAdAPXEpw"
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: "primary.main" }}
                      >
                        Discord
                      </WrappedLink>{" "}
                      — Our main community hub
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <WrappedLink
                        href="https://x.com/fameladysociety"
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: "primary.main" }}
                      >
                        Twitter/X
                      </WrappedLink>{" "}
                      — News and announcements
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <WrappedLink
                        href="https://t.me/famesocietybase"
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: "primary.main" }}
                      >
                        Telegram
                      </WrappedLink>{" "}
                      — Quick updates and chat
                    </Typography>
                  </li>
                  <li>
                    <Typography lineHeight={1.8}>
                      <WrappedLink
                        href="https://warpcast.com/fameladysociety"
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: "primary.main" }}
                      >
                        Farcaster
                      </WrappedLink>{" "}
                      — Web3-native social
                    </Typography>
                  </li>
                </Box>
              </>
            }
          />
          <QA
            question="How can I contribute to Fame Lady Society?"
            answer="We're always looking for passionate volunteers! Join our Discord and introduce yourself. Whether you're a developer, artist, marketer, or just enthusiastic about the mission—there's a place for you. Check our GitHub for open-source contributions, or reach out to community leaders about other ways to help."
          />
        </Section>
      </Box>

      {/* Still Have Questions */}
      <AnimatedFadeIn component="div" delay={350}>
        <Box
          component="div"
          sx={{
            mt: 8,
            p: { xs: 4, md: 6 },
            textAlign: "center",
            borderRadius: 3,
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Typography variant="h4" fontWeight={700} mb={2}>
            Still have questions?
          </Typography>
          <Typography color="text.secondary" mb={3} maxWidth={500} mx="auto">
            Our community is always happy to help. Drop by Discord and ask
            away—we&apos;re a friendly bunch!
          </Typography>
          <WrappedLink
            href="https://discord.gg/jkAdAPXEpw"
            target="_blank"
            rel="noreferrer"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 4,
              py: 1.5,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 20px rgba(88, 101, 242, 0.3)",
              },
            }}
          >
            Join Discord
          </WrappedLink>
        </Box>
      </AnimatedFadeIn>
    </Box>
  );
};

export default FAQ;

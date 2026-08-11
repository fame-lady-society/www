import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { WrappedLink } from "@/components/WrappedLink";
import { QA } from "@/features/presale/components/QA";

export const FameFAQ: FC = () => (
  <>
    <QA
      question="What are FAME and Society?"
      answer={
        <>
          <Typography component="p" mb={2}>
            FAME is an ERC-20 token linked to the Society ERC-721 collection
            through a divisible-NFT design. A complete FAME unit is 1,000,000
            FAME, and each complete unit corresponds to one Society NFT.
          </Typography>
          <Typography component="p">
            This link lets you use FAME as a fungible token while also holding
            and collecting the Society artwork associated with whole units.
          </Typography>
        </>
      }
    />
    <QA
      question="Why did a Society NFT appear or disappear?"
      answer={
        <>
          <Typography component="p" mb={2}>
            Your Society NFT count follows the number of complete 1,000,000 FAME
            units in your wallet. Crossing a whole-unit threshold can generate
            another Society NFT; moving or selling FAME below a threshold can
            burn one.
          </Typography>
          <Typography component="p">
            For example, a balance between 1,000,000 and 1,999,999.999999 FAME
            supports one Society NFT. A transfer that leaves less than 1,000,000
            FAME supports none.
          </Typography>
        </>
      }
    />
    <QA
      question="Why didn’t my Society NFT appear?"
      answer={
        <>
          <Typography component="p" mb={2}>
            Some smart accounts default to Society NFT generation being off.
            Connect the wallet and use the readiness check near the top of the
            FAME page to confirm that generation is enabled.
          </Typography>
          <Typography component="p">
            If generation is enabled, the wallet holds a complete FAME unit, and
            the readiness check detects an NFT deficit, it may offer a 1 wei
            self-transfer to trigger reconciliation. Only use that action when
            the readiness check offers it.
          </Typography>
        </>
      }
    />
    <QA
      question="How do I buy FAME or a Society NFT?"
      answer={
        <>
          <Typography component="p" mb={2}>
            Use the <WrappedLink href="/fame/swap">FAME Swap</WrappedLink> to
            trade into FAME. To choose the artwork first, open the{" "}
            <WrappedLink href="/fame/market">Society Marketplace</WrappedLink>.
          </Typography>
          <Typography component="p">
            Marketplace checkout supports FAME, ETH, or USDC. Keep a small
            amount of ETH for Base gas even when paying with FAME or USDC.
          </Typography>
        </>
      }
    />
    <QA
      question="Why do DeFi and marketplace prices differ?"
      answer={
        <>
          <Typography component="p" mb={2}>
            The DeFi quote shows the current route for buying or selling exactly
            1,000,000 FAME. It reflects the liquidity and price impact for that
            exact token amount.
          </Typography>
          <Typography component="p">
            The marketplace price starts with one FAME unit and adds the live
            marketplace premium for collecting a particular Society NFT. The two
            prices answer different questions, so they are not expected to
            match.
          </Typography>
        </>
      }
    />
    <QA
      question="Can I transfer or redeem a Society NFT?"
      answer={
        <>
          <Typography component="p" mb={2}>
            Yes. Transferring a Society NFT also transfers its paired 1,000,000
            FAME to the recipient.
          </Typography>
          <Typography component="p">
            Marketplace redemption burns each selected Society NFT irreversibly
            and routes the released FAME through your selected output. Review
            the quoted minimum output before approving and submitting the
            redemption.
          </Typography>
        </>
      }
    />
    <QA
      question="How does the Rotator work?"
      answer={
        <>
          <Typography component="p" mb={2}>
            The Rotator lets you offer one Society NFT for a specific target in
            the FIFO waiting pool. The site calculates the rotation bound from
            that target&apos;s current position.
          </Typography>
          <Typography component="p">
            Either you receive the selected target, or the transaction reverts
            and you keep your offered NFT. The paired FAME unit remains
            conserved through a successful rotation.
          </Typography>
        </>
      }
    />
    <QA
      question="How does marketplace liquidity work?"
      answer={
        <>
          <Typography component="p" mb={2}>
            Use the marketplace staking controls to deposit a whole Society NFT
            with its paired 1,000,000 FAME. Liquidity providers receive their
            current share of provider fees from marketplace sales.
          </Typography>
          <Typography component="p" mb={2}>
            Your original artwork is not reserved for you while it is staked. On
            withdrawal, the premium starts at the current marketplace amount and
            reaches zero over 24 hours.
          </Typography>
          <Typography component="p">
            Never transfer an NFT directly to the marketplace contract. Use the
            staking controls so the deposit is recorded correctly.
          </Typography>
        </>
      }
    />
    <QA
      question="What network and contracts should I use?"
      answer={
        <>
          <Typography component="p" mb={2}>
            FAME and Society are on Base chain 8453. Base uses ETH for gas.
            Verify that your wallet is on Base before signing a transaction.
          </Typography>
          <Typography component="p">
            Use the verified contract addresses above this FAQ when adding FAME
            or checking Society. Live prices, premiums, and availability can
            change between a quote and transaction submission.
          </Typography>
        </>
      }
    />
  </>
);

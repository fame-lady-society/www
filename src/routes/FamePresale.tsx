"use client";
import Container from "@mui/material/Container";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { Token } from "@/components/Token";
import { FC, PropsWithChildren, ReactNode, useEffect } from "react";
import { useFlsTokenAllocation } from "@/features/token/hooks/useFlsTokenAllocation";
import Grid2 from "@mui/material/Unstable_Grid2";
import { PresaleCard } from "@/features/fame/components/PresaleCard";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { base, sepolia } from "viem/chains";
import { PresaleGauge } from "@/features/fame/components/PresaleGauge";
import { PersonalGauge } from "@/features/fame/components/PersonalGauge";
import { AllowedCard } from "@/features/fame/components/AllowedCard";

const Content: FC<
  PropsWithChildren<{ network?: "base" | "sepolia"; wrongChain?: ReactNode }>
> = ({ children, network, wrongChain }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const correctChain =
    isConnected &&
    ((network === "base" && chainId === base.id) ||
      (network === "sepolia" && chainId === sepolia.id));
  useEffect(() => {
    if (isConnected && !correctChain) {
      switchChain({ chainId: network === "sepolia" ? sepolia.id : base.id });
    }
  }, [correctChain, isConnected, network, switchChain]);
  return correctChain ? children : wrongChain ?? null;
};

export const FamePresale: FC<{
  network: "base" | "sepolia";
}> = ({ network }) => {
  return (
    <DefaultProvider>
      <Main
        menu={
          <>
            <MenuList dense disablePadding>
              <LinksMenuItems />
              <SiteMenu />
            </MenuList>
          </>
        }
        title={
          <Typography variant="h5" component="h1" marginLeft={2}>
            $FAME
          </Typography>
        }
      >
        <Container maxWidth="xl" sx={{ py: 2, mt: 4 }}>
          <Grid2 container spacing={2}>
            <Content network={network}>
              <Grid2 xs={12}>
                <AllowedCard />
              </Grid2>
              <Grid2 xs={12} md={6}>
                <PresaleGauge />
              </Grid2>
              <Grid2 xs={12} md={6}>
                <PersonalGauge />
              </Grid2>
              <Grid2 xs={12}>
                <PresaleCard />
              </Grid2>
            </Content>
          </Grid2>
        </Container>
      </Main>
    </DefaultProvider>
  );
};

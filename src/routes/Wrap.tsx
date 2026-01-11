"use client";
import { FC } from "react";
import Head from "next/head";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { useReadContract } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { WrapPage } from "@/features/wrap/components/WrapPage";
import { useChainContracts } from "@/hooks/useChainContracts";
import { formatEther } from "viem";
import { useRouter } from "next/navigation";
import { UnsupportedNetwork } from "@/features/wrap/UnsupportedNetwork";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

export const Content: FC<{
  network: "mainnet" | "sepolia";
}> = ({ network }) => {
  const { replace } = useRouter();
  const { chain } = useAccount();
  const theme = useTheme();
  const isTinyScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { wrappedNftContractAbi, wrappedNftContractAddress } =
    useChainContracts();
  const { data: wrapCost } = useReadContract({
    abi: wrappedNftContractAbi,
    address: wrappedNftContractAddress,
    functionName: "wrapCost",
  });

  if (chain && ![1, 11155111].includes(chain?.id)) {
    return <UnsupportedNetwork />;
  }

  return (
    <Main
      menu={
        <MenuList dense disablePadding>
          <LinksMenuItems />
          <SiteMenu isWrap />
        </MenuList>
      }
      title={
        isTinyScreen ? null : (
          <Typography
            variant="h5"
            component="h1"
            marginLeft={2}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Wrap
            </Box>
          </Typography>
        )
      }
      right={
        wrapCost ? (
          <Chip
            label={`Fee: ${formatEther(wrapCost)} ETH`}
            size="small"
            sx={{
              background: "rgba(107, 91, 255, 0.15)",
              color: "#6b5bff",
              fontWeight: 600,
              fontSize: { xs: "0.7rem", sm: "0.8rem" },
            }}
          />
        ) : null
      }
    >
      <WrapPage network={network} />
    </Main>
  );
};

const Wrap: NextPage<{
  network: "mainnet" | "sepolia";
}> = ({ network }) => {
  return (
    <DefaultProvider mainnet>
      <Head>
        <title>Fame Lady Society Wrap</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Content network={network} />
    </DefaultProvider>
  );
};

export default Wrap;

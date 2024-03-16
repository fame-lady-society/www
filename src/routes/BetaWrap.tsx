import { FC } from "react";
import Head from "next/head";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import Box from "@mui/material/Box";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { useReadContract } from "wagmi";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { WrapPage } from "@/features/wrap/components/WrapPage";
import { useChainContracts } from "@/hooks/useChainContracts";
import { formatEther } from "viem";

const Content: FC<{
  hasMint?: boolean;
}> = ({ hasMint = true }) => {
  const { wrappedNftContractAbi, wrappedNftContractAddress } =
    useChainContracts();
  const { data: wrapCost } = useReadContract({
    abi: wrappedNftContractAbi,
    address: wrappedNftContractAddress,
    functionName: "wrapCost",
  });

  return (
    <Main
      menu={
        <>
          <MenuList dense disablePadding>
            <LinksMenuItems />
            <SiteMenu isWrap />
          </MenuList>
        </>
      }
      title={
        <Typography variant="h5" component="h1" marginLeft={2}>
          it&apos;s a wrap
        </Typography>
      }
      right={
        <Typography variant="h6" component="h1" marginLeft={2}>
          {wrapCost && `wrap fee: ${formatEther(wrapCost)} ETH`}
        </Typography>
      }
    >
      <WrapPage hasMint={hasMint} />
    </Main>
  );
};

const BetaWrap: NextPage<{
  hasMint?: boolean;
}> = ({ hasMint = true }) => {
  return (
    <DefaultProvider>
      <Head>
        <title>Fame Lady Society Wrap</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Content hasMint={hasMint} />
    </DefaultProvider>
  );
};
export default BetaWrap;

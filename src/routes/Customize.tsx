"use client";
import Container from "@mui/material/Container";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { SelectPage } from "@/features/customize/SelectPage";
import { FC, useMemo } from "react";
import { useAccount } from "@/hooks/useAccount";
import { UnsupportedNetwork } from "@/features/wrap/UnsupportedNetwork";
import { useRouter } from "next/navigation";
import { useLadies } from "@/features/customize/hooks/useLadies";
import {  mainnet, sepolia } from "viem/chains";

const Content: FC<{  network: "mainnet" | "sepolia", prefix?: string }> = ({
  prefix = "",
  network,
}) => {
  const { replace } = useRouter();
  const { chain } = useAccount();
  if (chain && chain?.name.toLowerCase() !== network) {
    const name = chain.id === 1 ? "mainnet" : chain.name.toLowerCase();
    replace(`/${name}/customize`);
  }

  const { isLoading, data } = useLadies({ chainId: (chain?.id ?? 1) as typeof mainnet.id | typeof sepolia.id  });
  const tokens = useMemo(() => data?.map((tokenId) => ({ tokenId, url: `${prefix}/${tokenId}` })) ?? [], [data, prefix]);

  if (chain && ![1, 11155111].includes(chain?.id)) {
    return <UnsupportedNetwork />;
  }
  return (
    <Container maxWidth="lg" sx={{ py: 2, mt: 8 }}>
      <SelectPage isLoading={isLoading} tokens={tokens ?? []} />
    </Container>
  );
};

const Customize: NextPage<{
  network: "mainnet" | "sepolia";
  prefix?: string;
}> = ({ network, prefix }) => {
  return (
    <DefaultProvider siwe>
      <Main
        menu={
          <>
            <MenuList dense disablePadding>
              <LinksMenuItems />
              <SiteMenu isCustomize />
            </MenuList>
          </>
        }
        title={
          <Typography variant="h5" component="h1" marginLeft={2}>
            customize
          </Typography>
        }
      >
        <Content prefix={prefix} network={network} />
      </Main>
    </DefaultProvider>
  );
};
export default Customize;

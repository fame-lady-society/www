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
import { useLadies } from "@/features/customize/hooks/useLadies";
import { SwitchToChainBanner } from "@/components/SwitchToChainBanner";
import {
  resolveCustomizeNetworkPolicy,
  type CustomizeNetwork,
} from "@/features/customize/networkPolicy";

export const CustomizeContent: FC<{
  network: CustomizeNetwork;
  prefix?: string;
}> = ({
  prefix = "",
  network,
}) => {
  const { chainId: connectedChainId } = useAccount();
  const { targetChainId, shouldOfferSwitch } = resolveCustomizeNetworkPolicy(
    network,
    connectedChainId,
  );

  const { isLoading, data } = useLadies({
    chainId: targetChainId,
  });
  const tokens = useMemo(
    () =>
      data?.map((tokenId) => ({ tokenId, url: `${prefix}/${tokenId}` })) ?? [],
    [data, prefix],
  );

  return (
    <Container maxWidth="lg" sx={{ py: 2, mt: 8 }}>
      {shouldOfferSwitch ? (
        <SwitchToChainBanner chainId={targetChainId} />
      ) : (
        <SelectPage isLoading={isLoading} tokens={tokens} />
      )}
    </Container>
  );
};

const Customize: NextPage<{
  network: CustomizeNetwork;
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
        <CustomizeContent prefix={prefix} network={network} />
      </Main>
    </DefaultProvider>
  );
};
export default Customize;

import Head from "next/head";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { FC, useEffect, useState } from "react";
import { Success } from "../features/wrap/components/Success";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";

const TestSuccessPage: NextPage<{}> = () => {
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [txHash, setTxHash] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenIds = urlParams.get("tokenIds")?.split(",") || [];
    const txHash = urlParams.get("txHash") || "";
    setTokenIds(tokenIds);
    setTxHash(txHash);
  }, []);
  return (
    <DefaultProvider>
      <Head>
        <title>Fame Lady Society Wrap</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
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
      >
        <Success txHash={txHash} tokenIds={tokenIds} />
      </Main>
    </DefaultProvider>
  );
};
export default TestSuccessPage;

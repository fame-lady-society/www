import Head from "next/head";
import Container from "@mui/material/Container";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import { SelectPage } from "@/features/customize/SelectPage";

const Customize: NextPage<{
  prefix?: string;
}> = ({ prefix = "" }) => {
  return (
    <DefaultProvider>
      <Head>
        <title>Fame Lady Society Customize</title>
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
            customize
          </Typography>
        }
      >
        <Container maxWidth="lg" sx={{ py: 2, mt: 4 }}>
          <SelectPage prefix={prefix} />
        </Container>
      </Main>
    </DefaultProvider>
  );
};
export default Customize;

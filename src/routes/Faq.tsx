"use client";
import { FC } from "react";
import { DefaultProvider } from "@/context/default";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { Main } from "@/layouts/Main";
import { SiteMenu } from "@/features/appbar/components/SiteMenu";
import { LinksMenuItems } from "@/features/appbar/components/LinksMenuItems";
import useMediaQuery from "@mui/material/useMediaQuery";
import theme from "@/theme";
import FAQ from "@/features/faq";

const Content: FC = () => {
  const roomForTitle = useMediaQuery(theme.breakpoints.up("sm"));

  return (
    <Main
      menu={
        <MenuList dense disablePadding>
          <LinksMenuItems />
          <SiteMenu isFaq />
        </MenuList>
      }
      title={
        <Typography variant="h5" component="h1" marginLeft={2}>
          {roomForTitle ? "Frequently Asked Questions" : "FAQ"}
        </Typography>
      }
    >
      <Box
        component="div"
        sx={{
          minHeight: "100vh",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(196, 77, 255, 0.06) 0%, transparent 50%)",
        }}
      >
        <Container maxWidth="md" sx={{ pt: { xs: 10, md: 14 }, pb: 8 }}>
          <FAQ />
        </Container>
      </Box>
    </Main>
  );
};

export const FaqPage: FC = () => {
  return (
    <DefaultProvider>
      <Content />
    </DefaultProvider>
  );
};

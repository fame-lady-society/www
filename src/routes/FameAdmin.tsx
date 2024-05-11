"use client";
import Head from "next/head";
import { DefaultProvider } from "@/context/default";
import { NextPage } from "next";
import Container from "@mui/material/Container";
import Grid2 from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import { Main } from "@/layouts/Main";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardActionArea from "@mui/material/CardActionArea";
import Button from "@mui/material/Button";
import DownloadIcon from "@mui/icons-material/Download";

const NextPage: NextPage<{}> = () => {
  return (
    <DefaultProvider>
      <Head>
        <title>Fame Society Admin</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Main
        title={
          <Typography variant="h5" component="h1" marginLeft={2}>
            admin
          </Typography>
        }
      >
        <Container sx={{ mt: 8 }}>
          <Grid2 container spacing={2}>
            <Grid2 xs={12}>
              <Card>
                <CardHeader title="download claim csv" />
                <CardContent>
                  <Typography variant="body1">
                    Download the latest FLS claim csv
                  </Typography>
                </CardContent>
                <CardActionArea>
                  <Button
                    startIcon={<DownloadIcon />}
                    href="/fame-fls-snapshot.csv"
                    download
                  >
                    download
                  </Button>
                </CardActionArea>
              </Card>
            </Grid2>
          </Grid2>
        </Container>
      </Main>
    </DefaultProvider>
  );
};
export default NextPage;

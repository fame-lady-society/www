import type { ReactNode } from "react";
import { RedirectType, redirect } from "next/navigation";
import { AppMain } from "@/layouts/AppMain";
import Container from "@mui/material/Container";
import Link from "next/link";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  resolveNetwork,
  parseIdentifier,
  encodeIdentifier,
} from "@/features/naming/utils/networkUtils";
import { normalize } from "viem/ens";

export default function EditProfileLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { network: string; identifier: string };
}) {
  const { network, identifier } = params;
  const resolvedNetwork = resolveNetwork(network);
  const name = parseIdentifier(identifier);
  if (!resolvedNetwork) {
    redirect(`/mainnet/profile/edit/${encodeIdentifier(name)}`, RedirectType.replace);
  }


  return (
    <AppMain
      title="Edit Profile"
      mobileTitle="Edit Profile"
      headerLeft={
        <Button
          component={Link}
          href={`/${network}/~/${encodeIdentifier(normalize(name))}`}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ ml: 2 }}
        >
          Back to Profile
        </Button>
      }
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        {children}
      </Container>
    </AppMain>
  );
}

import type { ReactNode } from "react";
import { RedirectType, redirect } from "next/navigation";
import { AppMain } from "@/layouts/AppMain";
import { LinkButton } from "@/components/LinkButton";
import Container from "@mui/material/Container";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  resolveNetwork,
  parseIdentifier,
  encodeIdentifier,
} from "@/features/naming/utils/networkUtils";
import { normalize } from "viem/ens";

export default async function EditProfileLayout(
  props: {
    children: ReactNode;
    params: Promise<{ network: string; identifier: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

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
        <LinkButton
          href={`/${network}/~/${encodeIdentifier(normalize(name))}`}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ ml: 2 }}
        >
          Back to Profile
        </LinkButton>
      }
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        {children}
      </Container>
    </AppMain>
  );
}

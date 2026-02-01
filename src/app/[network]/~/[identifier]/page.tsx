import { RedirectType, redirect } from "next/navigation";
import { AppMain } from "@/layouts/AppMain";
import { PublicProfileView } from "@/features/naming/components/PublicProfileView";
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

export default function PublicProfilePage({
  params,
}: {
  params: { network: string; identifier: string };
}) {
  const { network, identifier } = params;
  const resolvedNetwork = resolveNetwork(network);
  const name = parseIdentifier(identifier);
  
  if (!resolvedNetwork) {
    redirect(`/mainnet/~/${encodeIdentifier(normalize(name))}`, RedirectType.replace);
  }


  return (
    <AppMain
      title="Profile"
      mobileTitle="Profile"
      headerLeft={
        <Button
          component={Link}
          href={`/${network}/~/`}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ ml: 2 }}
        >
          All Names
        </Button>
      }
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        <PublicProfileView network={resolvedNetwork} identifier={name} />
      </Container>
    </AppMain>
  );
}

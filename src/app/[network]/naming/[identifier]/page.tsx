import { RedirectType, redirect } from "next/navigation";
import { AppMain } from "@/layouts/AppMain";
import { ProfilePage } from "@/features/naming/components/ProfilePage";
import Container from "@mui/material/Container";
import Link from "next/link";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function ProfileDetailPage({
  params,
}: {
  params: { network: string; identifier: string };
}) {
  const { network, identifier } = params;
  let resolvedNetwork: "sepolia" | "mainnet" | "base-sepolia";

  switch (network) {
    case "sepolia": {
      resolvedNetwork = "sepolia";
      break;
    }
    case "mainnet": {
      resolvedNetwork = "mainnet";
      break;
    }
    case "base-sepolia": {
      resolvedNetwork = "base-sepolia";
      break;
    }
    default: {
      redirect(`/base-sepolia/naming`, RedirectType.replace);
    }
  }

  const decodedIdentifier = decodeURIComponent(identifier);

  return (
    <AppMain
      title="Profile"
      mobileTitle="Profile"
      headerLeft={
        <Button
          component={Link}
          href={`/${network}/naming`}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ ml: 2 }}
        >
          All Names
        </Button>
      }
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ProfilePage network={resolvedNetwork} identifier={decodedIdentifier} />
      </Container>
    </AppMain>
  );
}

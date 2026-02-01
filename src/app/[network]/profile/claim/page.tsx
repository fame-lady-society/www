import { RedirectType, redirect } from "next/navigation";
import { AppMain } from "@/layouts/AppMain";
import { ClaimNameForm } from "@/features/naming/components/ClaimNameForm";
import Container from "@mui/material/Container";
import Link from "next/link";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function ClaimNamePage({
  params,
}: {
  params: { network: string };
}) {
  const { network } = params;
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
      redirect(`/mainnet/profile/claim`, RedirectType.replace);
    }
  }

  return (
    <AppMain
      title="Claim Your Name"
      mobileTitle="Claim"
      headerLeft={
        <Button
          component={Link}
          href={`/${network}/~`}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ ml: 2 }}
        >
          All Names
        </Button>
      }
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <ClaimNameForm network={resolvedNetwork} />
      </Container>
    </AppMain>
  );
}

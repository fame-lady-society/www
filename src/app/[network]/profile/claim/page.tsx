import { RedirectType, redirect } from "next/navigation";
import { AppMain } from "@/layouts/AppMain";
import { ClaimNameForm } from "@/features/naming/components/ClaimNameForm";
import { LinkButton } from "@/components/LinkButton";
import Container from "@mui/material/Container";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default async function ClaimNamePage(
  props: {
    params: Promise<{ network: string }>;
  }
) {
  const params = await props.params;
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
        <LinkButton
          href={`/${network}/~`}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ ml: 2 }}
        >
          All Names
        </LinkButton>
      }
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <ClaimNameForm network={resolvedNetwork} />
      </Container>
    </AppMain>
  );
}

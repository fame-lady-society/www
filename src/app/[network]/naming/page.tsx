import { RedirectType, redirect } from "next/navigation";
import { AppMain } from "@/layouts/AppMain";
import { ProfileList } from "@/features/naming/components/ProfileList";
import Container from "@mui/material/Container";

export default function NamingPage({ params }: { params: { network: string } }) {
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
      redirect(`/base-sepolia/naming`, RedirectType.replace);
    }
  }

  return (
    <AppMain title="Fame Lady Names" mobileTitle="Names">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ProfileList network={resolvedNetwork} />
      </Container>
    </AppMain>
  );
}

import { RedirectType, redirect } from "next/navigation";
import {
  parseIdentifier,
  encodeIdentifier,
} from "@/features/naming/utils/networkUtils";
import { normalize } from "viem/ens";

export default async function PublicProfilePage(
  props: {
    params: Promise<{ identifier: string }>;
  }
) {
  const params = await props.params;
  const { identifier } = params;
  const name = parseIdentifier(identifier);

  redirect(`/~/${encodeIdentifier(normalize(name))}`, RedirectType.replace);
}

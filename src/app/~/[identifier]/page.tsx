import { RedirectType, redirect } from "next/navigation";
import {
  parseIdentifier,
  encodeIdentifier,
} from "@/features/naming/utils/networkUtils";
import { normalize } from "viem/ens";

export default function PublicProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  const { identifier } = params;
  const name = parseIdentifier(identifier);
  
  redirect(`/~/${encodeIdentifier(normalize(name))}`, RedirectType.replace);
}

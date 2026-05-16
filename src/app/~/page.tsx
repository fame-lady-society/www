import { RedirectType, redirect } from "next/navigation";

export default function NamingPage() {
  redirect(`/mainnet/~`, RedirectType.replace);
}

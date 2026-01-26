import type { NetworkType } from "../../hooks/useOwnedGateNftTokens";
import type { FullIdentity } from "../../hooks/useIdentity";

export interface WizardStepProps {
  network: NetworkType;
  identity: FullIdentity;
  editUrl: string;
  wizardBaseUrl: string;
}

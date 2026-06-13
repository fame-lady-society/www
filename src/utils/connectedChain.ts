export type ConnectedChainSwitchInput = {
  isConnected: boolean;
  connectedChainId?: number;
  targetChainId: number;
};

export function needsConnectedChainSwitch({
  isConnected,
  connectedChainId,
  targetChainId,
}: ConnectedChainSwitchInput) {
  return isConnected && connectedChainId !== targetChainId;
}

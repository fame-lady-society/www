export function prospectiveProviderPerSaleShare(
  providerFee: bigint,
  totalProviderUnits: bigint,
) {
  return providerFee / (totalProviderUnits + 1n);
}

export function existingProviderPerSaleShare(
  providerFee: bigint,
  providerUnitCount: bigint,
  totalProviderUnits: bigint,
) {
  if (providerUnitCount === 0n || totalProviderUnits === 0n) return 0n;
  return (providerFee * providerUnitCount) / totalProviderUnits;
}

export function providerPerSaleShareAfterDeposit(
  providerFee: bigint,
  currentProviderUnits: bigint,
  totalProviderUnits: bigint,
  depositCount: number,
) {
  if (!Number.isSafeInteger(depositCount) || depositCount <= 0) return 0n;
  const addedUnits = BigInt(depositCount);
  return (
    (providerFee * (currentProviderUnits + addedUnits)) /
    (totalProviderUnits + addedUnits)
  );
}

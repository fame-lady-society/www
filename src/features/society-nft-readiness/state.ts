import { isAddressEqual, type Address, type Hex } from "viem";

export type ReadState<T> =
  | { status: "disconnected" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: T };

export interface QueryReadSnapshot<T> {
  data: T | undefined;
  isError: boolean;
  isSuccess: boolean;
}

export function contractQueryReadState<T>(
  connected: boolean,
  query: QueryReadSnapshot<T>,
): ReadState<T> {
  if (!connected) return { status: "disconnected" };
  if (query.isError) return { status: "error" };
  if (query.isSuccess && query.data !== undefined) {
    return { status: "success", data: query.data };
  }
  return { status: "loading" };
}

export function bytecodeQueryReadState(
  connected: boolean,
  query: QueryReadSnapshot<Hex>,
): ReadState<Hex> {
  if (!connected) return { status: "disconnected" };
  if (query.isError) return { status: "error" };
  if (query.isSuccess) {
    // getBytecode returns undefined for an authoritative empty-code result.
    return { status: "success", data: query.data ?? "0x" };
  }
  return { status: "loading" };
}

export type SocietyNftReadinessProjection =
  | { status: "disconnected" }
  | { status: "checking" }
  | { status: "error" }
  | { status: "unaffected" }
  | { status: "affected" };

export interface SocietyNftReadinessInput {
  code: ReadState<Hex>;
  skipNft: ReadState<boolean>;
}

/**
 * Treat only valid, non-zero bytecode as code-bearing. EIP-7702 delegation
 * designators are ordinary non-zero bytecode for this purpose.
 */
export function hasNonEmptyRuntimeCode(code: Hex): boolean {
  return /^0x(?:[0-9a-f]{2})*$/i.test(code) && /[1-9a-f]/i.test(code.slice(2));
}

export function projectSocietyNftReadiness({
  code,
  skipNft,
}: SocietyNftReadinessInput): SocietyNftReadinessProjection {
  if (code.status === "disconnected") {
    return { status: "disconnected" };
  }

  if (code.status === "error") {
    return { status: "error" };
  }

  if (code.status !== "success") {
    return { status: "checking" };
  }

  if (!hasNonEmptyRuntimeCode(code.data)) {
    return { status: "unaffected" };
  }

  if (skipNft.status === "disconnected") {
    return { status: "disconnected" };
  }

  if (skipNft.status === "error") {
    return { status: "error" };
  }

  if (skipNft.status !== "success") {
    return { status: "checking" };
  }

  return skipNft.data ? { status: "affected" } : { status: "unaffected" };
}

export type RepairReceiptStatus =
  | "idle"
  | "pending"
  | "success"
  | "reverted"
  | "error";

export type PostFixBranch = "future" | "catch_up";

export interface VerifiedRepairInput {
  receiptStatus: RepairReceiptStatus;
  initiatingAccount: Address | null;
  connectedAccount: Address | null;
  skipNft: ReadState<boolean>;
  balance: ReadState<bigint>;
  unit: ReadState<bigint>;
}

export type VerifiedRepairProjection =
  | {
      status: "unresolved";
      reason: "account_changed" | "receipt" | "readback" | "skip_enabled";
    }
  | {
      status: "error";
      reason: "receipt" | "receipt_reverted" | "readback";
    }
  | {
      status: "verified";
      branch: PostFixBranch;
      balance: bigint;
      unit: bigint;
    };

export function postFixBranchForBalance(
  balance: bigint,
  unit: bigint,
): PostFixBranch {
  return balance >= unit ? "catch_up" : "future";
}

export function projectVerifiedRepair({
  receiptStatus,
  initiatingAccount,
  connectedAccount,
  skipNft,
  balance,
  unit,
}: VerifiedRepairInput): VerifiedRepairProjection {
  if (
    initiatingAccount === null ||
    connectedAccount === null ||
    !isAddressEqual(initiatingAccount, connectedAccount)
  ) {
    return { status: "unresolved", reason: "account_changed" };
  }

  if (receiptStatus === "reverted") {
    return { status: "error", reason: "receipt_reverted" };
  }

  if (receiptStatus === "error") {
    return { status: "error", reason: "receipt" };
  }

  if (receiptStatus !== "success") {
    return { status: "unresolved", reason: "receipt" };
  }

  if (skipNft.status === "error") {
    return { status: "error", reason: "readback" };
  }

  if (skipNft.status !== "success") {
    return { status: "unresolved", reason: "readback" };
  }

  if (skipNft.data) {
    return { status: "unresolved", reason: "skip_enabled" };
  }

  if (balance.status === "error" || unit.status === "error") {
    return { status: "error", reason: "readback" };
  }

  if (balance.status !== "success" || unit.status !== "success") {
    return { status: "unresolved", reason: "readback" };
  }

  return {
    status: "verified",
    branch: postFixBranchForBalance(balance.data, unit.data),
    balance: balance.data,
    unit: unit.data,
  };
}

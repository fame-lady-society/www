import {
  fameBurnPoolRotatorAbi,
  fameBurnPoolRotatorAddress,
} from "@/wagmi";
import { fameFromNetwork, societyFromNetwork } from "@/features/fame/contract";
import {
  isAddress,
  isAddressEqual,
  keccak256,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";
import { base } from "viem/chains";

/** Base mainnet FameBurnPoolRotator deployment (generated wagmi address). */
export const FAME_BURN_POOL_ROTATOR_BASE_ADDRESS =
  fameBurnPoolRotatorAddress[base.id];

/**
 * Pinned runtime bytecode for the verified Base deployment at
 * ${FAME_BURN_POOL_ROTATOR_BASE_ADDRESS}. Captured from the live chain and
 * required before any approval or rotation write (KTD15 / R25).
 */
export const FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE =
  "0x608060405234801561000f575f5ffd5b506004361061003f575f3560e01c8063444d9172146100435780638cfddead14610086578063b6d00c401461009b575b5f5ffd5b61006a7f000000000000000000000000bb5ed04dd7b207592429eb8d599d103ccad646c481565b6040516001600160a01b03909116815260200160405180910390f35b6100996100943660046104db565b6100c2565b005b61006a7f000000000000000000000000f307e242bfe1ec1ff01a4cef2fdaa81b10a5241881565b6040516323b872dd60e01b8152336004820152306024820152604481018590527f000000000000000000000000bb5ed04dd7b207592429eb8d599d103ccad646c46001600160a01b0316906323b872dd906064015f604051808303815f87803b15801561012d575f5ffd5b505af115801561013f573d5f5f3e3d5ffd5b505050505f5b828110156104a457604051632a6a935d60e01b8152600160048201527f000000000000000000000000f307e242bfe1ec1ff01a4cef2fdaa81b10a524186001600160a01b031690632a6a935d906024016020604051808303815f875af11580156101b1573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906101d59190610519565b5060405163a9059cbb60e01b8152306004820152600160248201527f000000000000000000000000f307e242bfe1ec1ff01a4cef2fdaa81b10a524186001600160a01b03169063a9059cbb906044016020604051808303815f875af1158015610240573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906102649190610519565b50604051632a6a935d60e01b81525f60048201527f000000000000000000000000f307e242bfe1ec1ff01a4cef2fdaa81b10a524186001600160a01b031690632a6a935d906024016020604051808303815f875af11580156102c8573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906102ec9190610519565b5060405163a9059cbb60e01b8152306004820152600160248201527f000000000000000000000000f307e242bfe1ec1ff01a4cef2fdaa81b10a524186001600160a01b03169063a9059cbb906044016020604051808303815f875af1158015610357573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061037b9190610519565b50604051632435987960e01b81526004810185905230906001600160a01b037f000000000000000000000000bb5ed04dd7b207592429eb8d599d103ccad646c41690632435987990602401602060405180830381865afa1580156103e1573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610405919061053f565b6001600160a01b03160361049c57604051632142170760e11b81523060048201526001600160a01b038381166024830152604482018690527f000000000000000000000000bb5ed04dd7b207592429eb8d599d103ccad646c416906342842e0e906064015f604051808303815f87803b158015610480575f5ffd5b505af1158015610492573d5f5f3e3d5ffd5b50505050506104be565b600101610145565b506040516365be670760e11b815260040160405180910390fd5b50505050565b6001600160a01b03811681146104d8575f5ffd5b50565b5f5f5f5f608085870312156104ee575f5ffd5b843593506020850135925060408501359150606085013561050e816104c4565b939692955090935050565b5f60208284031215610529575f5ffd5b81518015158114610538575f5ffd5b9392505050565b5f6020828403121561054f575f5ffd5b8151610538816104c456fea2646970667358221220ab39ffccedade221848553358f0dcc1a72865caa2cdd6ad12cd507898e30cc0264736f6c634300081c0033" as const satisfies Hex;

/** keccak256 of the pinned runtime bytecode (independent fingerprint check). */
export const FAME_BURN_POOL_ROTATOR_RUNTIME_FINGERPRINT = keccak256(
  FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
);

export const FAME_BURN_POOL_ROTATOR_EXPECTED_FAME = fameFromNetwork(base.id);
export const FAME_BURN_POOL_ROTATOR_EXPECTED_MIRROR =
  societyFromNetwork(base.id);

export type FameRotatorConfig =
  | {
      status: "configured";
      chainId: typeof base.id;
      address: Address;
      expectedFame: Address;
      expectedMirror: Address;
      expectedRuntimeBytecode: Hex;
      expectedRuntimeFingerprint: Hex;
      abi: typeof fameBurnPoolRotatorAbi;
    }
  | {
      status: "not_configured";
      chainId: number | undefined;
      address: null;
      expectedFame: null;
      expectedMirror: null;
      expectedRuntimeBytecode: null;
      expectedRuntimeFingerprint: null;
      abi: null;
    };

/**
 * Returns the Base-only rotator config when the chain and generated deployment
 * mapping are valid. Unsupported chains and malformed addresses fail closed.
 */
export function getFameRotatorConfig(
  chainId: number | undefined = base.id,
  rawAddress: string | undefined = chainId === base.id
    ? fameBurnPoolRotatorAddress[base.id]
    : undefined,
): FameRotatorConfig {
  if (chainId !== base.id) {
    return {
      status: "not_configured",
      chainId,
      address: null,
      expectedFame: null,
      expectedMirror: null,
      expectedRuntimeBytecode: null,
      expectedRuntimeFingerprint: null,
      abi: null,
    };
  }

  const address = rawAddress?.trim();
  if (!address || !isAddress(address) || address === zeroAddress) {
    return {
      status: "not_configured",
      chainId,
      address: null,
      expectedFame: null,
      expectedMirror: null,
      expectedRuntimeBytecode: null,
      expectedRuntimeFingerprint: null,
      abi: null,
    };
  }

  return {
    status: "configured",
    chainId: base.id,
    address,
    expectedFame: FAME_BURN_POOL_ROTATOR_EXPECTED_FAME,
    expectedMirror: FAME_BURN_POOL_ROTATOR_EXPECTED_MIRROR,
    expectedRuntimeBytecode: FAME_BURN_POOL_ROTATOR_RUNTIME_BYTECODE,
    expectedRuntimeFingerprint: FAME_BURN_POOL_ROTATOR_RUNTIME_FINGERPRINT,
    abi: fameBurnPoolRotatorAbi,
  };
}

export type RotatorIdentityEvaluation =
  | { compatible: true }
  | {
      compatible: false;
      reason:
        | "missing_code"
        | "runtime_mismatch"
        | "invalid_fame"
        | "fame_mismatch"
        | "invalid_mirror"
        | "mirror_mismatch";
      message: string;
    };

export interface WalletRotatorIdentity {
  code: Hex;
  fame: Address | null;
  mirror: Address | null;
}

/**
 * Projects wallet-provider runtime code and immutable getters against the
 * pinned Base deployment fingerprint and expected FAME/mirror identities.
 * Matching getters without the runtime fingerprint is insufficient.
 */
export function evaluateRotatorExecutionIdentity({
  code,
  fame,
  mirror,
  expectedRuntimeBytecode,
  expectedFame,
  expectedMirror,
}: WalletRotatorIdentity & {
  expectedRuntimeBytecode: Hex;
  expectedFame: string;
  expectedMirror: string;
}): RotatorIdentityEvaluation {
  if (!/^0x0*[1-9a-f]/i.test(code)) {
    return {
      compatible: false,
      reason: "missing_code",
      message: "Your wallet provider cannot find this rotator contract.",
    };
  }

  if (code.toLowerCase() !== expectedRuntimeBytecode.toLowerCase()) {
    return {
      compatible: false,
      reason: "runtime_mismatch",
      message:
        "Your wallet provider is connected to a different rotator environment.",
    };
  }

  if (typeof fame !== "string" || !isAddress(fame) || !isAddress(expectedFame)) {
    return {
      compatible: false,
      reason: "invalid_fame",
      message: "Your wallet provider returned an invalid FAME identity.",
    };
  }

  if (!isAddressEqual(fame, expectedFame)) {
    return {
      compatible: false,
      reason: "fame_mismatch",
      message:
        "Your wallet provider is connected to a different rotator environment.",
    };
  }

  if (
    typeof mirror !== "string" ||
    !isAddress(mirror) ||
    !isAddress(expectedMirror)
  ) {
    return {
      compatible: false,
      reason: "invalid_mirror",
      message: "Your wallet provider returned an invalid Society identity.",
    };
  }

  if (!isAddressEqual(mirror, expectedMirror)) {
    return {
      compatible: false,
      reason: "mirror_mismatch",
      message:
        "Your wallet provider is connected to a different rotator environment.",
    };
  }

  return { compatible: true };
}

/** True when the generated ABI exposes the write surface this feature needs. */
export function hasRequiredRotatorAbiSurface(
  abi: typeof fameBurnPoolRotatorAbi = fameBurnPoolRotatorAbi,
): boolean {
  const names = new Set(
    abi.map((entry) => ("name" in entry ? entry.name : undefined)),
  );
  return (
    names.has("rotateTo") &&
    names.has("TargetNotReached") &&
    names.has("fame") &&
    names.has("mirror")
  );
}

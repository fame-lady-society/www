import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BulkMinter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const bulkMinterAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'uri', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'ApprovalCallerNotOwnerNorApproved' },
  { type: 'error', inputs: [], name: 'ApprovalQueryForNonexistentToken' },
  { type: 'error', inputs: [], name: 'BalanceQueryForZeroAddress' },
  { type: 'error', inputs: [], name: 'InvalidQueryRange' },
  { type: 'error', inputs: [], name: 'MintERC2309QuantityExceedsLimit' },
  { type: 'error', inputs: [], name: 'MintToZeroAddress' },
  { type: 'error', inputs: [], name: 'MintZeroQuantity' },
  { type: 'error', inputs: [], name: 'NotCompatibleWithSpotMints' },
  { type: 'error', inputs: [], name: 'OwnerQueryForNonexistentToken' },
  { type: 'error', inputs: [], name: 'OwnershipNotInitializedForExtraData' },
  { type: 'error', inputs: [], name: 'SequentialMintExceedsLimit' },
  { type: 'error', inputs: [], name: 'SequentialUpToTooSmall' },
  { type: 'error', inputs: [], name: 'SpotMintTokenIdTooSmall' },
  { type: 'error', inputs: [], name: 'TokenAlreadyExists' },
  { type: 'error', inputs: [], name: 'TransferCallerNotOwnerNorApproved' },
  { type: 'error', inputs: [], name: 'TransferFromIncorrectOwner' },
  { type: 'error', inputs: [], name: 'TransferToNonERC721ReceiverImplementer' },
  { type: 'error', inputs: [], name: 'TransferToZeroAddress' },
  { type: 'error', inputs: [], name: 'URIQueryForNonexistentToken' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'approved',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'fromTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'toTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'ConsecutiveTransfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_SUPPLY',
    outputs: [{ name: '', internalType: 'uint128', type: 'uint128' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'explicitOwnershipOf',
    outputs: [
      {
        name: 'ownership',
        internalType: 'struct IERC721A.TokenOwnership',
        type: 'tuple',
        components: [
          { name: 'addr', internalType: 'address', type: 'address' },
          { name: 'startTimestamp', internalType: 'uint64', type: 'uint64' },
          { name: 'burned', internalType: 'bool', type: 'bool' },
          { name: 'extraData', internalType: 'uint24', type: 'uint24' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'explicitOwnershipsOf',
    outputs: [
      {
        name: '',
        internalType: 'struct IERC721A.TokenOwnership[]',
        type: 'tuple[]',
        components: [
          { name: 'addr', internalType: 'address', type: 'address' },
          { name: 'startTimestamp', internalType: 'uint64', type: 'uint64' },
          { name: 'burned', internalType: 'bool', type: 'bool' },
          { name: 'extraData', internalType: 'uint24', type: 'uint24' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'lastMintedTokenId',
    outputs: [{ name: '', internalType: 'uint128', type: 'uint128' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'count', internalType: 'uint128', type: 'uint128' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'tokensOfOwner',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'stop', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'tokensOfOwnerIn',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'payable',
  },
] as const

/**
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const bulkMinterAddress = {
  84532: '0x4E6bB6d251db23dc0855D53B09da0d4E7049B354',
  11155111: '0x71E57b37b4BeA589673D0aFE1992A6457ca754b3',
} as const

/**
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const bulkMinterConfig = {
  address: bulkMinterAddress,
  abi: bulkMinterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ClaimToFame
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const claimToFameAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_fameToken', internalType: 'address', type: 'address' },
      { name: '_signer', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'packedTokenIds', internalType: 'bytes', type: 'bytes' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'claimWithData',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenIds', internalType: 'uint16[]', type: 'uint16[]' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'claimWithTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'fameToken',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'generatePackedData',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'packedData', internalType: 'bytes', type: 'bytes' }],
    name: 'generateTokenIds',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'grantRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAllRoles',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAnyRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'packedTokenIds', internalType: 'bytes', type: 'bytes' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hashClaimDataRequest',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenIds', internalType: 'uint16[]', type: 'uint16[]' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hashClaimTokensRequest',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'isClaimed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'isClaimedBatch',
    outputs: [{ name: '', internalType: 'bool[]', type: 'bool[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'tokenIds', internalType: 'uint16[]', type: 'uint16[]' },
    ],
    name: 'primeClaim',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'packedTokenIds', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'primeClaimWithData',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    name: 'renounceRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'revokeRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleClaimPrimer',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleSigner',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleTreasurer',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_signer', internalType: 'address', type: 'address' }],
    name: 'setSigner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'signatureNonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'packedTokenIds', internalType: 'bytes', type: 'bytes' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'verifyClaimDataRequest',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'contractAddress', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenIds', internalType: 'uint16[]', type: 'uint16[]' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'verifyClaimTokensRequest',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawErc20',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'withdrawEth',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'roles',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RolesUpdated',
  },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'AlreadyCalimed',
  },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'InvalidSignature' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'PastDeadline' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CreatorArtistMagic
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const creatorArtistMagicAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_childRenderer', internalType: 'address', type: 'address' },
      { name: '_fame', internalType: 'address payable', type: 'address' },
      { name: '_nextTokenId', internalType: 'uint16', type: 'uint16' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'artPoolEndIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'artPoolNext',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'artPoolStartIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIdToUpdate', internalType: 'uint256', type: 'uint256' },
      { name: 'newMetadataUrl', internalType: 'string', type: 'string' },
    ],
    name: 'banishToArtPool',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIdToUpdate', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenIdFromBurnPool', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'banishToBurnPool',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIdToUpdate', internalType: 'uint256', type: 'uint256' },
      { name: 'newMetadataUrl', internalType: 'string', type: 'string' },
    ],
    name: 'banishToEndOfMintPool',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIdToUpdate', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenIdFromMintPool', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'banishToMintPool',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'childRenderer',
    outputs: [
      {
        name: '',
        internalType: 'contract ITokenURIGenerator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'end', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'emitBatchMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'emitMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'fame',
    outputs: [{ name: '', internalType: 'contract Fame', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMaxNFTSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'metadataId', internalType: 'uint256', type: 'uint256' }],
    name: 'getMetadataById',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMintPoolEnd',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMintPoolStart',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getNextMetadataId',
    outputs: [{ name: '', internalType: 'uint16', type: 'uint16' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getTokenMetadataId',
    outputs: [{ name: '', internalType: 'uint16', type: 'uint16' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getTotalNFTSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'grantRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAllRoles',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAnyRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'isTokenInBurnedPool',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'isTokenInEndOfMintPool',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'isTokenInMintPool',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'metadataRegistry',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextTokenId',
    outputs: [{ name: '', internalType: 'uint16', type: 'uint16' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    name: 'renounceRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'revokeRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_childRenderer', internalType: 'address', type: 'address' },
    ],
    name: 'updateChildRenderer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'newMetadataUrl', internalType: 'string', type: 'string' },
    ],
    name: 'updateMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'roles',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RolesUpdated',
  },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'ArtPoolFull' },
  { type: 'error', inputs: [], name: 'InvalidMetadata' },
  { type: 'error', inputs: [], name: 'InvalidTokenId' },
  { type: 'error', inputs: [], name: 'MintPoolFull' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'TokenNotInBurnPool' },
  { type: 'error', inputs: [], name: 'TokenNotInMintPool' },
  { type: 'error', inputs: [], name: 'TokenNotOwned' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FLSNaming
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const flsNamingAbi = [
  {
    type: 'constructor',
    inputs: [{ name: '_gateNft', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AddressAlreadyLinked' },
  { type: 'error', inputs: [], name: 'AddressNotVerified' },
  { type: 'error', inputs: [], name: 'AlreadyHasIdentity' },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'CannotRemovePrimary' },
  { type: 'error', inputs: [], name: 'CommitmentAlreadyUsed' },
  { type: 'error', inputs: [], name: 'CommitmentExpired' },
  { type: 'error', inputs: [], name: 'CommitmentNotFound' },
  { type: 'error', inputs: [], name: 'CommitmentTooNew' },
  { type: 'error', inputs: [], name: 'EmptyName' },
  { type: 'error', inputs: [], name: 'GateTokenAlreadyUsed' },
  { type: 'error', inputs: [], name: 'IdentityNotFound' },
  { type: 'error', inputs: [], name: 'InvalidAddress' },
  { type: 'error', inputs: [], name: 'InvalidMetadataBatch' },
  { type: 'error', inputs: [], name: 'InvalidPrimaryTokenId' },
  { type: 'error', inputs: [], name: 'InvalidSignature' },
  { type: 'error', inputs: [], name: 'NameAlreadyClaimed' },
  { type: 'error', inputs: [], name: 'NameTooLong' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'NotNFTHolder' },
  { type: 'error', inputs: [], name: 'NotPrimaryAddress' },
  { type: 'error', inputs: [], name: 'PrimaryMustOwnTokenId' },
  { type: 'error', inputs: [], name: 'TransferDisabled' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_fromTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_toTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'BatchMetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'oldPrimary',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'IdentitySynced',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'key', internalType: 'bytes32', type: 'bytes32', indexed: true },
    ],
    name: 'MetadataDeleted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'key', internalType: 'bytes32', type: 'bytes32', indexed: true },
    ],
    name: 'MetadataUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'primary',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'name', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'primaryTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'NameClaimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'committer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'commitment',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'NameCommitted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'oldPrimary',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newPrimary',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'PrimaryAddressChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'oldPrimaryTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newPrimaryTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PrimaryTokenIdChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'roles',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RolesUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Transfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'addr', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'VerifiedAddressAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'addr', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'VerifiedAddressRemoved',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_COMMIT_AGE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_NAME_LENGTH',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_COMMIT_AGE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'addVerifiedAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'addressToTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'baseTokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'buildAddVerifiedAddressDigest',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_name', internalType: 'string', type: 'string' },
      { name: '_primaryTokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'checkNameNotClaimed',
    outputs: [{ name: 'nameHash', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_name', internalType: 'string', type: 'string' },
      { name: '_salt', internalType: 'bytes32', type: 'bytes32' },
      { name: '_primaryTokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'claimName',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'commitment', internalType: 'bytes32', type: 'bytes32' }],
    name: 'commitName',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'commitments',
    outputs: [
      { name: 'timestamp', internalType: 'uint248', type: 'uint248' },
      { name: 'used', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'bytes32', type: 'bytes32' }],
    name: 'deleteMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'emitMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'gateNft',
    outputs: [{ name: '', internalType: 'contract IERC721', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'gateTokenIdToIdentityTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'commitment', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getCommitment',
    outputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getIdentity',
    outputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'key', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'getMetadata',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getMetadataKeys',
    outputs: [{ name: '', internalType: 'bytes32[]', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getVerifiedAddresses',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'grantRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAllRoles',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAnyRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'addr', internalType: 'address', type: 'address' }],
    name: 'hasGateNFT',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_name', internalType: 'string', type: 'string' }],
    name: 'hashName',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'identities',
    outputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'primaryAddress', internalType: 'address', type: 'address' },
      { name: 'primaryTokenId', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'addr', internalType: 'address', type: 'address' },
    ],
    name: 'isVerified',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_name', internalType: 'string', type: 'string' },
      { name: '_salt', internalType: 'bytes32', type: 'bytes32' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    name: 'makeCommitment',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'nameHashToTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'addr', internalType: 'address', type: 'address' }],
    name: 'removeVerifiedAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renderer',
    outputs: [
      {
        name: '',
        internalType: 'contract ITokenURIGenerator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    name: 'renounceRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'nameHash', internalType: 'bytes32', type: 'bytes32' }],
    name: 'resolveByNameHash',
    outputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'primaryAddress', internalType: 'address', type: 'address' },
      { name: 'primaryTokenId', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_name', internalType: 'string', type: 'string' }],
    name: 'resolveName',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'gateTokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'resolvePrimaryByGateTokenId',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_name', internalType: 'string', type: 'string' }],
    name: 'resolvePrimaryByName',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'revokeRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleMeadata',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleMetadataAdmin',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleMetadataUpdater',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'uri', internalType: 'string', type: 'string' }],
    name: 'setBaseTokenURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'key', internalType: 'bytes32', type: 'bytes32' },
      { name: 'value', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'setMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'keys', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'values', internalType: 'bytes[]', type: 'bytes[]' },
    ],
    name: 'setMetadataBatch',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newPrimary', internalType: 'address', type: 'address' }],
    name: 'setPrimaryAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newPrimaryTokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'setPrimaryTokenId',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newRenderer', internalType: 'address', type: 'address' }],
    name: 'setRenderer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'sync',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const flsNamingAddress = {
  1: '0xaE21fEF5E74B7Ec887704023EC13F412983Eb304',
  84532: '0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073',
  11155111: '0x9bf1E5dA76e5f62cfA843BA19A887578A341f674',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const flsNamingConfig = {
  address: flsNamingAddress,
  abi: flsNamingAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FUNKNLOVE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const funknloveAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_startTime', internalType: 'uint64', type: 'uint64' },
      { name: '_endTime', internalType: 'uint64', type: 'uint64' },
      { name: '_baseURI', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FLS_EXODUS_ROAD_DONATION_ADDRESS',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FLS_VAULT_ADDRESS',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'airdropMint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owners', internalType: 'address[]', type: 'address[]' },
      { name: 'ids', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'balanceOfBatch',
    outputs: [
      { name: 'balances', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getBronzePrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getBronzeSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getEndTime',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getGoldPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getGoldSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getSilverPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getSilverSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getStartTime',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'grantRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAllRoles',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAnyRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: 'result', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'isMintOpen',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tier', internalType: 'enum FUNKNLOVE.Tier', type: 'uint8' },
    ],
    name: 'mintPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'mintRequest',
        internalType: 'struct FUNKNLOVE.MintRequest',
        type: 'tuple',
        components: [
          { name: 'bronze', internalType: 'uint32', type: 'uint32' },
          { name: 'silver', internalType: 'uint32', type: 'uint32' },
          { name: 'gold', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    name: 'publicMint',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    name: 'renounceRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'revokeRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'ids', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeBatchTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'isApproved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newBaseURI', internalType: 'string', type: 'string' }],
    name: 'setBaseURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newEndTime', internalType: 'uint64', type: 'uint64' }],
    name: 'setEndTime',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newStartTime', internalType: 'uint64', type: 'uint64' }],
    name: 'setStartTime',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: 'result', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdrawFLSExodusRoadDonation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'isApproved',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'roles',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RolesUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'ids',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'amounts',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
    ],
    name: 'TransferBatch',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TransferSingle',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'value', internalType: 'string', type: 'string', indexed: false },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'URI',
  },
  { type: 'error', inputs: [], name: 'AccountBalanceOverflow' },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'ArrayLengthsMismatch' },
  { type: 'error', inputs: [], name: 'FailedToSendEther' },
  { type: 'error', inputs: [], name: 'FreeMintLimitReached' },
  { type: 'error', inputs: [], name: 'InsufficientBalance' },
  { type: 'error', inputs: [], name: 'InvalidTier' },
  { type: 'error', inputs: [], name: 'MintMustBeGreaterThanZero' },
  { type: 'error', inputs: [], name: 'MintMustNotBeEnded' },
  { type: 'error', inputs: [], name: 'MintMustNotBeStarted' },
  { type: 'error', inputs: [], name: 'MintNotEnded' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'NotOwnerNorApproved' },
  { type: 'error', inputs: [], name: 'PublicMintEnded' },
  { type: 'error', inputs: [], name: 'PublicMintNotStarted' },
  {
    type: 'error',
    inputs: [],
    name: 'TransferToNonERC1155ReceiverImplementer',
  },
  { type: 'error', inputs: [], name: 'TransferToZeroAddress' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  { type: 'error', inputs: [], name: 'WrongPayment' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Fame
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const fameAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name_', internalType: 'string', type: 'string' },
      { name: 'symbol_', internalType: 'string', type: 'string' },
      { name: 'claimToFameAddress', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'burnedPoolManager',
    outputs: [
      {
        name: '',
        internalType: 'contract IBurnedPoolManager',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'fromTokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'toTokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'emitBatchMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'emitMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'fameMirror',
    outputs: [
      { name: '', internalType: 'contract FameMirror', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'getSkipNFT',
    outputs: [{ name: 'result', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'grantRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAllRoles',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAnyRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'launchPublic',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'mirrorERC721',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renderer',
    outputs: [
      {
        name: '',
        internalType: 'contract ITokenURIGenerator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    name: 'renounceRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'revokeRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'newBurnedPoolManager',
        internalType: 'address',
        type: 'address',
      },
    ],
    name: 'setBurnedPoolManager',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newRenderer', internalType: 'address', type: 'address' }],
    name: 'setRenderer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'skipNFT', internalType: 'bool', type: 'bool' }],
    name: 'setSkipNFT',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'skip', internalType: 'bool', type: 'bool' },
    ],
    name: 'setSkipNftForAccount',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'unit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'roles',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RolesUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'status', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'SkipNFTSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'AlreadyLaunched' },
  { type: 'error', inputs: [], name: 'ApprovalCallerNotOwnerNorApproved' },
  { type: 'error', inputs: [], name: 'DNAlreadyInitialized' },
  { type: 'error', inputs: [], name: 'DNNotInitialized' },
  { type: 'error', inputs: [], name: 'FnSelectorNotRecognized' },
  { type: 'error', inputs: [], name: 'InsufficientAllowance' },
  { type: 'error', inputs: [], name: 'InsufficientBalance' },
  { type: 'error', inputs: [], name: 'InvalidUnit' },
  { type: 'error', inputs: [], name: 'LinkMirrorContractFailed' },
  { type: 'error', inputs: [], name: 'MirrorAddressIsZero' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'NotLaunched' },
  { type: 'error', inputs: [], name: 'SenderNotMirror' },
  { type: 'error', inputs: [], name: 'TokenDoesNotExist' },
  { type: 'error', inputs: [], name: 'TotalSupplyOverflow' },
  { type: 'error', inputs: [], name: 'TransferCallerNotOwnerNorApproved' },
  { type: 'error', inputs: [], name: 'TransferFromIncorrectOwner' },
  { type: 'error', inputs: [], name: 'TransferToZeroAddress' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FameLadySociety
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const fameLadySocietyAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'nftContract', internalType: 'address', type: 'address' },
      { name: 'tokenRenderer', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'DevTipFailed' },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'MustOwnToken',
  },
  { type: 'error', inputs: [], name: 'MustWrapOneToken' },
  { type: 'error', inputs: [], name: 'NoContractUri' },
  {
    type: 'error',
    inputs: [{ name: 'required', internalType: 'uint256', type: 'uint256' }],
    name: 'NotEnoughEther',
  },
  {
    type: 'error',
    inputs: [{ name: 'operator', internalType: 'address', type: 'address' }],
    name: 'OperatorNotAllowed',
  },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'TokenNotWrapped',
  },
  { type: 'error', inputs: [], name: 'WithdrawFailed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_fromTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_toTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'BatchMetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferStarted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'EMIT_METADATA_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'OPERATOR_FILTER_REGISTRY',
    outputs: [
      {
        name: '',
        internalType: 'contract IOperatorFilterRegistry',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'TREASURER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPDATE_RENDERER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'claimed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'contractURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'defaultRoyaltyInfo',
    outputs: [
      { name: 'receiver', internalType: 'address', type: 'address' },
      { name: 'royaltyFraction', internalType: 'uint96', type: 'uint96' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'emitMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'isWrapped',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pendingOwner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renderer',
    outputs: [
      {
        name: '',
        internalType: 'contract ITokenURIGenerator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '_salePrice', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'royaltyInfo',
    outputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: 'royaltyAmount', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'uri', internalType: 'string', type: 'string' }],
    name: 'setContractURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'receiver', internalType: 'address', type: 'address' },
      { name: 'feeNumerator', internalType: 'uint96', type: 'uint96' },
    ],
    name: 'setDefaultRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newRenderer', internalType: 'address', type: 'address' }],
    name: 'setRenderer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'cost', internalType: 'uint256', type: 'uint256' }],
    name: 'setWrapCost',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'unwrap',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'unwrapMany',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'wrap',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wrapCost',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'wrapTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wrappedNft',
    outputs: [{ name: '', internalType: 'contract IERC721', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const fameLadySocietyAddress = {
  1: '0x6cF4328f1Ea83B5d592474F9fCDC714FAAfd1574',
} as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const fameLadySocietyConfig = {
  address: fameLadySocietyAddress,
  abi: fameLadySocietyAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FameLadySquad
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const fameLadySquadAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'baseURI', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'approved',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_LADY_SUPPLY',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'SALE_START_TIMESTAMP',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'baseURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'baseURI', internalType: 'string', type: 'string' }],
    name: 'changeBaseURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'getNFTPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'numberOfLadies', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mintLady',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenByIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'index', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const fameLadySquadAddress = {
  1: '0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47',
} as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const fameLadySquadConfig = {
  address: fameLadySquadAddress,
  abi: fameLadySquadAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FameMirror
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const fameMirrorAbi = [
  {
    type: 'constructor',
    inputs: [{ name: '_owner', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'nftOwner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'baseERC20',
    outputs: [{ name: 'base', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'fromTokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'toTokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'emitBatchMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'emitMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'nftOwner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerAt',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pullOwner',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: 'result', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'isApproved',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_fromTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_toTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'BatchMetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Transfer',
  },
  { type: 'error', inputs: [], name: 'AlreadyLinked' },
  { type: 'error', inputs: [], name: 'FnSelectorNotRecognized' },
  { type: 'error', inputs: [], name: 'NotLinked' },
  { type: 'error', inputs: [], name: 'OnlyERC20CanCall' },
  { type: 'error', inputs: [], name: 'SenderNotBase' },
  { type: 'error', inputs: [], name: 'SenderNotDeployer' },
  { type: 'error', inputs: [], name: 'TransferToNonERC721ReceiverImplementer' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FameSale
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const fameSaleAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'MaxBuyExceeded' },
  { type: 'error', inputs: [], name: 'MaxRaisedExceeded' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoFundsAvailable' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'NoRefundAvailable' },
  { type: 'error', inputs: [], name: 'NotAllowed' },
  { type: 'error', inputs: [], name: 'Paused' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'roles',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RolesUpdated',
  },
  {
    type: 'function',
    inputs: [
      { name: 'merkleProof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'buy',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'check', internalType: 'address', type: 'address' },
    ],
    name: 'canProve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'fameBalanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'fameSaleToken',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'fameTotalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'grantRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAllRoles',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAnyRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'isPaused',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxBuy',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxRaise',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'merkleRoot',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'raiseRemaining',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    name: 'renounceRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'revokeRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleAllowlist',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleExecutive',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleTreasurer',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_maxBuy', internalType: 'uint256', type: 'uint256' }],
    name: 'setMaxBuy',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_maxRaise', internalType: 'uint256', type: 'uint256' }],
    name: 'setMaxRaise',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_merkleRoot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'setMerkleRoot',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const fameSaleAddress = {
  11155111: '0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3',
} as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const fameSaleConfig = {
  address: fameSaleAddress,
  abi: fameSaleAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FameSaleToken
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const fameSaleTokenAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AllowanceOverflow' },
  { type: 'error', inputs: [], name: 'AllowanceUnderflow' },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'InsufficientAllowance' },
  { type: 'error', inputs: [], name: 'InsufficientBalance' },
  { type: 'error', inputs: [], name: 'InvalidPermit' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'PermitExpired' },
  { type: 'error', inputs: [], name: 'TotalSupplyOverflow' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'roles',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RolesUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: 'result', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'grantRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAllRoles',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAnyRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'hasHolder',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'holders',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    name: 'renounceRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'revokeRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleBurner',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleController',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'roleMinter',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
] as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const fameSaleTokenAddress = {
  11155111: '0x233A9630e1fC80688E5cc2bb988836e0D5034328',
} as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const fameSaleTokenConfig = {
  address: fameSaleTokenAddress,
  abi: fameSaleTokenAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FameVesting
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const fameVestingAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [{ name: 'holder', internalType: 'address', type: 'address' }],
    name: 'computeNextVestingScheduleIdForHolder',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'vestingScheduleId', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'computeReleasableAmount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'holder', internalType: 'address', type: 'address' },
      { name: 'index', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'computeVestingScheduleIdForAddressAndIndex',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '_beneficiary', internalType: 'address', type: 'address' },
      { name: '_start', internalType: 'uint256', type: 'uint256' },
      { name: '_cliff', internalType: 'uint256', type: 'uint256' },
      { name: '_duration', internalType: 'uint256', type: 'uint256' },
      { name: '_slicePeriodSeconds', internalType: 'uint256', type: 'uint256' },
      { name: '_revocable', internalType: 'bool', type: 'bool' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createVestingSchedule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'holder', internalType: 'address', type: 'address' }],
    name: 'getLastVestingScheduleForHolder',
    outputs: [
      {
        name: '',
        internalType: 'struct TokenVesting.VestingSchedule',
        type: 'tuple',
        components: [
          { name: 'beneficiary', internalType: 'address', type: 'address' },
          { name: 'cliff', internalType: 'uint256', type: 'uint256' },
          { name: 'start', internalType: 'uint256', type: 'uint256' },
          { name: 'duration', internalType: 'uint256', type: 'uint256' },
          {
            name: 'slicePeriodSeconds',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'amountTotal', internalType: 'uint256', type: 'uint256' },
          { name: 'released', internalType: 'uint256', type: 'uint256' },
          { name: 'revoked', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getToken',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'getVestingIdAtIndex',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'vestingScheduleId', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'getVestingSchedule',
    outputs: [
      {
        name: '',
        internalType: 'struct TokenVesting.VestingSchedule',
        type: 'tuple',
        components: [
          { name: 'beneficiary', internalType: 'address', type: 'address' },
          { name: 'cliff', internalType: 'uint256', type: 'uint256' },
          { name: 'start', internalType: 'uint256', type: 'uint256' },
          { name: 'duration', internalType: 'uint256', type: 'uint256' },
          {
            name: 'slicePeriodSeconds',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'amountTotal', internalType: 'uint256', type: 'uint256' },
          { name: 'released', internalType: 'uint256', type: 'uint256' },
          { name: 'revoked', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'holder', internalType: 'address', type: 'address' },
      { name: 'index', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getVestingScheduleByAddressAndIndex',
    outputs: [
      {
        name: '',
        internalType: 'struct TokenVesting.VestingSchedule',
        type: 'tuple',
        components: [
          { name: 'beneficiary', internalType: 'address', type: 'address' },
          { name: 'cliff', internalType: 'uint256', type: 'uint256' },
          { name: 'start', internalType: 'uint256', type: 'uint256' },
          { name: 'duration', internalType: 'uint256', type: 'uint256' },
          {
            name: 'slicePeriodSeconds',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'amountTotal', internalType: 'uint256', type: 'uint256' },
          { name: 'released', internalType: 'uint256', type: 'uint256' },
          { name: 'revoked', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getVestingSchedulesCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_beneficiary', internalType: 'address', type: 'address' },
    ],
    name: 'getVestingSchedulesCountByBeneficiary',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getVestingSchedulesTotalAmount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getWithdrawableAmount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'vestingScheduleId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'release',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'vestingScheduleId', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'revoke',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GovSociety
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const govSocietyAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'underlyingToken', internalType: 'address', type: 'address' },
      { name: 'defaultAdmin', internalType: 'address', type: 'address' },
      { name: '_renderer', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'CLOCK_MODE',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'RENDERER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'TOKEN_URI_GENERATOR_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'clock',
    outputs: [{ name: '', internalType: 'uint48', type: 'uint48' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'delegatee', internalType: 'address', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'delegatee', internalType: 'address', type: 'address' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
      { name: 'expiry', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'delegateBySig',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'delegates',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'depositFor',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      { name: 'fields', internalType: 'bytes1', type: 'bytes1' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'version', internalType: 'string', type: 'string' },
      { name: 'chainId', internalType: 'uint256', type: 'uint256' },
      { name: 'verifyingContract', internalType: 'address', type: 'address' },
      { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
      { name: 'extensions', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'end', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'emitBatchMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'emitMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'timepoint', internalType: 'uint256', type: 'uint256' }],
    name: 'getPastTotalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getPastVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'guardianForTokenId',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'isLocked',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'lock',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'lockMany',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'guardian', internalType: 'address', type: 'address' },
    ],
    name: 'lockWithGuardian',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'guardian', internalType: 'address', type: 'address' },
    ],
    name: 'lockWithGuardianMany',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'lockedTokenCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renderer',
    outputs: [
      {
        name: '',
        internalType: 'contract ITokenURIGenerator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_renderer', internalType: 'address', type: 'address' }],
    name: 'setRenderer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'underlying',
    outputs: [{ name: '', internalType: 'contract IERC721', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'unlock',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'unlockMany',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'withdrawTo',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'approved',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_fromTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_toTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'BatchMetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'fromDelegate',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'toDelegate',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'DelegateChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegate',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'previousVotes',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newVotes',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'DelegateVotesChanged',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'EIP712DomainChanged' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Transfer',
  },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'BurnAddressCannotBeGuardian' },
  { type: 'error', inputs: [], name: 'CheckpointUnorderedInsertion' },
  { type: 'error', inputs: [], name: 'ECDSAInvalidSignature' },
  {
    type: 'error',
    inputs: [{ name: 'length', internalType: 'uint256', type: 'uint256' }],
    name: 'ECDSAInvalidSignatureLength',
  },
  {
    type: 'error',
    inputs: [{ name: 's', internalType: 'bytes32', type: 'bytes32' }],
    name: 'ECDSAInvalidSignatureS',
  },
  {
    type: 'error',
    inputs: [
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' },
      { name: 'clock', internalType: 'uint48', type: 'uint48' },
    ],
    name: 'ERC5805FutureLookup',
  },
  { type: 'error', inputs: [], name: 'ERC6372InconsistentClock' },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'ERC721IncorrectOwner',
  },
  {
    type: 'error',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC721InsufficientApproval',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'operator', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidOperator',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC721InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ERC721NonexistentToken',
  },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'ERC721UnsupportedToken',
  },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'currentNonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InvalidAccountNonce',
  },
  {
    type: 'error',
    inputs: [{ name: 'renderer', internalType: 'address', type: 'address' }],
    name: 'InvalidRenderer',
  },
  { type: 'error', inputs: [], name: 'InvalidShortString' },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'OnlyGuardianOrOwner',
  },
  {
    type: 'error',
    inputs: [
      { name: 'bits', internalType: 'uint8', type: 'uint8' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'SafeCastOverflowedUintDowncast',
  },
  {
    type: 'error',
    inputs: [{ name: 'str', internalType: 'string', type: 'string' }],
    name: 'StringTooLong',
  },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'TokenIsAlreadyLocked',
  },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'TokenIsLocked',
  },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'TokenIsNotLocked',
  },
  {
    type: 'error',
    inputs: [{ name: 'expiry', internalType: 'uint256', type: 'uint256' }],
    name: 'VotesExpiredSignature',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IBalanceOf
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iBalanceOfAbi = [
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ITokenEmitable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iTokenEmitableAbi = [
  {
    type: 'function',
    inputs: [
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'end', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'emitBatchMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'emitMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LingerieDreams
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const lingerieDreamsAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_startTime', internalType: 'uint64', type: 'uint64' },
      { name: '_mintPrice', internalType: 'uint256', type: 'uint256' },
      { name: '_mintLimit', internalType: 'uint8', type: 'uint8' },
      { name: '_baseURI', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getStartTime',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: 'result', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'mintLimit',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'mintPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'mintAmount', internalType: 'uint8', type: 'uint8' }],
    name: 'publicMint',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'isApproved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newBaseURI', internalType: 'string', type: 'string' }],
    name: 'setBaseURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newMintLimit', internalType: 'uint8', type: 'uint8' }],
    name: 'setMintLimit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newStartTime', internalType: 'uint64', type: 'uint64' }],
    name: 'setStartTime',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: 'result', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'isApproved',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Transfer',
  },
  { type: 'error', inputs: [], name: 'AccountBalanceOverflow' },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'BalanceQueryForZeroAddress' },
  { type: 'error', inputs: [], name: 'FailedToSendEther' },
  { type: 'error', inputs: [], name: 'MintAmountExceedsLimit' },
  { type: 'error', inputs: [], name: 'MintAmountExceedsSupply' },
  { type: 'error', inputs: [], name: 'MintLimitCantBeZero' },
  { type: 'error', inputs: [], name: 'MintMustBeGreaterThanZero' },
  { type: 'error', inputs: [], name: 'MintMustNotBeStarted' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'NotEnoughPayment' },
  { type: 'error', inputs: [], name: 'NotOwnerNorApproved' },
  { type: 'error', inputs: [], name: 'PublicMintNotStarted' },
  { type: 'error', inputs: [], name: 'TokenAlreadyExists' },
  { type: 'error', inputs: [], name: 'TokenDoesNotExist' },
  { type: 'error', inputs: [], name: 'TransferFromIncorrectOwner' },
  { type: 'error', inputs: [], name: 'TransferToNonERC721ReceiverImplementer' },
  { type: 'error', inputs: [], name: 'TransferToZeroAddress' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NamedLadyRenderer
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const namedLadyRendererAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_baseURI', internalType: 'string', type: 'string' },
      { name: 'emitableNft', internalType: 'address', type: 'address' },
      { name: '_signer', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'InvalidSignature' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'NotTokenOwnerOrApproved' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'roles',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RolesUpdated',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ban',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'currentNonce',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'grantRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAllRoles',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAnyRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'uri', internalType: 'string', type: 'string' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hashUpdateRequest',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'metadataEmit',
    outputs: [
      {
        name: '',
        internalType: 'contract ITokenMetadataEmit',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'metadataRole',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    name: 'renounceRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'revokeRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_baseURI', internalType: 'string', type: 'string' }],
    name: 'setBaseURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_signer', internalType: 'address', type: 'address' }],
    name: 'setSigner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'uri', internalType: 'string', type: 'string' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'setTokenUri',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'signerRole',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'trustRole',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const namedLadyRendererAddress = {
  1: '0xC7A29659c34CB2551Aec0dc589e6450aF342bf24',
  11155111: '0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const namedLadyRendererConfig = {
  address: namedLadyRendererAddress,
  abi: namedLadyRendererAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SaveLady
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const saveLadyAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'Reentrancy' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'buyer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenIds',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'totalPrice',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalWrapCost',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'feePaid',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SweepAndWrap',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FAME_LADY_SOCIETY',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FAME_LADY_SQUAD',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FEE_BPS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address payable', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'rescueETH',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'seaport',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'value', internalType: 'bool', type: 'bool' }],
    name: 'setSquadApprovalSet',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'squadApprovalSet',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'advancedOrders',
        internalType: 'struct AdvancedOrder[]',
        type: 'tuple[]',
        components: [
          {
            name: 'parameters',
            internalType: 'struct OrderParameters',
            type: 'tuple',
            components: [
              { name: 'offerer', internalType: 'address', type: 'address' },
              { name: 'zone', internalType: 'address', type: 'address' },
              {
                name: 'offer',
                internalType: 'struct OfferItem[]',
                type: 'tuple[]',
                components: [
                  {
                    name: 'itemType',
                    internalType: 'enum ItemType',
                    type: 'uint8',
                  },
                  { name: 'token', internalType: 'address', type: 'address' },
                  {
                    name: 'identifierOrCriteria',
                    internalType: 'uint256',
                    type: 'uint256',
                  },
                  {
                    name: 'startAmount',
                    internalType: 'uint256',
                    type: 'uint256',
                  },
                  {
                    name: 'endAmount',
                    internalType: 'uint256',
                    type: 'uint256',
                  },
                ],
              },
              {
                name: 'consideration',
                internalType: 'struct ConsiderationItem[]',
                type: 'tuple[]',
                components: [
                  {
                    name: 'itemType',
                    internalType: 'enum ItemType',
                    type: 'uint8',
                  },
                  { name: 'token', internalType: 'address', type: 'address' },
                  {
                    name: 'identifierOrCriteria',
                    internalType: 'uint256',
                    type: 'uint256',
                  },
                  {
                    name: 'startAmount',
                    internalType: 'uint256',
                    type: 'uint256',
                  },
                  {
                    name: 'endAmount',
                    internalType: 'uint256',
                    type: 'uint256',
                  },
                  {
                    name: 'recipient',
                    internalType: 'address payable',
                    type: 'address',
                  },
                ],
              },
              {
                name: 'orderType',
                internalType: 'enum OrderType',
                type: 'uint8',
              },
              { name: 'startTime', internalType: 'uint256', type: 'uint256' },
              { name: 'endTime', internalType: 'uint256', type: 'uint256' },
              { name: 'zoneHash', internalType: 'bytes32', type: 'bytes32' },
              { name: 'salt', internalType: 'uint256', type: 'uint256' },
              { name: 'conduitKey', internalType: 'bytes32', type: 'bytes32' },
              {
                name: 'totalOriginalConsiderationItems',
                internalType: 'uint256',
                type: 'uint256',
              },
            ],
          },
          { name: 'numerator', internalType: 'uint120', type: 'uint120' },
          { name: 'denominator', internalType: 'uint120', type: 'uint120' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
          { name: 'extraData', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'fulfillerConduitKey', internalType: 'bytes32', type: 'bytes32' },
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'ethAmounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'sweepAndWrap',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
] as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const saveLadyAddress = {
  1: '0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC',
} as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const saveLadyConfig = {
  address: saveLadyAddress,
  abi: saveLadyAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SimpleOffchainReveal
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const simpleOffchainRevealAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_childRenderer', internalType: 'address', type: 'address' },
      { name: '_tokenEmitable', internalType: 'address', type: 'address' },
      { name: '_startAtToken', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'RENDERER',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'batches',
    outputs: [
      { name: 'salt', internalType: 'uint256', type: 'uint256' },
      { name: 'startAtToken', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'baseUri', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'childRenderer',
    outputs: [
      {
        name: '',
        internalType: 'contract ITokenURIGenerator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'end', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'emitBatchMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'emitMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'grantRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAllRoles',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'hasAnyRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'offsetForTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'salt', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'baseUri', internalType: 'string', type: 'string' },
    ],
    name: 'pushBatch',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    name: 'renounceRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'roles', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'revokeRoles',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'rolesOf',
    outputs: [{ name: 'roles', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'startAtToken',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tokenEmitable',
    outputs: [
      { name: '', internalType: 'contract ITokenEmitable', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenEmitable', internalType: 'address', type: 'address' },
    ],
    name: 'updateTokenEmitable',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'roles',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RolesUpdated',
  },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoBatchForTokenId' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UnrevealedLadyRenderer
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const unrevealedLadyRendererAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_childRenderer', internalType: 'address', type: 'address' },
      { name: '_tokenemEmitable', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AlreadyInitialized' },
  { type: 'error', inputs: [], name: 'NewOwnerIsZeroAddress' },
  { type: 'error', inputs: [], name: 'NoBatchForTokenId' },
  { type: 'error', inputs: [], name: 'NoHandoverRequest' },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pendingOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipHandoverRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'batches',
    outputs: [
      { name: 'salt', internalType: 'uint256', type: 'uint256' },
      { name: 'startAtToken', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'baseUri', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cancelOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'childRenderer',
    outputs: [
      {
        name: '',
        internalType: 'contract ITokenURIGenerator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'completeOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'offsetForTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: 'result', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pendingOwner', internalType: 'address', type: 'address' },
    ],
    name: 'ownershipHandoverExpiresAt',
    outputs: [{ name: 'result', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'salt', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'baseUri', internalType: 'string', type: 'string' },
    ],
    name: 'pushBatch',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestOwnershipHandover',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tokenemEmitable',
    outputs: [
      { name: '', internalType: 'contract ITokemEmitable', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'payable',
  },
] as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const unrevealedLadyRendererAddress = {
  8453: '0xA50C9a918C110CA159fb187F4a55896A4d063878',
} as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const unrevealedLadyRendererConfig = {
  address: unrevealedLadyRendererAddress,
  abi: unrevealedLadyRendererAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WrappedNFT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const wrappedNftAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'nftContract', internalType: 'address', type: 'address' },
      { name: 'tokenRenderer', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'DevTipFailed' },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'MustOwnToken',
  },
  { type: 'error', inputs: [], name: 'MustWrapOneToken' },
  { type: 'error', inputs: [], name: 'NoContractUri' },
  {
    type: 'error',
    inputs: [{ name: 'required', internalType: 'uint256', type: 'uint256' }],
    name: 'NotEnoughEther',
  },
  {
    type: 'error',
    inputs: [{ name: 'operator', internalType: 'address', type: 'address' }],
    name: 'OperatorNotAllowed',
  },
  {
    type: 'error',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'TokenNotWrapped',
  },
  { type: 'error', inputs: [], name: 'WithdrawFailed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_fromTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_toTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'BatchMetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferStarted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'EMIT_METADATA_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'OPERATOR_FILTER_REGISTRY',
    outputs: [
      {
        name: '',
        internalType: 'contract IOperatorFilterRegistry',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'TREASURER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPDATE_RENDERER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'claimed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'contractURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'defaultRoyaltyInfo',
    outputs: [
      { name: 'receiver', internalType: 'address', type: 'address' },
      { name: 'royaltyFraction', internalType: 'uint96', type: 'uint96' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'emitMetadataUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'isWrapped',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pendingOwner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renderer',
    outputs: [
      {
        name: '',
        internalType: 'contract ITokenURIGenerator',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '_salePrice', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'royaltyInfo',
    outputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: 'royaltyAmount', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'uri', internalType: 'string', type: 'string' }],
    name: 'setContractURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'receiver', internalType: 'address', type: 'address' },
      { name: 'feeNumerator', internalType: 'uint96', type: 'uint96' },
    ],
    name: 'setDefaultRoyalty',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newRenderer', internalType: 'address', type: 'address' }],
    name: 'setRenderer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'cost', internalType: 'uint256', type: 'uint256' }],
    name: 'setWrapCost',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'unwrap',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'unwrapMany',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'wrap',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wrapCost',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'wrapTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wrappedNft',
    outputs: [{ name: '', internalType: 'contract IERC721', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const wrappedNftAddress = {
  11155111: '0x9EFf37047657a0f50b989165b48012834eDB2212',
} as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const wrappedNftConfig = {
  address: wrappedNftAddress,
  abi: wrappedNftAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WrappedNFTDonationVault
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const wrappedNftDonationVaultAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'wrappedNFTAddress', internalType: 'address', type: 'address' },
      { name: 'vaultAddress', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'EmptyTokenList' },
  { type: 'error', inputs: [], name: 'InvalidVault' },
  { type: 'error', inputs: [], name: 'InvalidWrappedNFT' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'donor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'vaultAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenIds',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
    ],
    name: 'WrappedAndDonated',
  },
  {
    type: 'function',
    inputs: [],
    name: 'underlying',
    outputs: [{ name: '', internalType: 'contract IERC721', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'vault',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'wrapAndDonate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wrappedNFT',
    outputs: [
      { name: '', internalType: 'contract WrappedNFT', type: 'address' },
    ],
    stateMutability: 'view',
  },
] as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const wrappedNftDonationVaultAddress = {
  1: '0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b',
} as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const wrappedNftDonationVaultConfig = {
  address: wrappedNftDonationVaultAddress,
  abi: wrappedNftDonationVaultAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ZoraFactoryImpl
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const zoraFactoryImplAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'coinV4Impl_', internalType: 'address', type: 'address' },
      { name: 'creatorCoinImpl_', internalType: 'address', type: 'address' },
      { name: 'hook_', internalType: 'address', type: 'address' },
      { name: 'zoraHookRegistry_', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  { type: 'error', inputs: [], name: 'ArrayLengthMismatch' },
  { type: 'error', inputs: [], name: 'ConfigTickLowerMustBeLessThanTickUpper' },
  { type: 'error', inputs: [], name: 'Deprecated' },
  { type: 'error', inputs: [], name: 'ERC1167FailedCreateClone' },
  {
    type: 'error',
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
    ],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'EthTransferInvalid' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  { type: 'error', inputs: [], name: 'InvalidConfig' },
  { type: 'error', inputs: [], name: 'InvalidHook' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'InvalidPoolVersion' },
  {
    type: 'error',
    inputs: [
      { name: 'tickLower', internalType: 'int24', type: 'int24' },
      { name: 'tickUpper', internalType: 'int24', type: 'int24' },
    ],
    name: 'InvalidTickRangeMisordered',
  },
  {
    type: 'error',
    inputs: [
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'limit', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'MaxShareToBeSoldExceeded',
  },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  { type: 'error', inputs: [], name: 'NumDiscoveryPositionsOutOfRange' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
  {
    type: 'error',
    inputs: [
      { name: 'currentName', internalType: 'string', type: 'string' },
      { name: 'newName', internalType: 'string', type: 'string' },
    ],
    name: 'UpgradeToMismatchedContractName',
  },
  { type: 'error', inputs: [], name: 'ZeroDiscoveryPositions' },
  { type: 'error', inputs: [], name: 'ZeroDiscoverySupplyShare' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'caller',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'payoutRecipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'platformReferrer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'currency',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      { name: 'uri', internalType: 'string', type: 'string', indexed: false },
      { name: 'name', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'symbol',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'coin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'pool',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'version',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'CoinCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'caller',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'payoutRecipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'platformReferrer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'currency',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      { name: 'uri', internalType: 'string', type: 'string', indexed: false },
      { name: 'name', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'symbol',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'coin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'poolKey',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
        indexed: false,
      },
      {
        name: 'poolKeyHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'version',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'CoinCreatedV4',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'caller',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'payoutRecipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'platformReferrer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'currency',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      { name: 'uri', internalType: 'string', type: 'string', indexed: false },
      { name: 'name', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'symbol',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'coin',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'poolKey',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
        indexed: false,
      },
      {
        name: 'poolKeyHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'version',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'CreatorCoinCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferStarted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'msgSender', internalType: 'address', type: 'address' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'poolConfig', internalType: 'bytes', type: 'bytes' },
      { name: 'platformReferrer', internalType: 'address', type: 'address' },
      { name: 'coinSalt', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'coinAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'coinV4Impl',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'contentCoinHook',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'contractName',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'contractVersion',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'creatorCoinHook',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'creatorCoinImpl',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'payoutRecipient', internalType: 'address', type: 'address' },
      { name: 'owners', internalType: 'address[]', type: 'address[]' },
      { name: 'uri', internalType: 'string', type: 'string' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'platformReferrer', internalType: 'address', type: 'address' },
      { name: 'currency', internalType: 'address', type: 'address' },
      { name: '', internalType: 'int24', type: 'int24' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'deploy',
    outputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'payoutRecipient', internalType: 'address', type: 'address' },
      { name: 'owners', internalType: 'address[]', type: 'address[]' },
      { name: 'uri', internalType: 'string', type: 'string' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'poolConfig', internalType: 'bytes', type: 'bytes' },
      { name: 'platformReferrer', internalType: 'address', type: 'address' },
      { name: 'postDeployHook', internalType: 'address', type: 'address' },
      { name: 'postDeployHookData', internalType: 'bytes', type: 'bytes' },
      { name: 'coinSalt', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'deploy',
    outputs: [
      { name: 'coin', internalType: 'address', type: 'address' },
      { name: 'postDeployHookDataOut', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'payoutRecipient', internalType: 'address', type: 'address' },
      { name: 'owners', internalType: 'address[]', type: 'address[]' },
      { name: 'uri', internalType: 'string', type: 'string' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'poolConfig', internalType: 'bytes', type: 'bytes' },
      { name: 'platformReferrer', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'deploy',
    outputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'payoutRecipient', internalType: 'address', type: 'address' },
      { name: 'owners', internalType: 'address[]', type: 'address[]' },
      { name: 'uri', internalType: 'string', type: 'string' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'poolConfig', internalType: 'bytes', type: 'bytes' },
      { name: 'platformReferrer', internalType: 'address', type: 'address' },
      { name: 'coinSalt', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'deployCreatorCoin',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'payoutRecipient', internalType: 'address', type: 'address' },
      { name: 'owners', internalType: 'address[]', type: 'address[]' },
      { name: 'uri', internalType: 'string', type: 'string' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'poolConfig', internalType: 'bytes', type: 'bytes' },
      { name: 'platformReferrer', internalType: 'address', type: 'address' },
      { name: 'postDeployHook', internalType: 'address', type: 'address' },
      { name: 'postDeployHookData', internalType: 'bytes', type: 'bytes' },
      { name: 'coinSalt', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'deployCreatorCoin',
    outputs: [
      { name: 'coin', internalType: 'address', type: 'address' },
      { name: 'postDeployHookDataOut', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'payoutRecipient', internalType: 'address', type: 'address' },
      { name: 'owners', internalType: 'address[]', type: 'address[]' },
      { name: 'uri', internalType: 'string', type: 'string' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
      { name: 'poolConfig', internalType: 'bytes', type: 'bytes' },
      { name: 'platformReferrer', internalType: 'address', type: 'address' },
      { name: 'deployHook', internalType: 'address', type: 'address' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'deployWithHook',
    outputs: [
      { name: 'coin', internalType: 'address', type: 'address' },
      { name: 'hookDataOut', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'coin', internalType: 'address', type: 'address' }],
    name: 'getVersionForDeployedCoin',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'hook',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'initialOwner', internalType: 'address', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pendingOwner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'zoraHookRegistry',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const zoraFactoryImplAddress = {
  8453: '0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2',
} as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const zoraFactoryImplConfig = {
  address: zoraFactoryImplAddress,
  abi: zoraFactoryImplAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinter = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"MAX_SUPPLY"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterMaxSupply = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'MAX_SUPPLY',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"explicitOwnershipOf"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterExplicitOwnershipOf =
  /*#__PURE__*/ createUseReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'explicitOwnershipOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"explicitOwnershipsOf"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterExplicitOwnershipsOf =
  /*#__PURE__*/ createUseReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'explicitOwnershipsOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"getApproved"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterGetApproved = /*#__PURE__*/ createUseReadContract(
  {
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'getApproved',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"lastMintedTokenId"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterLastMintedTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'lastMintedTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterName = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"ownerOf"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterSymbol = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"tokenURI"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"tokensOfOwner"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterTokensOfOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'tokensOfOwner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"tokensOfOwnerIn"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterTokensOfOwnerIn =
  /*#__PURE__*/ createUseReadContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'tokensOfOwnerIn',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useReadBulkMinterTotalSupply = /*#__PURE__*/ createUseReadContract(
  {
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'totalSupply',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bulkMinterAbi}__
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWriteBulkMinter = /*#__PURE__*/ createUseWriteContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWriteBulkMinterApprove = /*#__PURE__*/ createUseWriteContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"mint"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWriteBulkMinterMint = /*#__PURE__*/ createUseWriteContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWriteBulkMinterSafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWriteBulkMinterSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWriteBulkMinterTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bulkMinterAbi}__
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useSimulateBulkMinter = /*#__PURE__*/ createUseSimulateContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useSimulateBulkMinterApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"mint"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useSimulateBulkMinterMint =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'mint',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useSimulateBulkMinterSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useSimulateBulkMinterSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useSimulateBulkMinterTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bulkMinterAbi}__
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWatchBulkMinterEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bulkMinterAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWatchBulkMinterApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bulkMinterAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWatchBulkMinterApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bulkMinterAbi}__ and `eventName` set to `"ConsecutiveTransfer"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWatchBulkMinterConsecutiveTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    eventName: 'ConsecutiveTransfer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bulkMinterAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x4E6bB6d251db23dc0855D53B09da0d4E7049B354)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x71E57b37b4BeA589673D0aFE1992A6457ca754b3)
 */
export const useWatchBulkMinterTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__
 */
export const useReadClaimToFame = /*#__PURE__*/ createUseReadContract({
  abi: claimToFameAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"fameToken"`
 */
export const useReadClaimToFameFameToken = /*#__PURE__*/ createUseReadContract({
  abi: claimToFameAbi,
  functionName: 'fameToken',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"generatePackedData"`
 */
export const useReadClaimToFameGeneratePackedData =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'generatePackedData',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"generateTokenIds"`
 */
export const useReadClaimToFameGenerateTokenIds =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'generateTokenIds',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"hasAllRoles"`
 */
export const useReadClaimToFameHasAllRoles =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'hasAllRoles',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"hasAnyRole"`
 */
export const useReadClaimToFameHasAnyRole = /*#__PURE__*/ createUseReadContract(
  { abi: claimToFameAbi, functionName: 'hasAnyRole' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"hashClaimDataRequest"`
 */
export const useReadClaimToFameHashClaimDataRequest =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'hashClaimDataRequest',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"hashClaimTokensRequest"`
 */
export const useReadClaimToFameHashClaimTokensRequest =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'hashClaimTokensRequest',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"isClaimed"`
 */
export const useReadClaimToFameIsClaimed = /*#__PURE__*/ createUseReadContract({
  abi: claimToFameAbi,
  functionName: 'isClaimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"isClaimedBatch"`
 */
export const useReadClaimToFameIsClaimedBatch =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'isClaimedBatch',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"owner"`
 */
export const useReadClaimToFameOwner = /*#__PURE__*/ createUseReadContract({
  abi: claimToFameAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 */
export const useReadClaimToFameOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"roleClaimPrimer"`
 */
export const useReadClaimToFameRoleClaimPrimer =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'roleClaimPrimer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"roleSigner"`
 */
export const useReadClaimToFameRoleSigner = /*#__PURE__*/ createUseReadContract(
  { abi: claimToFameAbi, functionName: 'roleSigner' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"roleTreasurer"`
 */
export const useReadClaimToFameRoleTreasurer =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'roleTreasurer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"rolesOf"`
 */
export const useReadClaimToFameRolesOf = /*#__PURE__*/ createUseReadContract({
  abi: claimToFameAbi,
  functionName: 'rolesOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"signatureNonces"`
 */
export const useReadClaimToFameSignatureNonces =
  /*#__PURE__*/ createUseReadContract({
    abi: claimToFameAbi,
    functionName: 'signatureNonces',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__
 */
export const useWriteClaimToFame = /*#__PURE__*/ createUseWriteContract({
  abi: claimToFameAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useWriteClaimToFameCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"claimWithData"`
 */
export const useWriteClaimToFameClaimWithData =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'claimWithData',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"claimWithTokens"`
 */
export const useWriteClaimToFameClaimWithTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'claimWithTokens',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useWriteClaimToFameCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useWriteClaimToFameGrantRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"primeClaim"`
 */
export const useWriteClaimToFamePrimeClaim =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'primeClaim',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"primeClaimWithData"`
 */
export const useWriteClaimToFamePrimeClaimWithData =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'primeClaimWithData',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteClaimToFameRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useWriteClaimToFameRenounceRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useWriteClaimToFameRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useWriteClaimToFameRevokeRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"setSigner"`
 */
export const useWriteClaimToFameSetSigner =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'setSigner',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteClaimToFameTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"verifyClaimDataRequest"`
 */
export const useWriteClaimToFameVerifyClaimDataRequest =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'verifyClaimDataRequest',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"verifyClaimTokensRequest"`
 */
export const useWriteClaimToFameVerifyClaimTokensRequest =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'verifyClaimTokensRequest',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"withdrawErc20"`
 */
export const useWriteClaimToFameWithdrawErc20 =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'withdrawErc20',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"withdrawEth"`
 */
export const useWriteClaimToFameWithdrawEth =
  /*#__PURE__*/ createUseWriteContract({
    abi: claimToFameAbi,
    functionName: 'withdrawEth',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__
 */
export const useSimulateClaimToFame = /*#__PURE__*/ createUseSimulateContract({
  abi: claimToFameAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useSimulateClaimToFameCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"claimWithData"`
 */
export const useSimulateClaimToFameClaimWithData =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'claimWithData',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"claimWithTokens"`
 */
export const useSimulateClaimToFameClaimWithTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'claimWithTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useSimulateClaimToFameCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useSimulateClaimToFameGrantRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"primeClaim"`
 */
export const useSimulateClaimToFamePrimeClaim =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'primeClaim',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"primeClaimWithData"`
 */
export const useSimulateClaimToFamePrimeClaimWithData =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'primeClaimWithData',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateClaimToFameRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useSimulateClaimToFameRenounceRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useSimulateClaimToFameRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useSimulateClaimToFameRevokeRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"setSigner"`
 */
export const useSimulateClaimToFameSetSigner =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'setSigner',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateClaimToFameTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"verifyClaimDataRequest"`
 */
export const useSimulateClaimToFameVerifyClaimDataRequest =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'verifyClaimDataRequest',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"verifyClaimTokensRequest"`
 */
export const useSimulateClaimToFameVerifyClaimTokensRequest =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'verifyClaimTokensRequest',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"withdrawErc20"`
 */
export const useSimulateClaimToFameWithdrawErc20 =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'withdrawErc20',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link claimToFameAbi}__ and `functionName` set to `"withdrawEth"`
 */
export const useSimulateClaimToFameWithdrawEth =
  /*#__PURE__*/ createUseSimulateContract({
    abi: claimToFameAbi,
    functionName: 'withdrawEth',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link claimToFameAbi}__
 */
export const useWatchClaimToFameEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: claimToFameAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link claimToFameAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 */
export const useWatchClaimToFameOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: claimToFameAbi,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link claimToFameAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 */
export const useWatchClaimToFameOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: claimToFameAbi,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link claimToFameAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchClaimToFameOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: claimToFameAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link claimToFameAbi}__ and `eventName` set to `"RolesUpdated"`
 */
export const useWatchClaimToFameRolesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: claimToFameAbi,
    eventName: 'RolesUpdated',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__
 */
export const useReadCreatorArtistMagic = /*#__PURE__*/ createUseReadContract({
  abi: creatorArtistMagicAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"artPoolEndIndex"`
 */
export const useReadCreatorArtistMagicArtPoolEndIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'artPoolEndIndex',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"artPoolNext"`
 */
export const useReadCreatorArtistMagicArtPoolNext =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'artPoolNext',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"artPoolStartIndex"`
 */
export const useReadCreatorArtistMagicArtPoolStartIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'artPoolStartIndex',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"childRenderer"`
 */
export const useReadCreatorArtistMagicChildRenderer =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'childRenderer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"fame"`
 */
export const useReadCreatorArtistMagicFame =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'fame',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"getMaxNFTSupply"`
 */
export const useReadCreatorArtistMagicGetMaxNftSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'getMaxNFTSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"getMetadataById"`
 */
export const useReadCreatorArtistMagicGetMetadataById =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'getMetadataById',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"getMintPoolEnd"`
 */
export const useReadCreatorArtistMagicGetMintPoolEnd =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'getMintPoolEnd',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"getMintPoolStart"`
 */
export const useReadCreatorArtistMagicGetMintPoolStart =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'getMintPoolStart',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"getNextMetadataId"`
 */
export const useReadCreatorArtistMagicGetNextMetadataId =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'getNextMetadataId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"getTokenMetadataId"`
 */
export const useReadCreatorArtistMagicGetTokenMetadataId =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'getTokenMetadataId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"getTotalNFTSupply"`
 */
export const useReadCreatorArtistMagicGetTotalNftSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'getTotalNFTSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"hasAllRoles"`
 */
export const useReadCreatorArtistMagicHasAllRoles =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'hasAllRoles',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"hasAnyRole"`
 */
export const useReadCreatorArtistMagicHasAnyRole =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'hasAnyRole',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"isTokenInBurnedPool"`
 */
export const useReadCreatorArtistMagicIsTokenInBurnedPool =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'isTokenInBurnedPool',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"isTokenInEndOfMintPool"`
 */
export const useReadCreatorArtistMagicIsTokenInEndOfMintPool =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'isTokenInEndOfMintPool',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"isTokenInMintPool"`
 */
export const useReadCreatorArtistMagicIsTokenInMintPool =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'isTokenInMintPool',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"metadataRegistry"`
 */
export const useReadCreatorArtistMagicMetadataRegistry =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'metadataRegistry',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"nextTokenId"`
 */
export const useReadCreatorArtistMagicNextTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'nextTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"owner"`
 */
export const useReadCreatorArtistMagicOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'owner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 */
export const useReadCreatorArtistMagicOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"rolesOf"`
 */
export const useReadCreatorArtistMagicRolesOf =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'rolesOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"tokenURI"`
 */
export const useReadCreatorArtistMagicTokenUri =
  /*#__PURE__*/ createUseReadContract({
    abi: creatorArtistMagicAbi,
    functionName: 'tokenURI',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__
 */
export const useWriteCreatorArtistMagic = /*#__PURE__*/ createUseWriteContract({
  abi: creatorArtistMagicAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"banishToArtPool"`
 */
export const useWriteCreatorArtistMagicBanishToArtPool =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'banishToArtPool',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"banishToBurnPool"`
 */
export const useWriteCreatorArtistMagicBanishToBurnPool =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'banishToBurnPool',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"banishToEndOfMintPool"`
 */
export const useWriteCreatorArtistMagicBanishToEndOfMintPool =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'banishToEndOfMintPool',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"banishToMintPool"`
 */
export const useWriteCreatorArtistMagicBanishToMintPool =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'banishToMintPool',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useWriteCreatorArtistMagicCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useWriteCreatorArtistMagicCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useWriteCreatorArtistMagicEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useWriteCreatorArtistMagicEmitMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useWriteCreatorArtistMagicGrantRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteCreatorArtistMagicRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useWriteCreatorArtistMagicRenounceRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useWriteCreatorArtistMagicRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useWriteCreatorArtistMagicRevokeRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteCreatorArtistMagicTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"updateChildRenderer"`
 */
export const useWriteCreatorArtistMagicUpdateChildRenderer =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'updateChildRenderer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"updateMetadata"`
 */
export const useWriteCreatorArtistMagicUpdateMetadata =
  /*#__PURE__*/ createUseWriteContract({
    abi: creatorArtistMagicAbi,
    functionName: 'updateMetadata',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__
 */
export const useSimulateCreatorArtistMagic =
  /*#__PURE__*/ createUseSimulateContract({ abi: creatorArtistMagicAbi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"banishToArtPool"`
 */
export const useSimulateCreatorArtistMagicBanishToArtPool =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'banishToArtPool',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"banishToBurnPool"`
 */
export const useSimulateCreatorArtistMagicBanishToBurnPool =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'banishToBurnPool',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"banishToEndOfMintPool"`
 */
export const useSimulateCreatorArtistMagicBanishToEndOfMintPool =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'banishToEndOfMintPool',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"banishToMintPool"`
 */
export const useSimulateCreatorArtistMagicBanishToMintPool =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'banishToMintPool',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useSimulateCreatorArtistMagicCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useSimulateCreatorArtistMagicCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useSimulateCreatorArtistMagicEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useSimulateCreatorArtistMagicEmitMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useSimulateCreatorArtistMagicGrantRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateCreatorArtistMagicRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useSimulateCreatorArtistMagicRenounceRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useSimulateCreatorArtistMagicRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useSimulateCreatorArtistMagicRevokeRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateCreatorArtistMagicTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"updateChildRenderer"`
 */
export const useSimulateCreatorArtistMagicUpdateChildRenderer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'updateChildRenderer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `functionName` set to `"updateMetadata"`
 */
export const useSimulateCreatorArtistMagicUpdateMetadata =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creatorArtistMagicAbi,
    functionName: 'updateMetadata',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link creatorArtistMagicAbi}__
 */
export const useWatchCreatorArtistMagicEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: creatorArtistMagicAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 */
export const useWatchCreatorArtistMagicOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: creatorArtistMagicAbi,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 */
export const useWatchCreatorArtistMagicOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: creatorArtistMagicAbi,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchCreatorArtistMagicOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: creatorArtistMagicAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link creatorArtistMagicAbi}__ and `eventName` set to `"RolesUpdated"`
 */
export const useWatchCreatorArtistMagicRolesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: creatorArtistMagicAbi,
    eventName: 'RolesUpdated',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNaming = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingDomainSeparator =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'DOMAIN_SEPARATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"MAX_COMMIT_AGE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingMaxCommitAge = /*#__PURE__*/ createUseReadContract(
  {
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'MAX_COMMIT_AGE',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"MAX_NAME_LENGTH"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingMaxNameLength =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'MAX_NAME_LENGTH',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"MIN_COMMIT_AGE"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingMinCommitAge = /*#__PURE__*/ createUseReadContract(
  {
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'MIN_COMMIT_AGE',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"addressToTokenId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingAddressToTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'addressToTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingApprove = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"baseTokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingBaseTokenUri = /*#__PURE__*/ createUseReadContract(
  {
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'baseTokenURI',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"buildAddVerifiedAddressDigest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingBuildAddVerifiedAddressDigest =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'buildAddVerifiedAddressDigest',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"checkNameNotClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingCheckNameNotClaimed =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'checkNameNotClaimed',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"commitments"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingCommitments = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'commitments',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"gateNft"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingGateNft = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'gateNft',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"gateTokenIdToIdentityTokenId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingGateTokenIdToIdentityTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'gateTokenIdToIdentityTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"getApproved"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingGetApproved = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'getApproved',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"getCommitment"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingGetCommitment =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'getCommitment',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"getIdentity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingGetIdentity = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'getIdentity',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"getMetadata"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingGetMetadata = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'getMetadata',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"getMetadataKeys"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingGetMetadataKeys =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'getMetadataKeys',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"getVerifiedAddresses"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingGetVerifiedAddresses =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'getVerifiedAddresses',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"hasAllRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingHasAllRoles = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'hasAllRoles',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"hasAnyRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingHasAnyRole = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'hasAnyRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"hasGateNFT"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingHasGateNft = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'hasGateNFT',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"hashName"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingHashName = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'hashName',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"identities"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingIdentities = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'identities',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"isVerified"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingIsVerified = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'isVerified',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"makeCommitment"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingMakeCommitment =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'makeCommitment',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingName = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"nameHashToTokenId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingNameHashToTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'nameHashToTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"nextTokenId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingNextTokenId = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'nextTokenId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"nonces"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingNonces = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'nonces',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingOwner = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"ownerOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"renderer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingRenderer = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'renderer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"resolveByNameHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingResolveByNameHash =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'resolveByNameHash',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"resolveName"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingResolveName = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'resolveName',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"resolvePrimaryByGateTokenId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingResolvePrimaryByGateTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'resolvePrimaryByGateTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"resolvePrimaryByName"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingResolvePrimaryByName =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'resolvePrimaryByName',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"roleMeadata"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingRoleMeadata = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'roleMeadata',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"roleMetadataAdmin"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingRoleMetadataAdmin =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'roleMetadataAdmin',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"roleMetadataUpdater"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingRoleMetadataUpdater =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'roleMetadataUpdater',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"rolesOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingRolesOf = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'rolesOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingSafeTransferFrom =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingSetApprovalForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingSymbol = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"tokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useReadFlsNamingTransferFrom = /*#__PURE__*/ createUseReadContract(
  {
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'transferFrom',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNaming = /*#__PURE__*/ createUseWriteContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"addVerifiedAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingAddVerifiedAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'addVerifiedAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"claimName"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingClaimName = /*#__PURE__*/ createUseWriteContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'claimName',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"commitName"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingCommitName = /*#__PURE__*/ createUseWriteContract(
  { abi: flsNamingAbi, address: flsNamingAddress, functionName: 'commitName' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"deleteMetadata"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingDeleteMetadata =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'deleteMetadata',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingEmitMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"grantRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingGrantRoles = /*#__PURE__*/ createUseWriteContract(
  { abi: flsNamingAbi, address: flsNamingAddress, functionName: 'grantRoles' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"removeVerifiedAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingRemoveVerifiedAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'removeVerifiedAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"renounceRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingRenounceRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"revokeRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingRevokeRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setBaseTokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingSetBaseTokenUri =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setBaseTokenURI',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setMetadata"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingSetMetadata =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setMetadata',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setMetadataBatch"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingSetMetadataBatch =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setMetadataBatch',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setPrimaryAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingSetPrimaryAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setPrimaryAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setPrimaryTokenId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingSetPrimaryTokenId =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setPrimaryTokenId',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setRenderer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingSetRenderer =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setRenderer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"sync"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingSync = /*#__PURE__*/ createUseWriteContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
  functionName: 'sync',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWriteFlsNamingTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNaming = /*#__PURE__*/ createUseSimulateContract({
  abi: flsNamingAbi,
  address: flsNamingAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"addVerifiedAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingAddVerifiedAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'addVerifiedAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"claimName"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingClaimName =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'claimName',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"commitName"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingCommitName =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'commitName',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"deleteMetadata"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingDeleteMetadata =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'deleteMetadata',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingEmitMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"grantRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingGrantRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"removeVerifiedAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingRemoveVerifiedAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'removeVerifiedAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"renounceRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingRenounceRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"revokeRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingRevokeRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setBaseTokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingSetBaseTokenUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setBaseTokenURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setMetadata"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingSetMetadata =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setMetadata',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setMetadataBatch"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingSetMetadataBatch =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setMetadataBatch',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setPrimaryAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingSetPrimaryAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setPrimaryAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setPrimaryTokenId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingSetPrimaryTokenId =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setPrimaryTokenId',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"setRenderer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingSetRenderer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'setRenderer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"sync"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingSync = /*#__PURE__*/ createUseSimulateContract(
  { abi: flsNamingAbi, address: flsNamingAddress, functionName: 'sync' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link flsNamingAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useSimulateFlsNamingTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: flsNamingAbi, address: flsNamingAddress },
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"BatchMetadataUpdate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingBatchMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'BatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"IdentitySynced"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingIdentitySyncedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'IdentitySynced',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"MetadataDeleted"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingMetadataDeletedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'MetadataDeleted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"MetadataUpdate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'MetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"MetadataUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingMetadataUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'MetadataUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"NameClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingNameClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'NameClaimed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"NameCommitted"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingNameCommittedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'NameCommitted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"PrimaryAddressChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingPrimaryAddressChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'PrimaryAddressChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"PrimaryTokenIdChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingPrimaryTokenIdChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'PrimaryTokenIdChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"RolesUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingRolesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'RolesUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"VerifiedAddressAdded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingVerifiedAddressAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'VerifiedAddressAdded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link flsNamingAbi}__ and `eventName` set to `"VerifiedAddressRemoved"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xaE21fEF5E74B7Ec887704023EC13F412983Eb304)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9bf1E5dA76e5f62cfA843BA19A887578A341f674)
 */
export const useWatchFlsNamingVerifiedAddressRemovedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: flsNamingAbi,
    address: flsNamingAddress,
    eventName: 'VerifiedAddressRemoved',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__
 */
export const useReadFunknlove = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"FLS_EXODUS_ROAD_DONATION_ADDRESS"`
 */
export const useReadFunknloveFlsExodusRoadDonationAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'FLS_EXODUS_ROAD_DONATION_ADDRESS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"FLS_VAULT_ADDRESS"`
 */
export const useReadFunknloveFlsVaultAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'FLS_VAULT_ADDRESS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadFunknloveBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"balanceOfBatch"`
 */
export const useReadFunknloveBalanceOfBatch =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'balanceOfBatch',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"getBronzePrice"`
 */
export const useReadFunknloveGetBronzePrice =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'getBronzePrice',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"getBronzeSupply"`
 */
export const useReadFunknloveGetBronzeSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'getBronzeSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"getEndTime"`
 */
export const useReadFunknloveGetEndTime = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'getEndTime',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"getGoldPrice"`
 */
export const useReadFunknloveGetGoldPrice = /*#__PURE__*/ createUseReadContract(
  { abi: funknloveAbi, functionName: 'getGoldPrice' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"getGoldSupply"`
 */
export const useReadFunknloveGetGoldSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'getGoldSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"getSilverPrice"`
 */
export const useReadFunknloveGetSilverPrice =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'getSilverPrice',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"getSilverSupply"`
 */
export const useReadFunknloveGetSilverSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'getSilverSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"getStartTime"`
 */
export const useReadFunknloveGetStartTime = /*#__PURE__*/ createUseReadContract(
  { abi: funknloveAbi, functionName: 'getStartTime' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"hasAllRoles"`
 */
export const useReadFunknloveHasAllRoles = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'hasAllRoles',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"hasAnyRole"`
 */
export const useReadFunknloveHasAnyRole = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'hasAnyRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"isApprovedForAll"`
 */
export const useReadFunknloveIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"isMintOpen"`
 */
export const useReadFunknloveIsMintOpen = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'isMintOpen',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"mintPrice"`
 */
export const useReadFunknloveMintPrice = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'mintPrice',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"name"`
 */
export const useReadFunknloveName = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"owner"`
 */
export const useReadFunknloveOwner = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 */
export const useReadFunknloveOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"rolesOf"`
 */
export const useReadFunknloveRolesOf = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'rolesOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadFunknloveSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: funknloveAbi,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadFunknloveSymbol = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadFunknloveTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"uri"`
 */
export const useReadFunknloveUri = /*#__PURE__*/ createUseReadContract({
  abi: funknloveAbi,
  functionName: 'uri',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__
 */
export const useWriteFunknlove = /*#__PURE__*/ createUseWriteContract({
  abi: funknloveAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"airdropMint"`
 */
export const useWriteFunknloveAirdropMint =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'airdropMint',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useWriteFunknloveCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useWriteFunknloveCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"emergencyWithdraw"`
 */
export const useWriteFunknloveEmergencyWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'emergencyWithdraw',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useWriteFunknloveGrantRoles = /*#__PURE__*/ createUseWriteContract(
  { abi: funknloveAbi, functionName: 'grantRoles' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"publicMint"`
 */
export const useWriteFunknlovePublicMint = /*#__PURE__*/ createUseWriteContract(
  { abi: funknloveAbi, functionName: 'publicMint' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteFunknloveRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useWriteFunknloveRenounceRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useWriteFunknloveRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useWriteFunknloveRevokeRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"safeBatchTransferFrom"`
 */
export const useWriteFunknloveSafeBatchTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'safeBatchTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useWriteFunknloveSafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useWriteFunknloveSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"setBaseURI"`
 */
export const useWriteFunknloveSetBaseUri = /*#__PURE__*/ createUseWriteContract(
  { abi: funknloveAbi, functionName: 'setBaseURI' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"setEndTime"`
 */
export const useWriteFunknloveSetEndTime = /*#__PURE__*/ createUseWriteContract(
  { abi: funknloveAbi, functionName: 'setEndTime' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"setStartTime"`
 */
export const useWriteFunknloveSetStartTime =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'setStartTime',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteFunknloveTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"withdrawFLSExodusRoadDonation"`
 */
export const useWriteFunknloveWithdrawFlsExodusRoadDonation =
  /*#__PURE__*/ createUseWriteContract({
    abi: funknloveAbi,
    functionName: 'withdrawFLSExodusRoadDonation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__
 */
export const useSimulateFunknlove = /*#__PURE__*/ createUseSimulateContract({
  abi: funknloveAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"airdropMint"`
 */
export const useSimulateFunknloveAirdropMint =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'airdropMint',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useSimulateFunknloveCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useSimulateFunknloveCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"emergencyWithdraw"`
 */
export const useSimulateFunknloveEmergencyWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'emergencyWithdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useSimulateFunknloveGrantRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"publicMint"`
 */
export const useSimulateFunknlovePublicMint =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'publicMint',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateFunknloveRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useSimulateFunknloveRenounceRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useSimulateFunknloveRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useSimulateFunknloveRevokeRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"safeBatchTransferFrom"`
 */
export const useSimulateFunknloveSafeBatchTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'safeBatchTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useSimulateFunknloveSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useSimulateFunknloveSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"setBaseURI"`
 */
export const useSimulateFunknloveSetBaseUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'setBaseURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"setEndTime"`
 */
export const useSimulateFunknloveSetEndTime =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'setEndTime',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"setStartTime"`
 */
export const useSimulateFunknloveSetStartTime =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'setStartTime',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateFunknloveTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link funknloveAbi}__ and `functionName` set to `"withdrawFLSExodusRoadDonation"`
 */
export const useSimulateFunknloveWithdrawFlsExodusRoadDonation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: funknloveAbi,
    functionName: 'withdrawFLSExodusRoadDonation',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link funknloveAbi}__
 */
export const useWatchFunknloveEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: funknloveAbi },
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link funknloveAbi}__ and `eventName` set to `"ApprovalForAll"`
 */
export const useWatchFunknloveApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: funknloveAbi,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link funknloveAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 */
export const useWatchFunknloveOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: funknloveAbi,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link funknloveAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 */
export const useWatchFunknloveOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: funknloveAbi,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link funknloveAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchFunknloveOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: funknloveAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link funknloveAbi}__ and `eventName` set to `"RolesUpdated"`
 */
export const useWatchFunknloveRolesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: funknloveAbi,
    eventName: 'RolesUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link funknloveAbi}__ and `eventName` set to `"TransferBatch"`
 */
export const useWatchFunknloveTransferBatchEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: funknloveAbi,
    eventName: 'TransferBatch',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link funknloveAbi}__ and `eventName` set to `"TransferSingle"`
 */
export const useWatchFunknloveTransferSingleEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: funknloveAbi,
    eventName: 'TransferSingle',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link funknloveAbi}__ and `eventName` set to `"URI"`
 */
export const useWatchFunknloveUriEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: funknloveAbi,
    eventName: 'URI',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__
 */
export const useReadFame = /*#__PURE__*/ createUseReadContract({ abi: fameAbi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"allowance"`
 */
export const useReadFameAllowance = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadFameBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"burnedPoolManager"`
 */
export const useReadFameBurnedPoolManager = /*#__PURE__*/ createUseReadContract(
  { abi: fameAbi, functionName: 'burnedPoolManager' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"decimals"`
 */
export const useReadFameDecimals = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"fameMirror"`
 */
export const useReadFameFameMirror = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'fameMirror',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"getSkipNFT"`
 */
export const useReadFameGetSkipNft = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'getSkipNFT',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"hasAllRoles"`
 */
export const useReadFameHasAllRoles = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'hasAllRoles',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"hasAnyRole"`
 */
export const useReadFameHasAnyRole = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'hasAnyRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"mirrorERC721"`
 */
export const useReadFameMirrorErc721 = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'mirrorERC721',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"name"`
 */
export const useReadFameName = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"owner"`
 */
export const useReadFameOwner = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 */
export const useReadFameOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: fameAbi,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"renderer"`
 */
export const useReadFameRenderer = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'renderer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"rolesOf"`
 */
export const useReadFameRolesOf = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'rolesOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadFameSymbol = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadFameTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"unit"`
 */
export const useReadFameUnit = /*#__PURE__*/ createUseReadContract({
  abi: fameAbi,
  functionName: 'unit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__
 */
export const useWriteFame = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteFameApprove = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useWriteFameCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useWriteFameCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useWriteFameEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useWriteFameEmitMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useWriteFameGrantRoles = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'grantRoles',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"launchPublic"`
 */
export const useWriteFameLaunchPublic = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'launchPublic',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteFameRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useWriteFameRenounceRoles = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'renounceRoles',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useWriteFameRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useWriteFameRevokeRoles = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'revokeRoles',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"setBurnedPoolManager"`
 */
export const useWriteFameSetBurnedPoolManager =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameAbi,
    functionName: 'setBurnedPoolManager',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"setRenderer"`
 */
export const useWriteFameSetRenderer = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'setRenderer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"setSkipNFT"`
 */
export const useWriteFameSetSkipNft = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'setSkipNFT',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"setSkipNftForAccount"`
 */
export const useWriteFameSetSkipNftForAccount =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameAbi,
    functionName: 'setSkipNftForAccount',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteFameTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteFameTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteFameTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"withdraw"`
 */
export const useWriteFameWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: fameAbi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__
 */
export const useSimulateFame = /*#__PURE__*/ createUseSimulateContract({
  abi: fameAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateFameApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: fameAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useSimulateFameCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useSimulateFameCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useSimulateFameEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useSimulateFameEmitMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useSimulateFameGrantRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"launchPublic"`
 */
export const useSimulateFameLaunchPublic =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'launchPublic',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateFameRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useSimulateFameRenounceRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useSimulateFameRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useSimulateFameRevokeRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"setBurnedPoolManager"`
 */
export const useSimulateFameSetBurnedPoolManager =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'setBurnedPoolManager',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"setRenderer"`
 */
export const useSimulateFameSetRenderer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'setRenderer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"setSkipNFT"`
 */
export const useSimulateFameSetSkipNft =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'setSkipNFT',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"setSkipNftForAccount"`
 */
export const useSimulateFameSetSkipNftForAccount =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'setSkipNftForAccount',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateFameTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: fameAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateFameTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateFameTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameAbi}__ and `functionName` set to `"withdraw"`
 */
export const useSimulateFameWithdraw = /*#__PURE__*/ createUseSimulateContract({
  abi: fameAbi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameAbi}__
 */
export const useWatchFameEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: fameAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchFameApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameAbi,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 */
export const useWatchFameOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameAbi,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 */
export const useWatchFameOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameAbi,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchFameOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameAbi}__ and `eventName` set to `"RolesUpdated"`
 */
export const useWatchFameRolesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameAbi,
    eventName: 'RolesUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameAbi}__ and `eventName` set to `"SkipNFTSet"`
 */
export const useWatchFameSkipNftSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameAbi,
    eventName: 'SkipNFTSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchFameTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameAbi,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySociety = /*#__PURE__*/ createUseReadContract({
  abi: fameLadySocietyAbi,
  address: fameLadySocietyAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'DEFAULT_ADMIN_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"EMIT_METADATA_ROLE"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyEmitMetadataRole =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'EMIT_METADATA_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"OPERATOR_FILTER_REGISTRY"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyOperatorFilterRegistry =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'OPERATOR_FILTER_REGISTRY',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"TREASURER_ROLE"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyTreasurerRole =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'TREASURER_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"UPDATE_RENDERER_ROLE"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyUpdateRendererRole =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'UPDATE_RENDERER_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyBalanceOf =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'balanceOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"claimed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyClaimed =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'claimed',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"contractURI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyContractUri =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'contractURI',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"defaultRoyaltyInfo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyDefaultRoyaltyInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'defaultRoyaltyInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"getApproved"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyGetApproved =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'getApproved',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyGetRoleAdmin =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'getRoleAdmin',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"hasRole"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyHasRole =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'hasRole',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"isWrapped"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyIsWrapped =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'isWrapped',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyName = /*#__PURE__*/ createUseReadContract({
  abi: fameLadySocietyAbi,
  address: fameLadySocietyAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyOwner = /*#__PURE__*/ createUseReadContract({
  abi: fameLadySocietyAbi,
  address: fameLadySocietyAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"ownerOf"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyOwnerOf =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'ownerOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"pendingOwner"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyPendingOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'pendingOwner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"renderer"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyRenderer =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'renderer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"royaltyInfo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyRoyaltyInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'royaltyInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietySupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietySymbol = /*#__PURE__*/ createUseReadContract(
  {
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'symbol',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"tokenURI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyTokenUri =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'tokenURI',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"wrapCost"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyWrapCost =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'wrapCost',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"wrappedNft"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useReadFameLadySocietyWrappedNft =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'wrappedNft',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySociety = /*#__PURE__*/ createUseWriteContract({
  abi: fameLadySocietyAbi,
  address: fameLadySocietyAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyAcceptOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyApprove =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyEmitMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyGrantRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'grantRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"onERC721Received"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyOnErc721Received =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'onERC721Received',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyRenounceRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyRevokeRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietySafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietySetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setContractURI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietySetContractUri =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setContractURI',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietySetDefaultRoyalty =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setDefaultRoyalty',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setRenderer"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietySetRenderer =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setRenderer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setWrapCost"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietySetWrapCost =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setWrapCost',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"unwrap"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyUnwrap =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'unwrap',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"unwrapMany"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyUnwrapMany =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'unwrapMany',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"withdraw"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"wrap"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyWrap = /*#__PURE__*/ createUseWriteContract(
  {
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'wrap',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"wrapTo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWriteFameLadySocietyWrapTo =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'wrapTo',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySociety =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyAcceptOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyEmitMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'grantRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"onERC721Received"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyOnErc721Received =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'onERC721Received',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietySafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietySetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setContractURI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietySetContractUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setContractURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietySetDefaultRoyalty =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setDefaultRoyalty',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setRenderer"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietySetRenderer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setRenderer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"setWrapCost"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietySetWrapCost =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'setWrapCost',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"unwrap"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyUnwrap =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'unwrap',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"unwrapMany"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyUnwrapMany =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'unwrapMany',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"withdraw"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"wrap"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyWrap =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'wrap',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `functionName` set to `"wrapTo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useSimulateFameLadySocietyWrapTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    functionName: 'wrapTo',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"BatchMetadataUpdate"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyBatchMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'BatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"MetadataUpdate"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'MetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"OwnershipTransferStarted"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyOwnershipTransferStartedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'OwnershipTransferStarted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'RoleGranted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'RoleRevoked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySocietyAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574)
 */
export const useWatchFameLadySocietyTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySocietyAbi,
    address: fameLadySocietyAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquad = /*#__PURE__*/ createUseReadContract({
  abi: fameLadySquadAbi,
  address: fameLadySquadAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"MAX_LADY_SUPPLY"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadMaxLadySupply =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'MAX_LADY_SUPPLY',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"SALE_START_TIMESTAMP"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadSaleStartTimestamp =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'SALE_START_TIMESTAMP',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadBalanceOf =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'balanceOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"baseURI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadBaseUri = /*#__PURE__*/ createUseReadContract({
  abi: fameLadySquadAbi,
  address: fameLadySquadAddress,
  functionName: 'baseURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"getApproved"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadGetApproved =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'getApproved',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"getNFTPrice"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadGetNftPrice =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'getNFTPrice',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadName = /*#__PURE__*/ createUseReadContract({
  abi: fameLadySquadAbi,
  address: fameLadySquadAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadOwner = /*#__PURE__*/ createUseReadContract({
  abi: fameLadySquadAbi,
  address: fameLadySquadAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"ownerOf"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: fameLadySquadAbi,
  address: fameLadySquadAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadSymbol = /*#__PURE__*/ createUseReadContract({
  abi: fameLadySquadAbi,
  address: fameLadySquadAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"tokenByIndex"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadTokenByIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'tokenByIndex',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"tokenOfOwnerByIndex"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadTokenOfOwnerByIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'tokenOfOwnerByIndex',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"tokenURI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadTokenUri = /*#__PURE__*/ createUseReadContract(
  {
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'tokenURI',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"totalSupply"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useReadFameLadySquadTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'totalSupply',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquad = /*#__PURE__*/ createUseWriteContract({
  abi: fameLadySquadAbi,
  address: fameLadySquadAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquadApprove =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"changeBaseURI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquadChangeBaseUri =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'changeBaseURI',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"mintLady"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquadMintLady =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'mintLady',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquadRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquadSafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquadSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquadTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquadTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"withdraw"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWriteFameLadySquadWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquad = /*#__PURE__*/ createUseSimulateContract(
  { abi: fameLadySquadAbi, address: fameLadySquadAddress },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquadApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"changeBaseURI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquadChangeBaseUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'changeBaseURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"mintLady"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquadMintLady =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'mintLady',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquadRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquadSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquadSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquadTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquadTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameLadySquadAbi}__ and `functionName` set to `"withdraw"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useSimulateFameLadySquadWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySquadAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWatchFameLadySquadEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySquadAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWatchFameLadySquadApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySquadAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWatchFameLadySquadApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySquadAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWatchFameLadySquadOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameLadySquadAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47)
 */
export const useWatchFameLadySquadTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameLadySquadAbi,
    address: fameLadySquadAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__
 */
export const useReadFameMirror = /*#__PURE__*/ createUseReadContract({
  abi: fameMirrorAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadFameMirrorBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: fameMirrorAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"baseERC20"`
 */
export const useReadFameMirrorBaseErc20 = /*#__PURE__*/ createUseReadContract({
  abi: fameMirrorAbi,
  functionName: 'baseERC20',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"getApproved"`
 */
export const useReadFameMirrorGetApproved = /*#__PURE__*/ createUseReadContract(
  { abi: fameMirrorAbi, functionName: 'getApproved' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"isApprovedForAll"`
 */
export const useReadFameMirrorIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: fameMirrorAbi,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"name"`
 */
export const useReadFameMirrorName = /*#__PURE__*/ createUseReadContract({
  abi: fameMirrorAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"owner"`
 */
export const useReadFameMirrorOwner = /*#__PURE__*/ createUseReadContract({
  abi: fameMirrorAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"ownerAt"`
 */
export const useReadFameMirrorOwnerAt = /*#__PURE__*/ createUseReadContract({
  abi: fameMirrorAbi,
  functionName: 'ownerAt',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"ownerOf"`
 */
export const useReadFameMirrorOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: fameMirrorAbi,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadFameMirrorSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: fameMirrorAbi,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadFameMirrorSymbol = /*#__PURE__*/ createUseReadContract({
  abi: fameMirrorAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"tokenURI"`
 */
export const useReadFameMirrorTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: fameMirrorAbi,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadFameMirrorTotalSupply = /*#__PURE__*/ createUseReadContract(
  { abi: fameMirrorAbi, functionName: 'totalSupply' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameMirrorAbi}__
 */
export const useWriteFameMirror = /*#__PURE__*/ createUseWriteContract({
  abi: fameMirrorAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteFameMirrorApprove = /*#__PURE__*/ createUseWriteContract({
  abi: fameMirrorAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useWriteFameMirrorEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameMirrorAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useWriteFameMirrorEmitMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameMirrorAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"pullOwner"`
 */
export const useWriteFameMirrorPullOwner = /*#__PURE__*/ createUseWriteContract(
  { abi: fameMirrorAbi, functionName: 'pullOwner' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useWriteFameMirrorSafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameMirrorAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useWriteFameMirrorSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameMirrorAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteFameMirrorTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameMirrorAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameMirrorAbi}__
 */
export const useSimulateFameMirror = /*#__PURE__*/ createUseSimulateContract({
  abi: fameMirrorAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateFameMirrorApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameMirrorAbi,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useSimulateFameMirrorEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameMirrorAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useSimulateFameMirrorEmitMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameMirrorAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"pullOwner"`
 */
export const useSimulateFameMirrorPullOwner =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameMirrorAbi,
    functionName: 'pullOwner',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useSimulateFameMirrorSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameMirrorAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useSimulateFameMirrorSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameMirrorAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameMirrorAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateFameMirrorTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameMirrorAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameMirrorAbi}__
 */
export const useWatchFameMirrorEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: fameMirrorAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameMirrorAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchFameMirrorApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameMirrorAbi,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameMirrorAbi}__ and `eventName` set to `"ApprovalForAll"`
 */
export const useWatchFameMirrorApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameMirrorAbi,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameMirrorAbi}__ and `eventName` set to `"BatchMetadataUpdate"`
 */
export const useWatchFameMirrorBatchMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameMirrorAbi,
    eventName: 'BatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameMirrorAbi}__ and `eventName` set to `"MetadataUpdate"`
 */
export const useWatchFameMirrorMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameMirrorAbi,
    eventName: 'MetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameMirrorAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchFameMirrorOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameMirrorAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameMirrorAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchFameMirrorTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameMirrorAbi,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSale = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"canProve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleCanProve = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'canProve',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"fameBalanceOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleFameBalanceOf = /*#__PURE__*/ createUseReadContract(
  { abi: fameSaleAbi, address: fameSaleAddress, functionName: 'fameBalanceOf' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"fameSaleToken"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleFameSaleToken = /*#__PURE__*/ createUseReadContract(
  { abi: fameSaleAbi, address: fameSaleAddress, functionName: 'fameSaleToken' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"fameTotalSupply"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleFameTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'fameTotalSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"hasAllRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleHasAllRoles = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'hasAllRoles',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"hasAnyRole"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleHasAnyRole = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'hasAnyRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"isPaused"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleIsPaused = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'isPaused',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"maxBuy"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleMaxBuy = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'maxBuy',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"maxRaise"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleMaxRaise = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'maxRaise',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"merkleRoot"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleMerkleRoot = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'merkleRoot',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleOwner = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"raiseRemaining"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleRaiseRemaining =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'raiseRemaining',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"roleAllowlist"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleRoleAllowlist = /*#__PURE__*/ createUseReadContract(
  { abi: fameSaleAbi, address: fameSaleAddress, functionName: 'roleAllowlist' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"roleExecutive"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleRoleExecutive = /*#__PURE__*/ createUseReadContract(
  { abi: fameSaleAbi, address: fameSaleAddress, functionName: 'roleExecutive' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"roleTreasurer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleRoleTreasurer = /*#__PURE__*/ createUseReadContract(
  { abi: fameSaleAbi, address: fameSaleAddress, functionName: 'roleTreasurer' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"rolesOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useReadFameSaleRolesOf = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'rolesOf',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSale = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"buy"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleBuy = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'buy',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"grantRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleGrantRoles = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'grantRoles',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"pause"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSalePause = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'pause',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"refund"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleRefund = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'refund',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"renounceRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleRenounceRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"revokeRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleRevokeRoles = /*#__PURE__*/ createUseWriteContract(
  { abi: fameSaleAbi, address: fameSaleAddress, functionName: 'revokeRoles' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"setMaxBuy"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleSetMaxBuy = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'setMaxBuy',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"setMaxRaise"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleSetMaxRaise = /*#__PURE__*/ createUseWriteContract(
  { abi: fameSaleAbi, address: fameSaleAddress, functionName: 'setMaxRaise' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"setMerkleRoot"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleSetMerkleRoot =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'setMerkleRoot',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"unpause"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleUnpause = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'unpause',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"withdraw"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWriteFameSaleWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSale = /*#__PURE__*/ createUseSimulateContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"buy"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleBuy = /*#__PURE__*/ createUseSimulateContract({
  abi: fameSaleAbi,
  address: fameSaleAddress,
  functionName: 'buy',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"grantRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleGrantRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"pause"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSalePause = /*#__PURE__*/ createUseSimulateContract(
  { abi: fameSaleAbi, address: fameSaleAddress, functionName: 'pause' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"refund"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleRefund =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'refund',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"renounceRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleRenounceRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"revokeRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleRevokeRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"setMaxBuy"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleSetMaxBuy =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'setMaxBuy',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"setMaxRaise"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleSetMaxRaise =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'setMaxRaise',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"setMerkleRoot"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleSetMerkleRoot =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'setMerkleRoot',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"unpause"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleUnpause =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'unpause',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleAbi}__ and `functionName` set to `"withdraw"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useSimulateFameSaleWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWatchFameSaleEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: fameSaleAbi,
  address: fameSaleAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWatchFameSaleOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWatchFameSaleOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWatchFameSaleOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleAbi}__ and `eventName` set to `"RolesUpdated"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3)
 */
export const useWatchFameSaleRolesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleAbi,
    address: fameSaleAddress,
    eventName: 'RolesUpdated',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleToken = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenDomainSeparator =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'DOMAIN_SEPARATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"allowance"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenAllowance =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'allowance',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenBalanceOf =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'balanceOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"decimals"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenDecimals = /*#__PURE__*/ createUseReadContract(
  {
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'decimals',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"hasAllRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenHasAllRoles =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'hasAllRoles',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"hasAnyRole"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenHasAnyRole =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'hasAnyRole',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"hasHolder"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenHasHolder =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'hasHolder',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"holders"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenHolders = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
  functionName: 'holders',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenName = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"nonces"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenNonces = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
  functionName: 'nonces',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenOwner = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"roleBurner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenRoleBurner =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'roleBurner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"roleController"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenRoleController =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'roleController',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"roleMinter"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenRoleMinter =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'roleMinter',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"rolesOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenRolesOf = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
  functionName: 'rolesOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenSymbol = /*#__PURE__*/ createUseReadContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"totalSupply"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useReadFameSaleTokenTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'totalSupply',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleToken = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenApprove =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"burn"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenBurn = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
  functionName: 'burn',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"grantRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenGrantRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenMint = /*#__PURE__*/ createUseWriteContract({
  abi: fameSaleTokenAbi,
  address: fameSaleTokenAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenPermit = /*#__PURE__*/ createUseWriteContract(
  {
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'permit',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"renounceRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenRenounceRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"revokeRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenRevokeRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenTransfer =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWriteFameSaleTokenTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleToken = /*#__PURE__*/ createUseSimulateContract(
  { abi: fameSaleTokenAbi, address: fameSaleTokenAddress },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"burn"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenBurn =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'burn',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"grantRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenGrantRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenMint =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'mint',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenPermit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'permit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"renounceRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenRenounceRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"revokeRoles"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenRevokeRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useSimulateFameSaleTokenTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleTokenAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWatchFameSaleTokenEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWatchFameSaleTokenApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWatchFameSaleTokenOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWatchFameSaleTokenOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWatchFameSaleTokenOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `eventName` set to `"RolesUpdated"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWatchFameSaleTokenRolesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    eventName: 'RolesUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameSaleTokenAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x233A9630e1fC80688E5cc2bb988836e0D5034328)
 */
export const useWatchFameSaleTokenTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameSaleTokenAbi,
    address: fameSaleTokenAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__
 */
export const useReadFameVesting = /*#__PURE__*/ createUseReadContract({
  abi: fameVestingAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"computeNextVestingScheduleIdForHolder"`
 */
export const useReadFameVestingComputeNextVestingScheduleIdForHolder =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'computeNextVestingScheduleIdForHolder',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"computeReleasableAmount"`
 */
export const useReadFameVestingComputeReleasableAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'computeReleasableAmount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"computeVestingScheduleIdForAddressAndIndex"`
 */
export const useReadFameVestingComputeVestingScheduleIdForAddressAndIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'computeVestingScheduleIdForAddressAndIndex',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"getLastVestingScheduleForHolder"`
 */
export const useReadFameVestingGetLastVestingScheduleForHolder =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'getLastVestingScheduleForHolder',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"getToken"`
 */
export const useReadFameVestingGetToken = /*#__PURE__*/ createUseReadContract({
  abi: fameVestingAbi,
  functionName: 'getToken',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"getVestingIdAtIndex"`
 */
export const useReadFameVestingGetVestingIdAtIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'getVestingIdAtIndex',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"getVestingSchedule"`
 */
export const useReadFameVestingGetVestingSchedule =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'getVestingSchedule',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"getVestingScheduleByAddressAndIndex"`
 */
export const useReadFameVestingGetVestingScheduleByAddressAndIndex =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'getVestingScheduleByAddressAndIndex',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"getVestingSchedulesCount"`
 */
export const useReadFameVestingGetVestingSchedulesCount =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'getVestingSchedulesCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"getVestingSchedulesCountByBeneficiary"`
 */
export const useReadFameVestingGetVestingSchedulesCountByBeneficiary =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'getVestingSchedulesCountByBeneficiary',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"getVestingSchedulesTotalAmount"`
 */
export const useReadFameVestingGetVestingSchedulesTotalAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'getVestingSchedulesTotalAmount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"getWithdrawableAmount"`
 */
export const useReadFameVestingGetWithdrawableAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: fameVestingAbi,
    functionName: 'getWithdrawableAmount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"owner"`
 */
export const useReadFameVestingOwner = /*#__PURE__*/ createUseReadContract({
  abi: fameVestingAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameVestingAbi}__
 */
export const useWriteFameVesting = /*#__PURE__*/ createUseWriteContract({
  abi: fameVestingAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"createVestingSchedule"`
 */
export const useWriteFameVestingCreateVestingSchedule =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameVestingAbi,
    functionName: 'createVestingSchedule',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"release"`
 */
export const useWriteFameVestingRelease = /*#__PURE__*/ createUseWriteContract({
  abi: fameVestingAbi,
  functionName: 'release',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"revoke"`
 */
export const useWriteFameVestingRevoke = /*#__PURE__*/ createUseWriteContract({
  abi: fameVestingAbi,
  functionName: 'revoke',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteFameVestingTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: fameVestingAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"withdraw"`
 */
export const useWriteFameVestingWithdraw = /*#__PURE__*/ createUseWriteContract(
  { abi: fameVestingAbi, functionName: 'withdraw' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameVestingAbi}__
 */
export const useSimulateFameVesting = /*#__PURE__*/ createUseSimulateContract({
  abi: fameVestingAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"createVestingSchedule"`
 */
export const useSimulateFameVestingCreateVestingSchedule =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameVestingAbi,
    functionName: 'createVestingSchedule',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"release"`
 */
export const useSimulateFameVestingRelease =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameVestingAbi,
    functionName: 'release',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"revoke"`
 */
export const useSimulateFameVestingRevoke =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameVestingAbi,
    functionName: 'revoke',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateFameVestingTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameVestingAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link fameVestingAbi}__ and `functionName` set to `"withdraw"`
 */
export const useSimulateFameVestingWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: fameVestingAbi,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameVestingAbi}__
 */
export const useWatchFameVestingEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: fameVestingAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link fameVestingAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchFameVestingOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: fameVestingAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__
 */
export const useReadGovSociety = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"CLOCK_MODE"`
 */
export const useReadGovSocietyClockMode = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'CLOCK_MODE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 */
export const useReadGovSocietyDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'DEFAULT_ADMIN_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"RENDERER_ROLE"`
 */
export const useReadGovSocietyRendererRole =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'RENDERER_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"TOKEN_URI_GENERATOR_ROLE"`
 */
export const useReadGovSocietyTokenUriGeneratorRole =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'TOKEN_URI_GENERATOR_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadGovSocietyBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"clock"`
 */
export const useReadGovSocietyClock = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'clock',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"delegates"`
 */
export const useReadGovSocietyDelegates = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'delegates',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"eip712Domain"`
 */
export const useReadGovSocietyEip712Domain =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'eip712Domain',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"getApproved"`
 */
export const useReadGovSocietyGetApproved = /*#__PURE__*/ createUseReadContract(
  { abi: govSocietyAbi, functionName: 'getApproved' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"getPastTotalSupply"`
 */
export const useReadGovSocietyGetPastTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'getPastTotalSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"getPastVotes"`
 */
export const useReadGovSocietyGetPastVotes =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'getPastVotes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"getRoleAdmin"`
 */
export const useReadGovSocietyGetRoleAdmin =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'getRoleAdmin',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"getVotes"`
 */
export const useReadGovSocietyGetVotes = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'getVotes',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"guardianForTokenId"`
 */
export const useReadGovSocietyGuardianForTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'guardianForTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"hasRole"`
 */
export const useReadGovSocietyHasRole = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"isApprovedForAll"`
 */
export const useReadGovSocietyIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"isLocked"`
 */
export const useReadGovSocietyIsLocked = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'isLocked',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"lockedTokenCount"`
 */
export const useReadGovSocietyLockedTokenCount =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'lockedTokenCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"name"`
 */
export const useReadGovSocietyName = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"nonces"`
 */
export const useReadGovSocietyNonces = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'nonces',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"ownerOf"`
 */
export const useReadGovSocietyOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"renderer"`
 */
export const useReadGovSocietyRenderer = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'renderer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadGovSocietySupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: govSocietyAbi,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadGovSocietySymbol = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"tokenURI"`
 */
export const useReadGovSocietyTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadGovSocietyTotalSupply = /*#__PURE__*/ createUseReadContract(
  { abi: govSocietyAbi, functionName: 'totalSupply' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"underlying"`
 */
export const useReadGovSocietyUnderlying = /*#__PURE__*/ createUseReadContract({
  abi: govSocietyAbi,
  functionName: 'underlying',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__
 */
export const useWriteGovSociety = /*#__PURE__*/ createUseWriteContract({
  abi: govSocietyAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteGovSocietyApprove = /*#__PURE__*/ createUseWriteContract({
  abi: govSocietyAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"delegate"`
 */
export const useWriteGovSocietyDelegate = /*#__PURE__*/ createUseWriteContract({
  abi: govSocietyAbi,
  functionName: 'delegate',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"delegateBySig"`
 */
export const useWriteGovSocietyDelegateBySig =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'delegateBySig',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"depositFor"`
 */
export const useWriteGovSocietyDepositFor =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'depositFor',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useWriteGovSocietyEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useWriteGovSocietyEmitMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"grantRole"`
 */
export const useWriteGovSocietyGrantRole = /*#__PURE__*/ createUseWriteContract(
  { abi: govSocietyAbi, functionName: 'grantRole' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"lock"`
 */
export const useWriteGovSocietyLock = /*#__PURE__*/ createUseWriteContract({
  abi: govSocietyAbi,
  functionName: 'lock',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"lockMany"`
 */
export const useWriteGovSocietyLockMany = /*#__PURE__*/ createUseWriteContract({
  abi: govSocietyAbi,
  functionName: 'lockMany',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"lockWithGuardian"`
 */
export const useWriteGovSocietyLockWithGuardian =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'lockWithGuardian',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"lockWithGuardianMany"`
 */
export const useWriteGovSocietyLockWithGuardianMany =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'lockWithGuardianMany',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"onERC721Received"`
 */
export const useWriteGovSocietyOnErc721Received =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'onERC721Received',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useWriteGovSocietyRenounceRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useWriteGovSocietyRevokeRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useWriteGovSocietySafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useWriteGovSocietySetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"setRenderer"`
 */
export const useWriteGovSocietySetRenderer =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'setRenderer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteGovSocietyTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"unlock"`
 */
export const useWriteGovSocietyUnlock = /*#__PURE__*/ createUseWriteContract({
  abi: govSocietyAbi,
  functionName: 'unlock',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"unlockMany"`
 */
export const useWriteGovSocietyUnlockMany =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'unlockMany',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useWriteGovSocietyWithdrawTo =
  /*#__PURE__*/ createUseWriteContract({
    abi: govSocietyAbi,
    functionName: 'withdrawTo',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__
 */
export const useSimulateGovSociety = /*#__PURE__*/ createUseSimulateContract({
  abi: govSocietyAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateGovSocietyApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"delegate"`
 */
export const useSimulateGovSocietyDelegate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'delegate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"delegateBySig"`
 */
export const useSimulateGovSocietyDelegateBySig =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'delegateBySig',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"depositFor"`
 */
export const useSimulateGovSocietyDepositFor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'depositFor',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useSimulateGovSocietyEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useSimulateGovSocietyEmitMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"grantRole"`
 */
export const useSimulateGovSocietyGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'grantRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"lock"`
 */
export const useSimulateGovSocietyLock =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'lock',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"lockMany"`
 */
export const useSimulateGovSocietyLockMany =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'lockMany',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"lockWithGuardian"`
 */
export const useSimulateGovSocietyLockWithGuardian =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'lockWithGuardian',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"lockWithGuardianMany"`
 */
export const useSimulateGovSocietyLockWithGuardianMany =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'lockWithGuardianMany',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"onERC721Received"`
 */
export const useSimulateGovSocietyOnErc721Received =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'onERC721Received',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useSimulateGovSocietyRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useSimulateGovSocietyRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useSimulateGovSocietySafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useSimulateGovSocietySetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"setRenderer"`
 */
export const useSimulateGovSocietySetRenderer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'setRenderer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateGovSocietyTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"unlock"`
 */
export const useSimulateGovSocietyUnlock =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'unlock',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"unlockMany"`
 */
export const useSimulateGovSocietyUnlockMany =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'unlockMany',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link govSocietyAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useSimulateGovSocietyWithdrawTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: govSocietyAbi,
    functionName: 'withdrawTo',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__
 */
export const useWatchGovSocietyEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: govSocietyAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchGovSocietyApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"ApprovalForAll"`
 */
export const useWatchGovSocietyApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"BatchMetadataUpdate"`
 */
export const useWatchGovSocietyBatchMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'BatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"DelegateChanged"`
 */
export const useWatchGovSocietyDelegateChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'DelegateChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"DelegateVotesChanged"`
 */
export const useWatchGovSocietyDelegateVotesChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'DelegateVotesChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"EIP712DomainChanged"`
 */
export const useWatchGovSocietyEip712DomainChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'EIP712DomainChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"MetadataUpdate"`
 */
export const useWatchGovSocietyMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'MetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"RoleAdminChanged"`
 */
export const useWatchGovSocietyRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"RoleGranted"`
 */
export const useWatchGovSocietyRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'RoleGranted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"RoleRevoked"`
 */
export const useWatchGovSocietyRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'RoleRevoked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link govSocietyAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchGovSocietyTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: govSocietyAbi,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iBalanceOfAbi}__
 */
export const useReadIBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: iBalanceOfAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iBalanceOfAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadIBalanceOfBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: iBalanceOfAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iTokenEmitableAbi}__
 */
export const useWriteITokenEmitable = /*#__PURE__*/ createUseWriteContract({
  abi: iTokenEmitableAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iTokenEmitableAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useWriteITokenEmitableEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: iTokenEmitableAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iTokenEmitableAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useWriteITokenEmitableEmitMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: iTokenEmitableAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iTokenEmitableAbi}__
 */
export const useSimulateITokenEmitable =
  /*#__PURE__*/ createUseSimulateContract({ abi: iTokenEmitableAbi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iTokenEmitableAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useSimulateITokenEmitableEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iTokenEmitableAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iTokenEmitableAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useSimulateITokenEmitableEmitMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iTokenEmitableAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__
 */
export const useReadLingerieDreams = /*#__PURE__*/ createUseReadContract({
  abi: lingerieDreamsAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadLingerieDreamsBalanceOf =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'balanceOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"getApproved"`
 */
export const useReadLingerieDreamsGetApproved =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'getApproved',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"getStartTime"`
 */
export const useReadLingerieDreamsGetStartTime =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'getStartTime',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"isApprovedForAll"`
 */
export const useReadLingerieDreamsIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"mintLimit"`
 */
export const useReadLingerieDreamsMintLimit =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'mintLimit',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"mintPrice"`
 */
export const useReadLingerieDreamsMintPrice =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'mintPrice',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"name"`
 */
export const useReadLingerieDreamsName = /*#__PURE__*/ createUseReadContract({
  abi: lingerieDreamsAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"owner"`
 */
export const useReadLingerieDreamsOwner = /*#__PURE__*/ createUseReadContract({
  abi: lingerieDreamsAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"ownerOf"`
 */
export const useReadLingerieDreamsOwnerOf = /*#__PURE__*/ createUseReadContract(
  { abi: lingerieDreamsAbi, functionName: 'ownerOf' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 */
export const useReadLingerieDreamsOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadLingerieDreamsSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadLingerieDreamsSymbol = /*#__PURE__*/ createUseReadContract({
  abi: lingerieDreamsAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"tokenURI"`
 */
export const useReadLingerieDreamsTokenUri =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'tokenURI',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadLingerieDreamsTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: lingerieDreamsAbi,
    functionName: 'totalSupply',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__
 */
export const useWriteLingerieDreams = /*#__PURE__*/ createUseWriteContract({
  abi: lingerieDreamsAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteLingerieDreamsApprove =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useWriteLingerieDreamsCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useWriteLingerieDreamsCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"publicMint"`
 */
export const useWriteLingerieDreamsPublicMint =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'publicMint',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteLingerieDreamsRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useWriteLingerieDreamsRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useWriteLingerieDreamsSafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useWriteLingerieDreamsSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"setBaseURI"`
 */
export const useWriteLingerieDreamsSetBaseUri =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'setBaseURI',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"setMintLimit"`
 */
export const useWriteLingerieDreamsSetMintLimit =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'setMintLimit',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"setStartTime"`
 */
export const useWriteLingerieDreamsSetStartTime =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'setStartTime',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteLingerieDreamsTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteLingerieDreamsTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"withdraw"`
 */
export const useWriteLingerieDreamsWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: lingerieDreamsAbi,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__
 */
export const useSimulateLingerieDreams =
  /*#__PURE__*/ createUseSimulateContract({ abi: lingerieDreamsAbi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateLingerieDreamsApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useSimulateLingerieDreamsCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useSimulateLingerieDreamsCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"publicMint"`
 */
export const useSimulateLingerieDreamsPublicMint =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'publicMint',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateLingerieDreamsRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useSimulateLingerieDreamsRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"safeTransferFrom"`
 */
export const useSimulateLingerieDreamsSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"setApprovalForAll"`
 */
export const useSimulateLingerieDreamsSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"setBaseURI"`
 */
export const useSimulateLingerieDreamsSetBaseUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'setBaseURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"setMintLimit"`
 */
export const useSimulateLingerieDreamsSetMintLimit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'setMintLimit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"setStartTime"`
 */
export const useSimulateLingerieDreamsSetStartTime =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'setStartTime',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateLingerieDreamsTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateLingerieDreamsTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `functionName` set to `"withdraw"`
 */
export const useSimulateLingerieDreamsWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lingerieDreamsAbi,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lingerieDreamsAbi}__
 */
export const useWatchLingerieDreamsEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: lingerieDreamsAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchLingerieDreamsApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lingerieDreamsAbi,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `eventName` set to `"ApprovalForAll"`
 */
export const useWatchLingerieDreamsApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lingerieDreamsAbi,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 */
export const useWatchLingerieDreamsOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lingerieDreamsAbi,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 */
export const useWatchLingerieDreamsOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lingerieDreamsAbi,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchLingerieDreamsOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lingerieDreamsAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lingerieDreamsAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchLingerieDreamsTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lingerieDreamsAbi,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRenderer = /*#__PURE__*/ createUseReadContract({
  abi: namedLadyRendererAbi,
  address: namedLadyRendererAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"currentNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererCurrentNonce =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'currentNonce',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"hasAllRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererHasAllRoles =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'hasAllRoles',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"hasAnyRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererHasAnyRole =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'hasAnyRole',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"hashUpdateRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererHashUpdateRequest =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'hashUpdateRequest',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"metadataEmit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererMetadataEmit =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'metadataEmit',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"metadataRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererMetadataRole =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'metadataRole',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'owner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"rolesOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererRolesOf =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'rolesOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"signerRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererSignerRole =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'signerRole',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"tokenURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererTokenUri =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'tokenURI',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"trustRole"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useReadNamedLadyRendererTrustRole =
  /*#__PURE__*/ createUseReadContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'trustRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRenderer = /*#__PURE__*/ createUseWriteContract({
  abi: namedLadyRendererAbi,
  address: namedLadyRendererAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"ban"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererBan =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'ban',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"grantRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererGrantRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"renounceRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererRenounceRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"revokeRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererRevokeRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"setBaseURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererSetBaseUri =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'setBaseURI',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"setSigner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererSetSigner =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'setSigner',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"setTokenUri"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererSetTokenUri =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'setTokenUri',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWriteNamedLadyRendererTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRenderer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"ban"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererBan =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'ban',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"grantRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererGrantRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"renounceRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererRenounceRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"revokeRoles"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererRevokeRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"setBaseURI"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererSetBaseUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'setBaseURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"setSigner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererSetSigner =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'setSigner',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"setTokenUri"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererSetTokenUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'setTokenUri',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useSimulateNamedLadyRendererTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link namedLadyRendererAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWatchNamedLadyRendererEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWatchNamedLadyRendererOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWatchNamedLadyRendererOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWatchNamedLadyRendererOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link namedLadyRendererAbi}__ and `eventName` set to `"RolesUpdated"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xC7A29659c34CB2551Aec0dc589e6450aF342bf24)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a)
 */
export const useWatchNamedLadyRendererRolesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: namedLadyRendererAbi,
    address: namedLadyRendererAddress,
    eventName: 'RolesUpdated',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link saveLadyAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useReadSaveLady = /*#__PURE__*/ createUseReadContract({
  abi: saveLadyAbi,
  address: saveLadyAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"FAME_LADY_SOCIETY"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useReadSaveLadyFameLadySociety =
  /*#__PURE__*/ createUseReadContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'FAME_LADY_SOCIETY',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"FAME_LADY_SQUAD"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useReadSaveLadyFameLadySquad = /*#__PURE__*/ createUseReadContract(
  {
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'FAME_LADY_SQUAD',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"FEE_BPS"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useReadSaveLadyFeeBps = /*#__PURE__*/ createUseReadContract({
  abi: saveLadyAbi,
  address: saveLadyAddress,
  functionName: 'FEE_BPS',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"onERC721Received"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useReadSaveLadyOnErc721Received =
  /*#__PURE__*/ createUseReadContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'onERC721Received',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useReadSaveLadyOwner = /*#__PURE__*/ createUseReadContract({
  abi: saveLadyAbi,
  address: saveLadyAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useReadSaveLadyOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"seaport"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useReadSaveLadySeaport = /*#__PURE__*/ createUseReadContract({
  abi: saveLadyAbi,
  address: saveLadyAddress,
  functionName: 'seaport',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"squadApprovalSet"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useReadSaveLadySquadApprovalSet =
  /*#__PURE__*/ createUseReadContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'squadApprovalSet',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link saveLadyAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWriteSaveLady = /*#__PURE__*/ createUseWriteContract({
  abi: saveLadyAbi,
  address: saveLadyAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWriteSaveLadyCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWriteSaveLadyCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWriteSaveLadyRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWriteSaveLadyRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"rescueETH"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWriteSaveLadyRescueEth = /*#__PURE__*/ createUseWriteContract({
  abi: saveLadyAbi,
  address: saveLadyAddress,
  functionName: 'rescueETH',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"setSquadApprovalSet"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWriteSaveLadySetSquadApprovalSet =
  /*#__PURE__*/ createUseWriteContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'setSquadApprovalSet',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"sweepAndWrap"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWriteSaveLadySweepAndWrap =
  /*#__PURE__*/ createUseWriteContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'sweepAndWrap',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWriteSaveLadyTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link saveLadyAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useSimulateSaveLady = /*#__PURE__*/ createUseSimulateContract({
  abi: saveLadyAbi,
  address: saveLadyAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useSimulateSaveLadyCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useSimulateSaveLadyCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useSimulateSaveLadyRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useSimulateSaveLadyRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"rescueETH"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useSimulateSaveLadyRescueEth =
  /*#__PURE__*/ createUseSimulateContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'rescueETH',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"setSquadApprovalSet"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useSimulateSaveLadySetSquadApprovalSet =
  /*#__PURE__*/ createUseSimulateContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'setSquadApprovalSet',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"sweepAndWrap"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useSimulateSaveLadySweepAndWrap =
  /*#__PURE__*/ createUseSimulateContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'sweepAndWrap',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link saveLadyAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useSimulateSaveLadyTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link saveLadyAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWatchSaveLadyEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: saveLadyAbi,
  address: saveLadyAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link saveLadyAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWatchSaveLadyOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link saveLadyAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWatchSaveLadyOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link saveLadyAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWatchSaveLadyOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link saveLadyAbi}__ and `eventName` set to `"SweepAndWrap"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC)
 */
export const useWatchSaveLadySweepAndWrapEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: saveLadyAbi,
    address: saveLadyAddress,
    eventName: 'SweepAndWrap',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__
 */
export const useReadSimpleOffchainReveal = /*#__PURE__*/ createUseReadContract({
  abi: simpleOffchainRevealAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"RENDERER"`
 */
export const useReadSimpleOffchainRevealRenderer =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'RENDERER',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"batches"`
 */
export const useReadSimpleOffchainRevealBatches =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'batches',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"childRenderer"`
 */
export const useReadSimpleOffchainRevealChildRenderer =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'childRenderer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"hasAllRoles"`
 */
export const useReadSimpleOffchainRevealHasAllRoles =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'hasAllRoles',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"hasAnyRole"`
 */
export const useReadSimpleOffchainRevealHasAnyRole =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'hasAnyRole',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"maxTokenId"`
 */
export const useReadSimpleOffchainRevealMaxTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'maxTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"offsetForTokenId"`
 */
export const useReadSimpleOffchainRevealOffsetForTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'offsetForTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"owner"`
 */
export const useReadSimpleOffchainRevealOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'owner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 */
export const useReadSimpleOffchainRevealOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"rolesOf"`
 */
export const useReadSimpleOffchainRevealRolesOf =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'rolesOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"startAtToken"`
 */
export const useReadSimpleOffchainRevealStartAtToken =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'startAtToken',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"tokenEmitable"`
 */
export const useReadSimpleOffchainRevealTokenEmitable =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'tokenEmitable',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"tokenURI"`
 */
export const useReadSimpleOffchainRevealTokenUri =
  /*#__PURE__*/ createUseReadContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'tokenURI',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__
 */
export const useWriteSimpleOffchainReveal =
  /*#__PURE__*/ createUseWriteContract({ abi: simpleOffchainRevealAbi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useWriteSimpleOffchainRevealCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useWriteSimpleOffchainRevealCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useWriteSimpleOffchainRevealEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useWriteSimpleOffchainRevealEmitMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useWriteSimpleOffchainRevealGrantRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"pushBatch"`
 */
export const useWriteSimpleOffchainRevealPushBatch =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'pushBatch',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteSimpleOffchainRevealRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useWriteSimpleOffchainRevealRenounceRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useWriteSimpleOffchainRevealRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useWriteSimpleOffchainRevealRevokeRoles =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteSimpleOffchainRevealTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"updateTokenEmitable"`
 */
export const useWriteSimpleOffchainRevealUpdateTokenEmitable =
  /*#__PURE__*/ createUseWriteContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'updateTokenEmitable',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__
 */
export const useSimulateSimpleOffchainReveal =
  /*#__PURE__*/ createUseSimulateContract({ abi: simpleOffchainRevealAbi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 */
export const useSimulateSimpleOffchainRevealCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 */
export const useSimulateSimpleOffchainRevealCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"emitBatchMetadataUpdate"`
 */
export const useSimulateSimpleOffchainRevealEmitBatchMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'emitBatchMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 */
export const useSimulateSimpleOffchainRevealEmitMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"grantRoles"`
 */
export const useSimulateSimpleOffchainRevealGrantRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'grantRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"pushBatch"`
 */
export const useSimulateSimpleOffchainRevealPushBatch =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'pushBatch',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateSimpleOffchainRevealRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"renounceRoles"`
 */
export const useSimulateSimpleOffchainRevealRenounceRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'renounceRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 */
export const useSimulateSimpleOffchainRevealRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"revokeRoles"`
 */
export const useSimulateSimpleOffchainRevealRevokeRoles =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'revokeRoles',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateSimpleOffchainRevealTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `functionName` set to `"updateTokenEmitable"`
 */
export const useSimulateSimpleOffchainRevealUpdateTokenEmitable =
  /*#__PURE__*/ createUseSimulateContract({
    abi: simpleOffchainRevealAbi,
    functionName: 'updateTokenEmitable',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link simpleOffchainRevealAbi}__
 */
export const useWatchSimpleOffchainRevealEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: simpleOffchainRevealAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 */
export const useWatchSimpleOffchainRevealOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: simpleOffchainRevealAbi,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 */
export const useWatchSimpleOffchainRevealOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: simpleOffchainRevealAbi,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchSimpleOffchainRevealOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: simpleOffchainRevealAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link simpleOffchainRevealAbi}__ and `eventName` set to `"RolesUpdated"`
 */
export const useWatchSimpleOffchainRevealRolesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: simpleOffchainRevealAbi,
    eventName: 'RolesUpdated',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useReadUnrevealedLadyRenderer =
  /*#__PURE__*/ createUseReadContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"batches"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useReadUnrevealedLadyRendererBatches =
  /*#__PURE__*/ createUseReadContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'batches',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"childRenderer"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useReadUnrevealedLadyRendererChildRenderer =
  /*#__PURE__*/ createUseReadContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'childRenderer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"maxTokenId"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useReadUnrevealedLadyRendererMaxTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'maxTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"offsetForTokenId"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useReadUnrevealedLadyRendererOffsetForTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'offsetForTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useReadUnrevealedLadyRendererOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'owner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"ownershipHandoverExpiresAt"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useReadUnrevealedLadyRendererOwnershipHandoverExpiresAt =
  /*#__PURE__*/ createUseReadContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'ownershipHandoverExpiresAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"tokenURI"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useReadUnrevealedLadyRendererTokenUri =
  /*#__PURE__*/ createUseReadContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'tokenURI',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"tokenemEmitable"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useReadUnrevealedLadyRendererTokenemEmitable =
  /*#__PURE__*/ createUseReadContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'tokenemEmitable',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWriteUnrevealedLadyRenderer =
  /*#__PURE__*/ createUseWriteContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWriteUnrevealedLadyRendererCancelOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWriteUnrevealedLadyRendererCompleteOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"pushBatch"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWriteUnrevealedLadyRendererPushBatch =
  /*#__PURE__*/ createUseWriteContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'pushBatch',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWriteUnrevealedLadyRendererRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWriteUnrevealedLadyRendererRequestOwnershipHandover =
  /*#__PURE__*/ createUseWriteContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWriteUnrevealedLadyRendererTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useSimulateUnrevealedLadyRenderer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"cancelOwnershipHandover"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useSimulateUnrevealedLadyRendererCancelOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'cancelOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"completeOwnershipHandover"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useSimulateUnrevealedLadyRendererCompleteOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'completeOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"pushBatch"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useSimulateUnrevealedLadyRendererPushBatch =
  /*#__PURE__*/ createUseSimulateContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'pushBatch',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useSimulateUnrevealedLadyRendererRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"requestOwnershipHandover"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useSimulateUnrevealedLadyRendererRequestOwnershipHandover =
  /*#__PURE__*/ createUseSimulateContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'requestOwnershipHandover',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useSimulateUnrevealedLadyRendererTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWatchUnrevealedLadyRendererEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `eventName` set to `"OwnershipHandoverCanceled"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWatchUnrevealedLadyRendererOwnershipHandoverCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    eventName: 'OwnershipHandoverCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `eventName` set to `"OwnershipHandoverRequested"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWatchUnrevealedLadyRendererOwnershipHandoverRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    eventName: 'OwnershipHandoverRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link unrevealedLadyRendererAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0xa50c9a918c110ca159fb187f4a55896a4d063878)
 */
export const useWatchUnrevealedLadyRendererOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: unrevealedLadyRendererAbi,
    address: unrevealedLadyRendererAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNft = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'DEFAULT_ADMIN_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"EMIT_METADATA_ROLE"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftEmitMetadataRole =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'EMIT_METADATA_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"OPERATOR_FILTER_REGISTRY"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftOperatorFilterRegistry =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'OPERATOR_FILTER_REGISTRY',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"TREASURER_ROLE"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftTreasurerRole =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'TREASURER_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"UPDATE_RENDERER_ROLE"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftUpdateRendererRole =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'UPDATE_RENDERER_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"claimed"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftClaimed = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'claimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"contractURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftContractUri = /*#__PURE__*/ createUseReadContract(
  {
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'contractURI',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"defaultRoyaltyInfo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftDefaultRoyaltyInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'defaultRoyaltyInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"getApproved"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftGetApproved = /*#__PURE__*/ createUseReadContract(
  {
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'getApproved',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftGetRoleAdmin =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'getRoleAdmin',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"hasRole"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftHasRole = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftIsApprovedForAll =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'isApprovedForAll',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"isWrapped"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftIsWrapped = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'isWrapped',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftName = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftOwner = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"ownerOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"pendingOwner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftPendingOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'pendingOwner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"renderer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftRenderer = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'renderer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"royaltyInfo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftRoyaltyInfo = /*#__PURE__*/ createUseReadContract(
  {
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'royaltyInfo',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftSymbol = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"tokenURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrapCost"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftWrapCost = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'wrapCost',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrappedNft"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useReadWrappedNftWrappedNft = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'wrappedNft',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNft = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftAcceptOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftApprove = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftEmitMetadataUpdate =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftGrantRole = /*#__PURE__*/ createUseWriteContract(
  { abi: wrappedNftAbi, address: wrappedNftAddress, functionName: 'grantRole' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"onERC721Received"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftOnErc721Received =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'onERC721Received',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftRenounceRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftRevokeRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftSafeTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftSetApprovalForAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setContractURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftSetContractUri =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setContractURI',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftSetDefaultRoyalty =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setDefaultRoyalty',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setRenderer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftSetRenderer =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setRenderer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setWrapCost"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftSetWrapCost =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setWrapCost',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"unwrap"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftUnwrap = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'unwrap',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"unwrapMany"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftUnwrapMany =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'unwrapMany',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"withdraw"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrap"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftWrap = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'wrap',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrapTo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWriteWrappedNftWrapTo = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'wrapTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNft = /*#__PURE__*/ createUseSimulateContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftAcceptOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftEmitMetadataUpdate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'emitMetadataUpdate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'grantRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"onERC721Received"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftOnErc721Received =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'onERC721Received',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftSafeTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'safeTransferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setApprovalForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftSetApprovalForAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setApprovalForAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setContractURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftSetContractUri =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setContractURI',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setDefaultRoyalty"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftSetDefaultRoyalty =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setDefaultRoyalty',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setRenderer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftSetRenderer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setRenderer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"setWrapCost"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftSetWrapCost =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'setWrapCost',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"unwrap"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftUnwrap =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'unwrap',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"unwrapMany"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftUnwrapMany =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'unwrapMany',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"withdraw"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrap"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftWrap =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'wrap',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrapTo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useSimulateWrappedNftWrapTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    functionName: 'wrapTo',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"ApprovalForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftApprovalForAllEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'ApprovalForAll',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"BatchMetadataUpdate"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftBatchMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'BatchMetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"MetadataUpdate"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftMetadataUpdateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'MetadataUpdate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"OwnershipTransferStarted"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftOwnershipTransferStartedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'OwnershipTransferStarted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'RoleGranted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'RoleRevoked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x9EFf37047657a0f50b989165b48012834eDB2212)
 */
export const useWatchWrappedNftTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useReadWrappedNftDonationVault =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__ and `functionName` set to `"underlying"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useReadWrappedNftDonationVaultUnderlying =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
    functionName: 'underlying',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__ and `functionName` set to `"vault"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useReadWrappedNftDonationVaultVault =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
    functionName: 'vault',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__ and `functionName` set to `"wrappedNFT"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useReadWrappedNftDonationVaultWrappedNft =
  /*#__PURE__*/ createUseReadContract({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
    functionName: 'wrappedNFT',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useWriteWrappedNftDonationVault =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__ and `functionName` set to `"wrapAndDonate"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useWriteWrappedNftDonationVaultWrapAndDonate =
  /*#__PURE__*/ createUseWriteContract({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
    functionName: 'wrapAndDonate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useSimulateWrappedNftDonationVault =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__ and `functionName` set to `"wrapAndDonate"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useSimulateWrappedNftDonationVaultWrapAndDonate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
    functionName: 'wrapAndDonate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useWatchWrappedNftDonationVaultEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftDonationVaultAbi}__ and `eventName` set to `"WrappedAndDonated"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b)
 */
export const useWatchWrappedNftDonationVaultWrappedAndDonatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftDonationVaultAbi,
    address: wrappedNftDonationVaultAddress,
    eventName: 'WrappedAndDonated',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImpl = /*#__PURE__*/ createUseReadContract({
  abi: zoraFactoryImplAbi,
  address: zoraFactoryImplAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplUpgradeInterfaceVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'UPGRADE_INTERFACE_VERSION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"coinAddress"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplCoinAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'coinAddress',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"coinV4Impl"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplCoinV4Impl =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'coinV4Impl',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"contentCoinHook"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplContentCoinHook =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'contentCoinHook',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"contractName"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplContractName =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'contractName',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"contractVersion"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplContractVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'contractVersion',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"creatorCoinHook"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplCreatorCoinHook =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'creatorCoinHook',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"creatorCoinImpl"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplCreatorCoinImpl =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'creatorCoinImpl',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"getVersionForDeployedCoin"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplGetVersionForDeployedCoin =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'getVersionForDeployedCoin',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"hook"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplHook = /*#__PURE__*/ createUseReadContract({
  abi: zoraFactoryImplAbi,
  address: zoraFactoryImplAddress,
  functionName: 'hook',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"implementation"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplImplementation =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'implementation',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplOwner = /*#__PURE__*/ createUseReadContract({
  abi: zoraFactoryImplAbi,
  address: zoraFactoryImplAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"pendingOwner"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplPendingOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'pendingOwner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplProxiableUuid =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'proxiableUUID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"zoraHookRegistry"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useReadZoraFactoryImplZoraHookRegistry =
  /*#__PURE__*/ createUseReadContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'zoraHookRegistry',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWriteZoraFactoryImpl = /*#__PURE__*/ createUseWriteContract({
  abi: zoraFactoryImplAbi,
  address: zoraFactoryImplAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWriteZoraFactoryImplAcceptOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"deploy"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWriteZoraFactoryImplDeploy =
  /*#__PURE__*/ createUseWriteContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'deploy',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"deployCreatorCoin"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWriteZoraFactoryImplDeployCreatorCoin =
  /*#__PURE__*/ createUseWriteContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'deployCreatorCoin',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"deployWithHook"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWriteZoraFactoryImplDeployWithHook =
  /*#__PURE__*/ createUseWriteContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'deployWithHook',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWriteZoraFactoryImplInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWriteZoraFactoryImplRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWriteZoraFactoryImplTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWriteZoraFactoryImplUpgradeToAndCall =
  /*#__PURE__*/ createUseWriteContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useSimulateZoraFactoryImpl =
  /*#__PURE__*/ createUseSimulateContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useSimulateZoraFactoryImplAcceptOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"deploy"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useSimulateZoraFactoryImplDeploy =
  /*#__PURE__*/ createUseSimulateContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'deploy',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"deployCreatorCoin"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useSimulateZoraFactoryImplDeployCreatorCoin =
  /*#__PURE__*/ createUseSimulateContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'deployCreatorCoin',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"deployWithHook"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useSimulateZoraFactoryImplDeployWithHook =
  /*#__PURE__*/ createUseSimulateContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'deployWithHook',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useSimulateZoraFactoryImplInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useSimulateZoraFactoryImplRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useSimulateZoraFactoryImplTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useSimulateZoraFactoryImplUpgradeToAndCall =
  /*#__PURE__*/ createUseSimulateContract({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link zoraFactoryImplAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWatchZoraFactoryImplEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `eventName` set to `"CoinCreated"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWatchZoraFactoryImplCoinCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    eventName: 'CoinCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `eventName` set to `"CoinCreatedV4"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWatchZoraFactoryImplCoinCreatedV4Event =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    eventName: 'CoinCreatedV4',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `eventName` set to `"CreatorCoinCreated"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWatchZoraFactoryImplCreatorCoinCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    eventName: 'CreatorCoinCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `eventName` set to `"Initialized"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWatchZoraFactoryImplInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `eventName` set to `"OwnershipTransferStarted"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWatchZoraFactoryImplOwnershipTransferStartedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    eventName: 'OwnershipTransferStarted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWatchZoraFactoryImplOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link zoraFactoryImplAbi}__ and `eventName` set to `"Upgraded"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2)
 */
export const useWatchZoraFactoryImplUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: zoraFactoryImplAbi,
    address: zoraFactoryImplAddress,
    eventName: 'Upgraded',
  })

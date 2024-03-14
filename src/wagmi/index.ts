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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const bulkMinterAddress = {
  11155111: '0xb40d9f7D68f200650f9286138d520975603ae687',
} as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const bulkMinterConfig = {
  address: bulkMinterAddress,
  abi: bulkMinterAbi,
} as const

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
// WrappedNFT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const wrappedNftAddress = {
  11155111: '0x384fCcC4E11B95379831151a44D10096Ec568277',
} as const

/**
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const wrappedNftConfig = {
  address: wrappedNftAddress,
  abi: wrappedNftAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useReadBulkMinter = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"MAX_SUPPLY"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useReadBulkMinterMaxSupply = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'MAX_SUPPLY',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useReadBulkMinterBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"explicitOwnershipOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useReadBulkMinterName = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"ownerOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useReadBulkMinterOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useReadBulkMinterSymbol = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"tokenURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useReadBulkMinterTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"tokensOfOwner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useWriteBulkMinter = /*#__PURE__*/ createUseWriteContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useWriteBulkMinterApprove = /*#__PURE__*/ createUseWriteContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useWriteBulkMinterMint = /*#__PURE__*/ createUseWriteContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"safeTransferFrom"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useSimulateBulkMinter = /*#__PURE__*/ createUseSimulateContract({
  abi: bulkMinterAbi,
  address: bulkMinterAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bulkMinterAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useWatchBulkMinterEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bulkMinterAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xb40d9f7D68f200650f9286138d520975603ae687)
 */
export const useWatchBulkMinterTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bulkMinterAbi,
    address: bulkMinterAddress,
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
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNft = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"claimed"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftClaimed = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'claimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"contractURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftHasRole = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"isApprovedForAll"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftIsWrapped = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'isWrapped',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftName = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"owner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftOwner = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"ownerOf"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"pendingOwner"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftRenderer = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'renderer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"royaltyInfo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftSymbol = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"tokenURI"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftTokenUri = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'tokenURI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrapCost"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftWrapCost = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'wrapCost',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrappedNft"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useReadWrappedNftWrappedNft = /*#__PURE__*/ createUseReadContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'wrappedNft',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useWriteWrappedNft = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useWriteWrappedNftApprove = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"emitMetadataUpdate"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useWriteWrappedNftGrantRole = /*#__PURE__*/ createUseWriteContract(
  { abi: wrappedNftAbi, address: wrappedNftAddress, functionName: 'grantRole' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"onERC721Received"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useWriteWrappedNftUnwrap = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'unwrap',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"unwrapMany"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useWriteWrappedNftWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrap"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useWriteWrappedNftWrap = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'wrap',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"wrapTo"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useWriteWrappedNftWrapTo = /*#__PURE__*/ createUseWriteContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
  functionName: 'wrapTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useSimulateWrappedNft = /*#__PURE__*/ createUseSimulateContract({
  abi: wrappedNftAbi,
  address: wrappedNftAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wrappedNftAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useWatchWrappedNftEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link wrappedNftAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
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
 * [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x384fCcC4E11B95379831151a44D10096Ec568277)
 */
export const useWatchWrappedNftTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: wrappedNftAbi,
    address: wrappedNftAddress,
    eventName: 'Transfer',
  })

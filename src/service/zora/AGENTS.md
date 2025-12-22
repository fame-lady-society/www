# LICENSE

These code snippets are not exactly open source, and are included here strictly for inference purposes of generating compatible payloads

# Reference solidity library

```CoinConstants.sol
// SPDX-License-Identifier: ZORA-DELAYED-OSL-v1
// This software is licensed under the Zora Delayed Open Source License.
// Under this license, you may use, copy, modify, and distribute this software for
// non-commercial purposes only. Commercial use and competitive products are prohibited
// until the "Open Date" (3 years from first public distribution or earlier at Zora's discretion),
// at which point this software automatically becomes available under the MIT License.
// Full license terms available at: https://docs.zora.co/coins/license
pragma solidity ^0.8.23;

library CoinConstants {
    /// @dev Constant used to increase precision during calculations
    uint256 internal constant WAD = 1e18;

    /// @notice The maximum total supply
    /// @dev Set to 1 billion coins with 18 decimals
    uint256 internal constant MAX_TOTAL_SUPPLY = 1_000_000_000e18;

    /// @notice The total supply for creator coins (same as MAX_TOTAL_SUPPLY)
    /// @dev 1 billion coins
    uint256 internal constant TOTAL_SUPPLY = 1_000_000_000e18;

    /// @notice The number of coins allocated to the liquidity pool for content coins
    /// @dev 990 million coins
    uint256 internal constant CONTENT_COIN_MARKET_SUPPLY = 990_000_000e18;

    /// @notice The number of coins allocated to the liquidity pool for creator coins
    /// @dev 500 million coins
    uint256 internal constant CREATOR_COIN_MARKET_SUPPLY = 500_000_000e18;

    /// @notice The number of coins rewarded to the creator for content coins on launch
    /// @dev 10 million coins
    uint256 internal constant CONTENT_COIN_INITIAL_CREATOR_SUPPLY = TOTAL_SUPPLY - CONTENT_COIN_MARKET_SUPPLY;

    /// @notice Creator coin vesting supply for creator
    /// @dev 500 million coins
    uint256 internal constant CREATOR_COIN_CREATOR_VESTING_SUPPLY = TOTAL_SUPPLY - CREATOR_COIN_MARKET_SUPPLY;

    /// @notice Creator coin vesting duration
    /// @dev 5 years with leap years accounted for
    uint256 internal constant CREATOR_VESTING_DURATION = (5 * 365.25 days);

    /// @notice The backing currency for creator coins
    /// @dev ETH backing currency address
    address internal constant CREATOR_COIN_CURRENCY = 0x1111111111166b7FE7bd91427724B487980aFc69;

    /// @notice The LP fee
    /// @dev 10000 basis points = 1%
    uint24 internal constant LP_FEE_V4 = 10_000;

    /// @notice The spacing for 1% pools
    /// @dev 200 ticks
    int24 internal constant TICK_SPACING = 200;

    // Creator gets 62.5% of market rewards (0.50% of total 1% fee)
    // Market rewards = 80% of total fee (0.80% of 1%)
    uint256 internal constant CREATOR_REWARD_BPS = 6250;

    // Platform referrer gets 25% of market rewards (0.20% of total 1% fee)
    uint256 internal constant CREATE_REFERRAL_REWARD_BPS = 2500;

    // Trade referrer gets 5% of market rewards (0.04% of total 1% fee)
    uint256 internal constant TRADE_REFERRAL_REWARD_BPS = 500;

    // Doppler gets 1.25% of market rewards (0.01% of total 1% fee)
    uint256 internal constant DOPPLER_REWARD_BPS = 125;

    // LPs get 20% of total fee (0.20% of 1%)
    uint256 internal constant LP_REWARD_BPS = 2000;

    int24 internal constant DEFAULT_DISCOVERY_TICK_LOWER = -777000;
    int24 internal constant DEFAULT_DISCOVERY_TICK_UPPER = 222000;
    uint16 internal constant DEFAULT_NUM_DISCOVERY_POSITIONS = 10; // will be 11 total with tail position
    uint256 internal constant DEFAULT_DISCOVERY_SUPPLY_SHARE = 0.495e18; // half of the 990m total pool supply
}
```

```CoinSetup.sol
// SPDX-License-Identifier: ZORA-DELAYED-OSL-v1
// This software is licensed under the Zora Delayed Open Source License.
// Under this license, you may use, copy, modify, and distribute this software for
// non-commercial purposes only. Commercial use and competitive products are prohibited
// until the "Open Date" (3 years from first public distribution or earlier at Zora's discretion),
// at which point this software automatically becomes available under the MIT License.
// Full license terms available at: https://docs.zora.co/coins/license
pragma solidity ^0.8.23;

import {PoolConfigurationV4} from "../interfaces/ICoin.sol";
import {CoinConfigurationVersions} from "./CoinConfigurationVersions.sol";
import {ICoin} from "../interfaces/ICoin.sol";
import {CoinCommon} from "./CoinCommon.sol";
import {CoinConstants} from "./CoinConstants.sol";
import {TickMath} from "../utils/uniswap/TickMath.sol";
import {IPoolManager, PoolKey, Currency, IHooks} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {LpPosition} from "../types/LpPosition.sol";
import {CoinDopplerMultiCurve, PoolConfiguration} from "./CoinDopplerMultiCurve.sol";

library CoinSetup {
    function generatePoolConfig(
        address coin,
        bytes memory poolConfig_
    ) internal pure returns (uint8 version, address currency, uint160 sqrtPriceX96, bool isCoinToken0, PoolConfiguration memory poolConfiguration) {
        // Extract version and currency from pool config
        (version, currency) = CoinConfigurationVersions.decodeVersionAndCurrency(poolConfig_);

        isCoinToken0 = CoinCommon.sortTokens(coin, currency);

        (sqrtPriceX96, poolConfiguration) = setupPoolWithVersion(version, poolConfig_, isCoinToken0);
    }

    function buildPoolKey(address coin, address currency, bool isCoinToken0, IHooks hooks) internal pure returns (PoolKey memory poolKey) {
        Currency currency0 = isCoinToken0 ? Currency.wrap(coin) : Currency.wrap(currency);
        Currency currency1 = isCoinToken0 ? Currency.wrap(currency) : Currency.wrap(coin);

        poolKey = PoolKey({currency0: currency0, currency1: currency1, fee: CoinConstants.LP_FEE_V4, tickSpacing: CoinConstants.TICK_SPACING, hooks: hooks});
    }

    function setupPoolWithVersion(
        uint8 version,
        bytes memory poolConfig_,
        bool isCoinToken0
    ) internal pure returns (uint160 sqrtPriceX96, PoolConfiguration memory poolConfiguration) {
        if (version == CoinConfigurationVersions.DOPPLER_MULTICURVE_UNI_V4_POOL_VERSION) {
            (sqrtPriceX96, poolConfiguration) = CoinDopplerMultiCurve.setupPool(isCoinToken0, poolConfig_);
        } else {
            revert ICoin.InvalidPoolVersion();
        }
    }
}
```

```CoinConfigurationVersions.sol
// SPDX-License-Identifier: ZORA-DELAYED-OSL-v1
// This software is licensed under the Zora Delayed Open Source License.
// Under this license, you may use, copy, modify, and distribute this software for
// non-commercial purposes only. Commercial use and competitive products are prohibited
// until the "Open Date" (3 years from first public distribution or earlier at Zora's discretion),
// at which point this software automatically becomes available under the MIT License.
// Full license terms available at: https://docs.zora.co/coins/license
pragma solidity ^0.8.23;

import {CoinConstants} from "./CoinConstants.sol";

library CoinConfigurationVersions {
    uint8 constant LEGACY_POOL_VERSION = 1;
    uint8 constant DOPPLER_UNI_V3_POOL_VERSION = 2;
    uint8 constant DOPPLER_MULTICURVE_UNI_V4_POOL_VERSION = 4;

    function getVersion(bytes memory poolConfig) internal pure returns (uint8 version) {
        return (version) = abi.decode(poolConfig, (uint8));
    }

    function isV3(uint8 version) internal pure returns (bool) {
        return version == DOPPLER_UNI_V3_POOL_VERSION || version == LEGACY_POOL_VERSION;
    }

    function isV4(uint8 version) internal pure returns (bool) {
        return version == DOPPLER_MULTICURVE_UNI_V4_POOL_VERSION;
    }

    function decodeVersionAndCurrency(bytes memory poolConfig) internal pure returns (uint8 version, address currency) {
        (version, currency) = abi.decode(poolConfig, (uint8, address));
    }

    function decodeVanillaUniV4(bytes memory poolConfig) internal pure returns (uint8 version, address currency, int24 tickLower_) {
        (version, currency, tickLower_) = abi.decode(poolConfig, (uint8, address, int24));
    }

    function encodeDopplerMultiCurveUniV4(
        address currency,
        int24[] memory tickLower_,
        int24[] memory tickUpper_,
        uint16[] memory numDiscoveryPositions_,
        uint256[] memory maxDiscoverySupplyShare_
    ) internal pure returns (bytes memory) {
        return abi.encode(DOPPLER_MULTICURVE_UNI_V4_POOL_VERSION, currency, tickLower_, tickUpper_, numDiscoveryPositions_, maxDiscoverySupplyShare_);
    }

    function decodeDopplerMultiCurveUniV4(
        bytes memory poolConfig
    )
        internal
        pure
        returns (
            uint8 version,
            address currency,
            int24[] memory tickLower_,
            int24[] memory tickUpper_,
            uint16[] memory numDiscoveryPositions_,
            uint256[] memory maxDiscoverySupplyShare_
        )
    {
        (version, currency, tickLower_, tickUpper_, numDiscoveryPositions_, maxDiscoverySupplyShare_) = abi.decode(
            poolConfig,
            (uint8, address, int24[], int24[], uint16[], uint256[])
        );
    }

    function defaultDopplerMultiCurveUniV4(address currency) internal pure returns (bytes memory) {
        int24[] memory tickLower = new int24[](2);
        int24[] memory tickUpper = new int24[](2);
        uint16[] memory numDiscoveryPositions = new uint16[](2);
        uint256[] memory maxDiscoverySupplyShare = new uint256[](2);

        // todo: configure defaults
        // Curve 1
        tickLower[0] = -328_000;
        tickUpper[0] = -300_000;
        numDiscoveryPositions[0] = 2;
        maxDiscoverySupplyShare[0] = 0.1e18;

        // Curve 2
        tickLower[1] = -200_000;
        tickUpper[1] = -100_000;
        numDiscoveryPositions[1] = 2;
        maxDiscoverySupplyShare[1] = 0.1e18;

        return encodeDopplerMultiCurveUniV4(currency, tickLower, tickUpper, numDiscoveryPositions, maxDiscoverySupplyShare);
    }

    function defaultConfig(address currency) internal pure returns (bytes memory) {
        return defaultDopplerMultiCurveUniV4(currency);
    }
}
```

# Handle Ops

Zora coins are typically deployed with `UserOperation[]` which are passed to an

```
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable no-inline-assembly */

import {calldataKeccak} from "../core/Helpers.sol";

/**
 * User Operation struct
 * @param sender the sender account of this request.
     * @param nonce unique value the sender uses to verify it is not a replay.
     * @param initCode if set, the account contract will be created by this constructor/
     * @param callData the method call to execute on this account.
     * @param callGasLimit the gas limit passed to the callData method call.
     * @param verificationGasLimit gas used for validateUserOp and validatePaymasterUserOp.
     * @param preVerificationGas gas not calculated by the handleOps method, but added to the gas paid. Covers batch overhead.
     * @param maxFeePerGas same as EIP-1559 gas parameter.
     * @param maxPriorityFeePerGas same as EIP-1559 gas parameter.
     * @param paymasterAndData if set, this field holds the paymaster address and paymaster-specific data. the paymaster will pay for the transaction instead of the sender.
     * @param signature sender-verified signature over the entire request, the EntryPoint address and the chain ID.
     */
    struct UserOperation {

        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }

/**
 * Utility functions helpful when working with UserOperation structs.
 */
library UserOperationLib {

    function getSender(UserOperation calldata userOp) internal pure returns (address) {
        address data;
        //read sender from userOp, which is first userOp member (saves 800 gas...)
        assembly {data := calldataload(userOp)}
        return address(uint160(data));
    }

    //relayer/block builder might submit the TX with higher priorityFee, but the user should not
    // pay above what he signed for.
    function gasPrice(UserOperation calldata userOp) internal view returns (uint256) {
    unchecked {
        uint256 maxFeePerGas = userOp.maxFeePerGas;
        uint256 maxPriorityFeePerGas = userOp.maxPriorityFeePerGas;
        if (maxFeePerGas == maxPriorityFeePerGas) {
            //legacy mode (for networks that don't support basefee opcode)
            return maxFeePerGas;
        }
        return min(maxFeePerGas, maxPriorityFeePerGas + block.basefee);
    }
    }

    function pack(UserOperation calldata userOp) internal pure returns (bytes memory ret) {
        address sender = getSender(userOp);
        uint256 nonce = userOp.nonce;
        bytes32 hashInitCode = calldataKeccak(userOp.initCode);
        bytes32 hashCallData = calldataKeccak(userOp.callData);
        uint256 callGasLimit = userOp.callGasLimit;
        uint256 verificationGasLimit = userOp.verificationGasLimit;
        uint256 preVerificationGas = userOp.preVerificationGas;
        uint256 maxFeePerGas = userOp.maxFeePerGas;
        uint256 maxPriorityFeePerGas = userOp.maxPriorityFeePerGas;
        bytes32 hashPaymasterAndData = calldataKeccak(userOp.paymasterAndData);

        return abi.encode(
            sender, nonce,
            hashInitCode, hashCallData,
            callGasLimit, verificationGasLimit, preVerificationGas,
            maxFeePerGas, maxPriorityFeePerGas,
            hashPaymasterAndData
        );
    }

    function hash(UserOperation calldata userOp) internal pure returns (bytes32) {
        return keccak256(pack(userOp));
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
```

# Pool Config Generation

When coming across a poolConfig, the bytes can be calculated with abiEncoding. See relevant functions:

```
function encodeDopplerMultiCurveUniV4(
    address currency,
    int24[] memory tickLower_,
    int24[] memory tickUpper_,
    uint16[] memory numDiscoveryPositions_,
    uint256[] memory maxDiscoverySupplyShare_
) internal pure returns (bytes memory) {
    return abi.encode(4, currency, tickLower_, tickUpper_, numDiscoveryPositions_, maxDiscoverySupplyShare_);
}
```

which maps to types: `["uint8", "address", "int24[]", "int24[]", "uint16[]", "uint256[]"]`

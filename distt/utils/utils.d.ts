import * as bitcoin from 'bitcoinjs-lib';
export declare const ECPair: import("ecpair").ECPairAPI;
export declare const BITCOIN_NETWORK: bitcoin.networks.Network;
export declare const BITCOIN_NETWORK_MAINNET: bitcoin.networks.Network;
export declare const bitCoinRootUrl = "https://api.blockcypher.com/v1/btc/test3";
export declare const generateStringId: () => string;
export declare const TRON_RPC = "https://api.shasta.trongrid.io";
export declare const TRON_SCAN_URL = "https://shastapi.tronscan.org";
export declare const TRONSCAN_API_KEY = "3c5687de-b88d-479b-84fb-1f7304215dc5";
export declare const TRONGRID_API_KEY = "7e6b343f-516c-4c47-9c13-9e3a304e81a0";
export declare const BITCOIN_TOKEN = "a9577cefe0a840008b339bbc5a567ee3";
export declare const tronWeb: any;
export declare const STABLE_MINIMUM = 50;
export declare const TRX_GAS_FEE = 15;
export declare const fromSatoshi: (number: any) => number;
export declare const toSatoshi: (number: any) => number;
export declare const fromDecimals: (number: string | number | bigint, decimals: number) => string;
export declare const toDecimals: (number: string | number | bigint, decimals: number) => string;
export declare const fromWei: (value: any, decimal: any) => string;
export declare const toWei: (value: any, decimal: any) => string;
export declare const abi: any;
export declare const chainMapping: {
    '137': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '1': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '250': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '42161': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '56': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '43114': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '10': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '25': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '1666600000': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '1313161554': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
    '2222': {
        chain: string;
        rpc: string;
        reserveHandler_address: string;
        oneSplit_address: string;
        NATIVE: {
            address: string;
            wrapped_address: string;
        };
    };
};
export declare const web3: any;
export declare let masterWalletLocks: {
    isEVMLocked: number;
    isTRONLocked: number;
    isBTCLocked: number;
};
export declare const dbCoins: ({
    swapFee: number;
    name: string;
    symbol: string;
    icon: string;
    coinNameId: string;
    isToken: boolean;
    contractAddress: string;
    decimal: number;
    price: number;
    priceFormer: number;
    priceMarket: number;
    networkId: {
        chainId: number;
        nativeCoinAddress: string;
        name: string;
        symbol: string;
        logoUrl: string;
        rpcUrl: string;
        isMainnet: boolean;
        networkName: string;
        networkType: string;
        isDeleted: boolean;
        isActive: boolean;
        id: string;
        rpcUrlAlt?: undefined;
    };
    isDeleted: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    priceChange: number;
    sort: number;
    id: string;
    swapAmount: number;
    unit?: undefined;
} | {
    swapFee: number;
    name: string;
    symbol: string;
    icon: string;
    coinNameId: string;
    isToken: boolean;
    contractAddress: string;
    decimal: number;
    price: number;
    priceFormer: number;
    priceMarket: number;
    networkId: {
        name: string;
        symbol: string;
        chainId: number;
        nativeCoinAddress: string;
        logoUrl: string;
        rpcUrl: string;
        isMainnet: boolean;
        networkName: string;
        networkType: string;
        isDeleted: boolean;
        isActive: boolean;
        rpcUrlAlt: string;
        id: string;
    };
    isDeleted: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    priceChange: number;
    sort: number;
    id: string;
    swapAmount: number;
    unit?: undefined;
} | {
    swapFee: number;
    name: string;
    symbol: string;
    icon: string;
    coinNameId: string;
    isToken: boolean;
    contractAddress: string;
    decimal: number;
    price: number;
    priceFormer: number;
    priceMarket: number;
    networkId: {
        name: string;
        symbol: string;
        chainId: number;
        nativeCoinAddress: string;
        logoUrl: string;
        rpcUrl: string;
        isMainnet: boolean;
        networkName: string;
        networkType: string;
        isDeleted: boolean;
        isActive: boolean;
        id: string;
        rpcUrlAlt?: undefined;
    };
    isDeleted: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    priceChange: number;
    unit: string;
    sort: number;
    id: string;
    swapAmount: number;
})[];

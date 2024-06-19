/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
import { Wallet } from 'src/schema/Wallet/wallet.schema';
import { Model } from 'mongoose';
import { UserDocument } from 'src/schema/User/user.schema';
import { Network, NetworkDocument } from 'src/schema/Network/network.schema';
import { CoinDocument } from 'src/schema/Coin/coin.schema';
import { Balance, BalanceDocument } from 'src/schema/Balance/balance.schema';
import { Transaction, TransactionDocument } from 'src/schema/Transaction/transaction.schema';
import { TransactionDTO, UpdateTransactionDTO } from './dto/transaction.dto';
import { SwapDTO, WithdrawDTO, WithdrawFiatDTO } from './dto/withdraw.dto';
import { UtilsService } from '../utils/utils.service';
import { CoinPriceDocument } from 'src/schema/CoinPrice/coin-price.schema';
import { SetFeeDTO } from './dto/setFee.dto';
import { FeeInfo, FeeInfoDocument } from 'src/schema/FeeInfo/fee-info.schema';
import { CurrencyDocument } from 'src/schema/Currency/currency.schema';
import { SendNftDTO } from './dto/send-nft.dto';
import { NFTDocument } from 'src/schema/Nft/nft.schema';
export declare class WalletService {
    private _walletModel;
    private _userModel;
    private _networkModel;
    private _coinModel;
    private _balanceModel;
    private _transactionModel;
    private _coinPriceModel;
    private _feeInfoModel;
    private _currencyModel;
    private _nftModel;
    private utilsService;
    constructor(_walletModel: Model<Wallet>, _userModel: Model<UserDocument>, _networkModel: Model<NetworkDocument>, _coinModel: Model<CoinDocument>, _balanceModel: Model<BalanceDocument>, _transactionModel: Model<TransactionDocument>, _coinPriceModel: Model<CoinPriceDocument>, _feeInfoModel: Model<FeeInfoDocument>, _currencyModel: Model<CurrencyDocument>, _nftModel: Model<NFTDocument>, utilsService: UtilsService);
    encryptData(data: string, encryptionKey: string): any;
    decryptData(data: string, encryptionKey: string): any;
    resetBalance(userId: string): Promise<void>;
    createWallet(userId: any): Promise<import("mongoose").Document<unknown, {}, Wallet> & Wallet & Required<{
        _id: string;
    }>>;
    createEvmWallet(mnemonic: string): {
        address: string;
        privateKey: string;
    };
    createTronWallet(mnemonic: string): {
        address: any;
        privateKey: any;
    };
    createBitcoinWallet(): {
        btcPublicKey: string;
        address: string;
        privateKey: string;
    };
    getDepositAddress(userId: any, networkId: any): Promise<{
        address: string;
        publicKey: string;
    }>;
    getWalletWithBalance(userId: any): Promise<{
        wallet: any;
        balance: any[];
    }>;
    getBtcBalance(walletAddress: string, networkDocument: Network): Promise<{
        balance: number;
        finalBalance: number;
        balanceInUsd: number;
        error: boolean;
        transactions: any[];
    } | {
        balance: number;
        finalBalance?: undefined;
        balanceInUsd?: undefined;
        error?: undefined;
        transactions?: undefined;
    }>;
    getNativeTokenBalance(address: string, rpcUrl: string): Promise<number>;
    getAllEvmBalance(address: string): Promise<{
        address: string;
        type: string;
        name: string;
        symbol: string;
        logoUrl: string;
        balance: number;
    }[]>;
    getTronBalance(address: string): Promise<{
        address: string;
        type: string;
        name: string;
        symbol: string;
        logoUrl: string;
        balance: number;
    }>;
    withdraw(userId: any, withdrawDTO: WithdrawDTO): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Transaction> & Transaction & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, Transaction> & Transaction & Required<{
        _id: string;
    }>>;
    swap(userId: any, swapDTO: SwapDTO): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Transaction> & Transaction & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, Transaction> & Transaction & Required<{
        _id: string;
    }>>;
    withdrawFiat(userId: any, withdrawFiatDTO: WithdrawFiatDTO): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Transaction> & Transaction & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, Transaction> & Transaction & Required<{
        _id: string;
    }>>;
    sendAmount(userId: any, withdrawDTO: WithdrawDTO, isGasFeeTransfer?: boolean): Promise<any>;
    sendAmountFromMaster(withdrawDTO: WithdrawDTO): Promise<any>;
    getTransactions(transactionDTO: TransactionDTO): Promise<any[]>;
    getTransactionsByAdmin(transactionDTO: TransactionDTO): Promise<any[]>;
    updateTransaction(updateTransactionDTO: UpdateTransactionDTO): Promise<{
        message: string;
    }>;
    getStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        newUsers: number;
        withdrawsFiat: number;
    }>;
    createStream(): Promise<string>;
    addAddressToStream(address: any): Promise<{
        message: string;
    }>;
    moralisTransactionWebHook(transactionDto: any): Promise<{
        message: string;
    }>;
    getBalance(walletAddress: string, coin: any, network: Network, walletId: any, userId: any, i: any): Promise<{
        balance: number;
        balanceInUsd: number;
        error: boolean;
        transactions: any;
    }>;
    updateBalance(userId: string, skipBitcoin?: boolean): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Balance> & Balance & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, Balance> & Balance & Required<{
        _id: string;
    }>)[]>;
    updateBalanceForAllUsers(): Promise<void>;
    getNonce(address: any): Promise<{
        nonce: number;
        pending: number;
    }>;
    getFee(): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, FeeInfo> & FeeInfo & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, FeeInfo> & FeeInfo & Required<{
        _id: string;
    }>)[]>;
    setFee(setFeeDto: SetFeeDTO): Promise<{
        message: string;
    }>;
    sendNft(sendNftDto: SendNftDTO, user: any): Promise<{
        message: string;
    }>;
}

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
/// <reference types="mongoose" />
/// <reference types="mongoose/types/inferschematype" />
import { WalletService } from './wallet.service';
import { TransactionDTO, UpdateTransactionDTO } from './dto/transaction.dto';
import { NetworkDTO } from './dto/coinNetwork.dto';
import { SwapDTO, WithdrawDTO, WithdrawFiatDTO } from './dto/withdraw.dto';
import { Request } from 'express';
import { SetFeeDTO } from './dto/setFee.dto';
import { SendNftDTO } from './dto/send-nft.dto';
export declare class WalletController {
    private _walletService;
    constructor(_walletService: WalletService);
    getWalletWithBalance(user: any): Promise<{
        wallet: any;
        balance: any[];
    }>;
    getUserWalletWithBalance(userId: string): Promise<{
        wallet: any;
        balance: any[];
    }>;
    getDepositAddress(user: any, networkDTO: NetworkDTO): Promise<{
        address: string;
        publicKey: string;
    }>;
    withdraw(user: any, withdrawDTO: WithdrawDTO, req: Request): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../../schema/Transaction/transaction.schema").Transaction> & import("../../schema/Transaction/transaction.schema").Transaction & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, import("../../schema/Transaction/transaction.schema").Transaction> & import("../../schema/Transaction/transaction.schema").Transaction & Required<{
        _id: string;
    }>>;
    withdrawFiat(user: any, withdrawFiatDTO: WithdrawFiatDTO): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../../schema/Transaction/transaction.schema").Transaction> & import("../../schema/Transaction/transaction.schema").Transaction & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, import("../../schema/Transaction/transaction.schema").Transaction> & import("../../schema/Transaction/transaction.schema").Transaction & Required<{
        _id: string;
    }>>;
    swap(user: any, swapDTO: SwapDTO, req: Request): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../../schema/Transaction/transaction.schema").Transaction> & import("../../schema/Transaction/transaction.schema").Transaction & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, import("../../schema/Transaction/transaction.schema").Transaction> & import("../../schema/Transaction/transaction.schema").Transaction & Required<{
        _id: string;
    }>>;
    getTransactions(transactionDTO: TransactionDTO, user: any): Promise<any[]>;
    getTransactionsByAdmin(transactionDTO: TransactionDTO, user: any): Promise<any[]>;
    updateTransaction(updateTransactionDTO: UpdateTransactionDTO, user: any): Promise<{
        message: string;
    }>;
    getStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        newUsers: number;
        withdrawsFiat: number;
    }>;
    moralisTransactionWebHook(transactionDto: any): Promise<{
        message: string;
    }>;
    getNonce(address: string): Promise<{
        nonce: number;
        pending: number;
    }>;
    getFee(): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("../../schema/FeeInfo/fee-info.schema").FeeInfo> & import("../../schema/FeeInfo/fee-info.schema").FeeInfo & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, import("../../schema/FeeInfo/fee-info.schema").FeeInfo> & import("../../schema/FeeInfo/fee-info.schema").FeeInfo & Required<{
        _id: string;
    }>)[]>;
    setFee(setFeeDto: SetFeeDTO): Promise<{
        message: string;
    }>;
    sendNft(sendNftDto: SendNftDTO, user: any): Promise<{
        message: string;
    }>;
}

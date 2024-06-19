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
import { HydratedDocument } from 'mongoose';
export type TransactionDocument = HydratedDocument<Transaction>;
export declare class Transaction {
    _id: string;
    userId: string;
    walletId: string;
    fromAddress: string;
    toAddress: string;
    coinId: string;
    type: string;
    amount: number;
    fee: number;
    swapFee: number;
    balance: number;
    swappedAmount: number;
    swappedPrice: number;
    trxHash: string;
    trxUrl: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    status: string;
    currencyId: string;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, import("mongoose").Document<unknown, any, Transaction> & Transaction & Required<{
    _id: string;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, import("mongoose").Document<unknown, {}, Transaction> & Transaction & Required<{
    _id: string;
}>>;

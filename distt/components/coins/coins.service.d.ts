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
import { Model } from 'mongoose';
import { CoinDocument } from 'src/schema/Coin/coin.schema';
import { Network, NetworkDocument } from 'src/schema/Network/network.schema';
import { Currency, CurrencyDocument } from 'src/schema/Currency/currency.schema';
import { CoinPriceDocument } from 'src/schema/CoinPrice/coin-price.schema';
import { FeeInfoDocument } from 'src/schema/FeeInfo/fee-info.schema';
export declare class CoinsService {
    private _coinModel;
    private _networkModel;
    private _currencyModel;
    private _coinPriceModel;
    private _feeInfoModel;
    constructor(_coinModel: Model<CoinDocument>, _networkModel: Model<NetworkDocument>, _currencyModel: Model<CurrencyDocument>, _coinPriceModel: Model<CoinPriceDocument>, _feeInfoModel: Model<FeeInfoDocument>);
    initDbCoins(): Promise<void>;
    getCurrencies(limit: number, offset: number, currencyName: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Currency> & Currency & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, Currency> & Currency & Required<{
        _id: string;
    }>)[]>;
    getCoins(limit: number, offset: number, coinId: string, networkId: string, amount?: number): Promise<any[]>;
    getCoinsPrice(limit: number, offset: number, coinNameSearch: string, networkId: string, currencyId: string): Promise<any[]>;
    updatePriceFromCoin(): Promise<void>;
    getNetworks(): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, Network> & Network & Required<{
        _id: string;
    }>> & import("mongoose").Document<unknown, {}, Network> & Network & Required<{
        _id: string;
    }>)[]>;
    updatePrice(coin: CoinDocument, currencies: CurrencyDocument[]): Promise<import("mongoose").UpdateWriteOpResult[]>;
    updatePriceForAllCurrencies(): Promise<void>;
    getCoinPrice(coinId: string, currencyId: string): Promise<void>;
    addCurrencies(): Promise<void>;
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const coin_schema_1 = require("../../schema/Coin/coin.schema");
const network_schema_1 = require("../../schema/Network/network.schema");
const currency_schema_1 = require("../../schema/Currency/currency.schema");
const coin_price_schema_1 = require("../../schema/CoinPrice/coin-price.schema");
const schedule_1 = require("@nestjs/schedule");
const fee_info_schema_1 = require("../../schema/FeeInfo/fee-info.schema");
const utils_1 = require("../../utils/utils");
const Web3 = require('web3');
let CoinsService = class CoinsService {
    constructor(_coinModel, _networkModel, _currencyModel, _coinPriceModel, _feeInfoModel) {
        this._coinModel = _coinModel;
        this._networkModel = _networkModel;
        this._currencyModel = _currencyModel;
        this._coinPriceModel = _coinPriceModel;
        this._feeInfoModel = _feeInfoModel;
        this.addCurrencies();
        this.initDbCoins();
    }
    async initDbCoins() {
        try {
            let withdrawFeeDocument = await this._feeInfoModel.findOne({ feeName: "withdraw_fiat_fee" });
            if (!withdrawFeeDocument) {
                await new this._feeInfoModel({
                    feeName: "withdraw_fiat_fee",
                    feePercentage: 2,
                }).save();
            }
            let swapFeeDocument = await this._feeInfoModel.findOne({ feeName: "swap_fee" });
            if (!swapFeeDocument) {
                await new this._feeInfoModel({
                    feeName: "swap_fee",
                    feePercentage: 2,
                }).save();
            }
            if (process.env.IS_INSERT_COINS == "true") {
                console.log(process.env.IS_INSERT_COINS);
                for (const dbCoin of utils_1.dbCoins) {
                    let networkDocument = await this._networkModel.findOne({ name: dbCoin.networkId.name });
                    if (!networkDocument) {
                        networkDocument = await new this._networkModel({
                            name: dbCoin.networkId.name,
                            chainId: dbCoin.networkId.chainId,
                            symbol: dbCoin.networkId.symbol,
                            logoUrl: dbCoin.networkId.logoUrl,
                            rpcUrl: dbCoin.networkId.rpcUrl,
                            isMainnet: dbCoin.networkId.isMainnet,
                            networkName: dbCoin.networkId.networkName,
                            networkType: dbCoin.networkId.networkType,
                            isDeleted: false,
                            isActive: true,
                        }).save();
                    }
                    const coinDocument = await this._coinModel.findOne({ name: dbCoin.name });
                    if (!coinDocument) {
                        await new this._coinModel({
                            name: dbCoin.name,
                            symbol: dbCoin.symbol,
                            icon: dbCoin.icon,
                            coinNameId: dbCoin.coinNameId,
                            isToken: dbCoin.isToken,
                            contractAddress: dbCoin.contractAddress,
                            decimal: dbCoin.decimal,
                            price: 0,
                            priceFormer: 0,
                            priceMarket: 0,
                            swapFee: dbCoin.swapFee,
                            networkId: networkDocument.id,
                            isActive: true,
                            priceChange: 0,
                            sort: dbCoin.sort,
                            unit: dbCoin.unit,
                            isDeleted: false,
                        }).save();
                    }
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    ;
    async getCurrencies(limit, offset, currencyName) {
        limit = limit ? Number(limit) : 10;
        offset = offset ? Number(offset) : 0;
        let query = {};
        if (currencyName) {
            const regex = new RegExp(currencyName, 'i');
            query = {
                ...query,
                name: { $regex: regex },
            };
        }
        const currencies = await this._currencyModel
            .find(query)
            .sort({ name: 1 })
            .skip(offset)
            .limit(limit);
        return currencies;
    }
    async getCoins(limit, offset, coinId, networkId, amount = 1) {
        try {
            limit = limit ? Number(limit) : 10;
            offset = offset ? Number(offset) : 0;
            amount = amount ? Number(amount) : 1;
            let query = {};
            if (coinId) {
                query = {
                    ...query,
                    _id: coinId,
                };
            }
            if (networkId) {
                query = {
                    ...query,
                    networkId: networkId,
                };
            }
            let coinsData = await this._coinModel
                .find({ isDeleted: false, isActive: true, ...query })
                .sort({ sort: 1 })
                .populate('networkId')
                .skip(offset)
                .limit(limit);
            let coins = coinsData.map((coinItem) => {
                let coinReturn = JSON.parse(JSON.stringify(coinItem));
                let amountAfterFee = amount;
                if (coinItem.swapFee) {
                    amountAfterFee = amountAfterFee - coinItem.swapFee;
                }
                coinReturn.swapAmount = coinItem.price * amountAfterFee;
                return coinReturn;
            });
            return coins;
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err.message);
        }
    }
    async getCoinsPrice(limit, offset, coinNameSearch, networkId, currencyId) {
        try {
            limit = limit ? Number(limit) : 10;
            offset = offset ? Number(offset) : 0;
            let query = {};
            if (coinNameSearch) {
                query = {
                    ...query,
                    name: { $regex: coinNameSearch, $options: 'i' },
                };
            }
            if (networkId) {
                query = {
                    ...query,
                    networkId: networkId,
                };
            }
            if (currencyId) {
                query = {
                    ...query,
                    currencyId: currencyId,
                };
            }
            const coins = await this._coinPriceModel
                .aggregate([
                {
                    $match: {
                        ...query,
                    },
                },
                {
                    $lookup: {
                        from: 'coins',
                        localField: 'coinId',
                        foreignField: '_id',
                        as: 'coin',
                    },
                },
                {
                    $unwind: '$coin',
                },
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'currencyId',
                        foreignField: '_id',
                        as: 'currency',
                    },
                },
                {
                    $unwind: '$currency',
                },
                {
                    $skip: offset,
                },
                {
                    $limit: limit,
                },
                {
                    $addFields: {
                        displayName: '$coin.symbol' + '/' + '$currency.symbol',
                        id: '$_id',
                        coinId: '$coin._id',
                        coinNameId: '$coin.coinNameId',
                        currencyName: '$currency.name',
                        currencySymbol: '$currency.symbol',
                        name: '$coin.name',
                        symbol: '$coin.symbol',
                        icon: '$coin.icon',
                        price: '$price',
                        priceMarket: '$priceMarket',
                        priceChange: '$priceChange',
                    },
                },
                {
                    $project: {
                        displayName: 1,
                        id: 1,
                        coinId: 1,
                        coinNameId: 1,
                        currencyName: 1,
                        currencySymbol: 1,
                        name: 1,
                        symbol: 1,
                        icon: 1,
                        price: 1,
                        priceMarket: 1,
                        priceChange: 1,
                    },
                },
            ])
                .then((coins) => {
                return coins.map((coin) => {
                    return {
                        ...coin,
                        displayName: `${coin?.symbol}/${coin?.currencySymbol}`,
                    };
                });
            });
            return coins;
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err.message);
        }
    }
    async updatePriceFromCoin() {
        try {
        }
        catch (err) {
            console.log(err?.message);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async getNetworks() {
        try {
            let networkData = await this._networkModel
                .find({ isDeleted: false })
                .sort({ name: -1 });
            return networkData;
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err.message);
        }
    }
    async updatePrice(coin, currencies) {
        try {
            if (!coin) {
                throw new Error('Coin not found');
            }
            const url = `${process.env.COINGECKO_API_URL}coins/${coin?.coinNameId}`;
            const response = await fetch(url);
            const data = await response.json();
            return await Promise.all(currencies.map(async (currency) => {
                const price = data?.market_data?.current_price?.[currency?.coinGeckoId];
                const priceChange = data?.market_data?.[`price_change_percentage_24h_in_currency`]?.[currency?.coinGeckoId];
                const priceMarket = data?.market_data?.[`market_cap`]?.[currency?.coinGeckoId];
                console.log('updating price for', coin?.name, currency?.name, price, priceChange, priceMarket);
                if (!price) {
                    return;
                }
                return await this._coinPriceModel.updateOne({
                    coinId: coin?.id,
                    currencyId: currency?.id,
                }, {
                    price: price,
                    priceChange: priceChange,
                    priceMarket: priceMarket,
                    networkId: coin?.networkId,
                    name: coin?.name,
                }, { upsert: true });
            }));
        }
        catch (err) {
            console.log(err);
        }
    }
    async updatePriceForAllCurrencies() {
        try {
            const allCurrencies = await this._currencyModel.find({
                isDeleted: false,
                isActive: true,
            });
            const allCoins = await this._coinModel.find({
                isDeleted: false,
                isActive: true,
            });
            await Promise.all(allCoins.map(async (coin) => {
                await this.updatePrice(coin, allCurrencies);
            }));
        }
        catch (err) {
            console.log(err);
        }
    }
    async getCoinPrice(coinId, currencyId) {
        try {
            const coinPrice = await this._coinPriceModel.aggregate([
                {
                    $match: {
                        coinId: coinId,
                        currencyId: currencyId,
                    },
                },
                {
                    $lookup: {
                        from: 'coins',
                        localField: 'coinId',
                        foreignField: '_id',
                        as: 'coin',
                    },
                },
                {
                    $unwind: '$coin',
                },
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'currencyId',
                        foreignField: '_id',
                        as: 'currency',
                    },
                },
                {
                    $unwind: '$currency',
                },
                {
                    $addFields: {
                        displayName: '$coin.symbol' + '/' + '$currency.symbol',
                        id: '$_id',
                        'coin.id': '$coin._id',
                        'currency.id': '$currency._id',
                    },
                },
                {
                    $project: {
                        _id: 0,
                        'coin._id': 0,
                        'currency._id': 0,
                    },
                },
            ]);
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err.message);
        }
    }
    async addCurrencies() {
        try {
            const coinGeckoCoins = [
                'aed',
                'ars',
                'aud',
                'bch',
                'bdt',
                'bhd',
                'bmd',
                'bnb',
                'brl',
                'btc',
                'cad',
                'chf',
                'clp',
                'cny',
                'czk',
                'dkk',
                'dot',
                'eos',
                'eth',
                'eur',
                'gbp',
                'hkd',
                'huf',
                'idr',
                'ils',
                'inr',
                'jpy',
                'krw',
                'kwd',
                'lkr',
                'ltc',
                'mmk',
                'mxn',
                'myr',
                'ngn',
                'nok',
                'nzd',
                'php',
                'pkr',
                'pln',
                'rub',
                'sar',
                'sek',
                'sgd',
                'thb',
                'try',
                'twd',
                'uah',
                'usd',
                'vef',
                'vnd',
                'xag',
                'xau',
                'xdr',
                'xlm',
                'xrp',
                'yfi',
                'zar',
                'bits',
                'link',
                'sats',
            ];
            const coinsData = [
                {
                    symbol: '$',
                    name: 'US Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'USD',
                    name_plural: 'US dollars',
                },
                {
                    symbol: 'CA$',
                    name: 'Canadian Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'CAD',
                    name_plural: 'Canadian dollars',
                },
                {
                    symbol: '€',
                    name: 'Euro',
                    symbol_native: '€',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'EUR',
                    name_plural: 'euros',
                },
                {
                    symbol: 'AED',
                    name: 'United Arab Emirates Dirham',
                    symbol_native: 'د.إ.‏',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'AED',
                    name_plural: 'UAE dirhams',
                },
                {
                    symbol: 'Af',
                    name: 'Afghan Afghani',
                    symbol_native: '؋',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'AFN',
                    name_plural: 'Afghan Afghanis',
                },
                {
                    symbol: 'ALL',
                    name: 'Albanian Lek',
                    symbol_native: 'Lek',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'ALL',
                    name_plural: 'Albanian lekë',
                },
                {
                    symbol: 'AMD',
                    name: 'Armenian Dram',
                    symbol_native: 'դր.',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'AMD',
                    name_plural: 'Armenian drams',
                },
                {
                    symbol: 'AR$',
                    name: 'Argentine Peso',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'ARS',
                    name_plural: 'Argentine pesos',
                },
                {
                    symbol: 'AU$',
                    name: 'Australian Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'AUD',
                    name_plural: 'Australian dollars',
                },
                {
                    symbol: 'man.',
                    name: 'Azerbaijani Manat',
                    symbol_native: 'ман.',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'AZN',
                    name_plural: 'Azerbaijani manats',
                },
                {
                    symbol: 'KM',
                    name: 'Bosnia-Herzegovina Convertible Mark',
                    symbol_native: 'KM',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'BAM',
                    name_plural: 'Bosnia-Herzegovina convertible marks',
                },
                {
                    symbol: 'Tk',
                    name: 'Bangladeshi Taka',
                    symbol_native: '৳',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'BDT',
                    name_plural: 'Bangladeshi takas',
                },
                {
                    symbol: 'BGN',
                    name: 'Bulgarian Lev',
                    symbol_native: 'лв.',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'BGN',
                    name_plural: 'Bulgarian leva',
                },
                {
                    symbol: 'BD',
                    name: 'Bahraini Dinar',
                    symbol_native: 'د.ب.‏',
                    decimal_digits: 3,
                    rounding: 0,
                    code: 'BHD',
                    name_plural: 'Bahraini dinars',
                },
                {
                    symbol: 'FBu',
                    name: 'Burundian Franc',
                    symbol_native: 'FBu',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'BIF',
                    name_plural: 'Burundian francs',
                },
                {
                    symbol: 'BN$',
                    name: 'Brunei Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'BND',
                    name_plural: 'Brunei dollars',
                },
                {
                    symbol: 'Bs',
                    name: 'Bolivian Boliviano',
                    symbol_native: 'Bs',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'BOB',
                    name_plural: 'Bolivian bolivianos',
                },
                {
                    symbol: 'R$',
                    name: 'Brazilian Real',
                    symbol_native: 'R$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'BRL',
                    name_plural: 'Brazilian reals',
                },
                {
                    symbol: 'BWP',
                    name: 'Botswanan Pula',
                    symbol_native: 'P',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'BWP',
                    name_plural: 'Botswanan pulas',
                },
                {
                    symbol: 'Br',
                    name: 'Belarusian Ruble',
                    symbol_native: 'руб.',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'BYN',
                    name_plural: 'Belarusian rubles',
                },
                {
                    symbol: 'BZ$',
                    name: 'Belize Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'BZD',
                    name_plural: 'Belize dollars',
                },
                {
                    symbol: 'CDF',
                    name: 'Congolese Franc',
                    symbol_native: 'FrCD',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'CDF',
                    name_plural: 'Congolese francs',
                },
                {
                    symbol: 'CHF',
                    name: 'Swiss Franc',
                    symbol_native: 'CHF',
                    decimal_digits: 2,
                    rounding: 0.05,
                    code: 'CHF',
                    name_plural: 'Swiss francs',
                },
                {
                    symbol: 'CL$',
                    name: 'Chilean Peso',
                    symbol_native: '$',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'CLP',
                    name_plural: 'Chilean pesos',
                },
                {
                    symbol: 'CN¥',
                    name: 'Chinese Yuan',
                    symbol_native: 'CN¥',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'CNY',
                    name_plural: 'Chinese yuan',
                },
                {
                    symbol: 'CO$',
                    name: 'Colombian Peso',
                    symbol_native: '$',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'COP',
                    name_plural: 'Colombian pesos',
                },
                {
                    symbol: '₡',
                    name: 'Costa Rican Colón',
                    symbol_native: '₡',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'CRC',
                    name_plural: 'Costa Rican colóns',
                },
                {
                    symbol: 'CV$',
                    name: 'Cape Verdean Escudo',
                    symbol_native: 'CV$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'CVE',
                    name_plural: 'Cape Verdean escudos',
                },
                {
                    symbol: 'Kč',
                    name: 'Czech Republic Koruna',
                    symbol_native: 'Kč',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'CZK',
                    name_plural: 'Czech Republic korunas',
                },
                {
                    symbol: 'Fdj',
                    name: 'Djiboutian Franc',
                    symbol_native: 'Fdj',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'DJF',
                    name_plural: 'Djiboutian francs',
                },
                {
                    symbol: 'Dkr',
                    name: 'Danish Krone',
                    symbol_native: 'kr',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'DKK',
                    name_plural: 'Danish kroner',
                },
                {
                    symbol: 'RD$',
                    name: 'Dominican Peso',
                    symbol_native: 'RD$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'DOP',
                    name_plural: 'Dominican pesos',
                },
                {
                    symbol: 'DA',
                    name: 'Algerian Dinar',
                    symbol_native: 'د.ج.‏',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'DZD',
                    name_plural: 'Algerian dinars',
                },
                {
                    symbol: 'Ekr',
                    name: 'Estonian Kroon',
                    symbol_native: 'kr',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'EEK',
                    name_plural: 'Estonian kroons',
                },
                {
                    symbol: 'EGP',
                    name: 'Egyptian Pound',
                    symbol_native: 'ج.م.‏',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'EGP',
                    name_plural: 'Egyptian pounds',
                },
                {
                    symbol: 'Nfk',
                    name: 'Eritrean Nakfa',
                    symbol_native: 'Nfk',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'ERN',
                    name_plural: 'Eritrean nakfas',
                },
                {
                    symbol: 'Br',
                    name: 'Ethiopian Birr',
                    symbol_native: 'Br',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'ETB',
                    name_plural: 'Ethiopian birrs',
                },
                {
                    symbol: '£',
                    name: 'British Pound Sterling',
                    symbol_native: '£',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'GBP',
                    name_plural: 'British pounds sterling',
                },
                {
                    symbol: 'GEL',
                    name: 'Georgian Lari',
                    symbol_native: 'GEL',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'GEL',
                    name_plural: 'Georgian laris',
                },
                {
                    symbol: 'GH₵',
                    name: 'Ghanaian Cedi',
                    symbol_native: 'GH₵',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'GHS',
                    name_plural: 'Ghanaian cedis',
                },
                {
                    symbol: 'FG',
                    name: 'Guinean Franc',
                    symbol_native: 'FG',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'GNF',
                    name_plural: 'Guinean francs',
                },
                {
                    symbol: 'GTQ',
                    name: 'Guatemalan Quetzal',
                    symbol_native: 'Q',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'GTQ',
                    name_plural: 'Guatemalan quetzals',
                },
                {
                    symbol: 'HK$',
                    name: 'Hong Kong Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'HKD',
                    name_plural: 'Hong Kong dollars',
                },
                {
                    symbol: 'HNL',
                    name: 'Honduran Lempira',
                    symbol_native: 'L',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'HNL',
                    name_plural: 'Honduran lempiras',
                },
                {
                    symbol: 'kn',
                    name: 'Croatian Kuna',
                    symbol_native: 'kn',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'HRK',
                    name_plural: 'Croatian kunas',
                },
                {
                    symbol: 'Ft',
                    name: 'Hungarian Forint',
                    symbol_native: 'Ft',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'HUF',
                    name_plural: 'Hungarian forints',
                },
                {
                    symbol: 'Rp',
                    name: 'Indonesian Rupiah',
                    symbol_native: 'Rp',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'IDR',
                    name_plural: 'Indonesian rupiahs',
                },
                {
                    symbol: '₪',
                    name: 'Israeli New Sheqel',
                    symbol_native: '₪',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'ILS',
                    name_plural: 'Israeli new sheqels',
                },
                {
                    symbol: 'Rs',
                    name: 'Indian Rupee',
                    symbol_native: 'টকা',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'INR',
                    name_plural: 'Indian rupees',
                },
                {
                    symbol: 'IQD',
                    name: 'Iraqi Dinar',
                    symbol_native: 'د.ع.‏',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'IQD',
                    name_plural: 'Iraqi dinars',
                },
                {
                    symbol: 'IRR',
                    name: 'Iranian Rial',
                    symbol_native: '﷼',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'IRR',
                    name_plural: 'Iranian rials',
                },
                {
                    symbol: 'Ikr',
                    name: 'Icelandic Króna',
                    symbol_native: 'kr',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'ISK',
                    name_plural: 'Icelandic krónur',
                },
                {
                    symbol: 'J$',
                    name: 'Jamaican Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'JMD',
                    name_plural: 'Jamaican dollars',
                },
                {
                    symbol: 'JD',
                    name: 'Jordanian Dinar',
                    symbol_native: 'د.أ.‏',
                    decimal_digits: 3,
                    rounding: 0,
                    code: 'JOD',
                    name_plural: 'Jordanian dinars',
                },
                {
                    symbol: '¥',
                    name: 'Japanese Yen',
                    symbol_native: '￥',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'JPY',
                    name_plural: 'Japanese yen',
                },
                {
                    symbol: 'Ksh',
                    name: 'Kenyan Shilling',
                    symbol_native: 'Ksh',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'KES',
                    name_plural: 'Kenyan shillings',
                },
                {
                    symbol: 'KHR',
                    name: 'Cambodian Riel',
                    symbol_native: '៛',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'KHR',
                    name_plural: 'Cambodian riels',
                },
                {
                    symbol: 'CF',
                    name: 'Comorian Franc',
                    symbol_native: 'FC',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'KMF',
                    name_plural: 'Comorian francs',
                },
                {
                    symbol: '₩',
                    name: 'South Korean Won',
                    symbol_native: '₩',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'KRW',
                    name_plural: 'South Korean won',
                },
                {
                    symbol: 'KD',
                    name: 'Kuwaiti Dinar',
                    symbol_native: 'د.ك.‏',
                    decimal_digits: 3,
                    rounding: 0,
                    code: 'KWD',
                    name_plural: 'Kuwaiti dinars',
                },
                {
                    symbol: 'KZT',
                    name: 'Kazakhstani Tenge',
                    symbol_native: 'тңг.',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'KZT',
                    name_plural: 'Kazakhstani tenges',
                },
                {
                    symbol: 'L.L.',
                    name: 'Lebanese Pound',
                    symbol_native: 'ل.ل.‏',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'LBP',
                    name_plural: 'Lebanese pounds',
                },
                {
                    symbol: 'SLRs',
                    name: 'Sri Lankan Rupee',
                    symbol_native: 'SL Re',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'LKR',
                    name_plural: 'Sri Lankan rupees',
                },
                {
                    symbol: 'Lt',
                    name: 'Lithuanian Litas',
                    symbol_native: 'Lt',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'LTL',
                    name_plural: 'Lithuanian litai',
                },
                {
                    symbol: 'Ls',
                    name: 'Latvian Lats',
                    symbol_native: 'Ls',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'LVL',
                    name_plural: 'Latvian lati',
                },
                {
                    symbol: 'LD',
                    name: 'Libyan Dinar',
                    symbol_native: 'د.ل.‏',
                    decimal_digits: 3,
                    rounding: 0,
                    code: 'LYD',
                    name_plural: 'Libyan dinars',
                },
                {
                    symbol: 'MAD',
                    name: 'Moroccan Dirham',
                    symbol_native: 'د.م.‏',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'MAD',
                    name_plural: 'Moroccan dirhams',
                },
                {
                    symbol: 'MDL',
                    name: 'Moldovan Leu',
                    symbol_native: 'MDL',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'MDL',
                    name_plural: 'Moldovan lei',
                },
                {
                    symbol: 'MGA',
                    name: 'Malagasy Ariary',
                    symbol_native: 'MGA',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'MGA',
                    name_plural: 'Malagasy Ariaries',
                },
                {
                    symbol: 'MKD',
                    name: 'Macedonian Denar',
                    symbol_native: 'MKD',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'MKD',
                    name_plural: 'Macedonian denari',
                },
                {
                    symbol: 'MMK',
                    name: 'Myanma Kyat',
                    symbol_native: 'K',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'MMK',
                    name_plural: 'Myanma kyats',
                },
                {
                    symbol: 'MOP$',
                    name: 'Macanese Pataca',
                    symbol_native: 'MOP$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'MOP',
                    name_plural: 'Macanese patacas',
                },
                {
                    symbol: 'MURs',
                    name: 'Mauritian Rupee',
                    symbol_native: 'MURs',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'MUR',
                    name_plural: 'Mauritian rupees',
                },
                {
                    symbol: 'MX$',
                    name: 'Mexican Peso',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'MXN',
                    name_plural: 'Mexican pesos',
                },
                {
                    symbol: 'RM',
                    name: 'Malaysian Ringgit',
                    symbol_native: 'RM',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'MYR',
                    name_plural: 'Malaysian ringgits',
                },
                {
                    symbol: 'MTn',
                    name: 'Mozambican Metical',
                    symbol_native: 'MTn',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'MZN',
                    name_plural: 'Mozambican meticals',
                },
                {
                    symbol: 'N$',
                    name: 'Namibian Dollar',
                    symbol_native: 'N$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'NAD',
                    name_plural: 'Namibian dollars',
                },
                {
                    symbol: '₦',
                    name: 'Nigerian Naira',
                    symbol_native: '₦',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'NGN',
                    name_plural: 'Nigerian nairas',
                },
                {
                    symbol: 'C$',
                    name: 'Nicaraguan Córdoba',
                    symbol_native: 'C$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'NIO',
                    name_plural: 'Nicaraguan córdobas',
                },
                {
                    symbol: 'Nkr',
                    name: 'Norwegian Krone',
                    symbol_native: 'kr',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'NOK',
                    name_plural: 'Norwegian kroner',
                },
                {
                    symbol: 'NPRs',
                    name: 'Nepalese Rupee',
                    symbol_native: 'नेरू',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'NPR',
                    name_plural: 'Nepalese rupees',
                },
                {
                    symbol: 'NZ$',
                    name: 'New Zealand Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'NZD',
                    name_plural: 'New Zealand dollars',
                },
                {
                    symbol: 'OMR',
                    name: 'Omani Rial',
                    symbol_native: 'ر.ع.‏',
                    decimal_digits: 3,
                    rounding: 0,
                    code: 'OMR',
                    name_plural: 'Omani rials',
                },
                {
                    symbol: 'B/.',
                    name: 'Panamanian Balboa',
                    symbol_native: 'B/.',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'PAB',
                    name_plural: 'Panamanian balboas',
                },
                {
                    symbol: 'S/.',
                    name: 'Peruvian Nuevo Sol',
                    symbol_native: 'S/.',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'PEN',
                    name_plural: 'Peruvian nuevos soles',
                },
                {
                    symbol: '₱',
                    name: 'Philippine Peso',
                    symbol_native: '₱',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'PHP',
                    name_plural: 'Philippine pesos',
                },
                {
                    symbol: 'PKRs',
                    name: 'Pakistani Rupee',
                    symbol_native: '₨',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'PKR',
                    name_plural: 'Pakistani rupees',
                },
                {
                    symbol: 'zł',
                    name: 'Polish Zloty',
                    symbol_native: 'zł',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'PLN',
                    name_plural: 'Polish zlotys',
                },
                {
                    symbol: '₲',
                    name: 'Paraguayan Guarani',
                    symbol_native: '₲',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'PYG',
                    name_plural: 'Paraguayan guaranis',
                },
                {
                    symbol: 'QR',
                    name: 'Qatari Rial',
                    symbol_native: 'ر.ق.‏',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'QAR',
                    name_plural: 'Qatari rials',
                },
                {
                    symbol: 'RON',
                    name: 'Romanian Leu',
                    symbol_native: 'RON',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'RON',
                    name_plural: 'Romanian lei',
                },
                {
                    symbol: 'din.',
                    name: 'Serbian Dinar',
                    symbol_native: 'дин.',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'RSD',
                    name_plural: 'Serbian dinars',
                },
                {
                    symbol: 'RUB',
                    name: 'Russian Ruble',
                    symbol_native: '₽.',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'RUB',
                    name_plural: 'Russian rubles',
                },
                {
                    symbol: 'RWF',
                    name: 'Rwandan Franc',
                    symbol_native: 'FR',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'RWF',
                    name_plural: 'Rwandan francs',
                },
                {
                    symbol: 'SR',
                    name: 'Saudi Riyal',
                    symbol_native: 'ر.س.‏',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'SAR',
                    name_plural: 'Saudi riyals',
                },
                {
                    symbol: 'SDG',
                    name: 'Sudanese Pound',
                    symbol_native: 'SDG',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'SDG',
                    name_plural: 'Sudanese pounds',
                },
                {
                    symbol: 'Skr',
                    name: 'Swedish Krona',
                    symbol_native: 'kr',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'SEK',
                    name_plural: 'Swedish kronor',
                },
                {
                    symbol: 'S$',
                    name: 'Singapore Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'SGD',
                    name_plural: 'Singapore dollars',
                },
                {
                    symbol: 'Ssh',
                    name: 'Somali Shilling',
                    symbol_native: 'Ssh',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'SOS',
                    name_plural: 'Somali shillings',
                },
                {
                    symbol: 'SY£',
                    name: 'Syrian Pound',
                    symbol_native: 'ل.س.‏',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'SYP',
                    name_plural: 'Syrian pounds',
                },
                {
                    symbol: '฿',
                    name: 'Thai Baht',
                    symbol_native: '฿',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'THB',
                    name_plural: 'Thai baht',
                },
                {
                    symbol: 'DT',
                    name: 'Tunisian Dinar',
                    symbol_native: 'د.ت.‏',
                    decimal_digits: 3,
                    rounding: 0,
                    code: 'TND',
                    name_plural: 'Tunisian dinars',
                },
                {
                    symbol: 'T$',
                    name: 'Tongan Paʻanga',
                    symbol_native: 'T$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'TOP',
                    name_plural: 'Tongan paʻanga',
                },
                {
                    symbol: 'TL',
                    name: 'Turkish Lira',
                    symbol_native: 'TL',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'TRY',
                    name_plural: 'Turkish Lira',
                },
                {
                    symbol: 'TT$',
                    name: 'Trinidad and Tobago Dollar',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'TTD',
                    name_plural: 'Trinidad and Tobago dollars',
                },
                {
                    symbol: 'NT$',
                    name: 'New Taiwan Dollar',
                    symbol_native: 'NT$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'TWD',
                    name_plural: 'New Taiwan dollars',
                },
                {
                    symbol: 'TSh',
                    name: 'Tanzanian Shilling',
                    symbol_native: 'TSh',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'TZS',
                    name_plural: 'Tanzanian shillings',
                },
                {
                    symbol: '₴',
                    name: 'Ukrainian Hryvnia',
                    symbol_native: '₴',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'UAH',
                    name_plural: 'Ukrainian hryvnias',
                },
                {
                    symbol: 'USh',
                    name: 'Ugandan Shilling',
                    symbol_native: 'USh',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'UGX',
                    name_plural: 'Ugandan shillings',
                },
                {
                    symbol: '$U',
                    name: 'Uruguayan Peso',
                    symbol_native: '$',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'UYU',
                    name_plural: 'Uruguayan pesos',
                },
                {
                    symbol: 'UZS',
                    name: 'Uzbekistan Som',
                    symbol_native: 'UZS',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'UZS',
                    name_plural: 'Uzbekistan som',
                },
                {
                    symbol: 'Bs.F.',
                    name: 'Venezuelan Bolívar',
                    symbol_native: 'Bs.F.',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'VEF',
                    name_plural: 'Venezuelan bolívars',
                },
                {
                    symbol: '₫',
                    name: 'Vietnamese Dong',
                    symbol_native: '₫',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'VND',
                    name_plural: 'Vietnamese dong',
                },
                {
                    symbol: 'FCFA',
                    name: 'CFA Franc BEAC',
                    symbol_native: 'FCFA',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'XAF',
                    name_plural: 'CFA francs BEAC',
                },
                {
                    symbol: 'CFA',
                    name: 'CFA Franc BCEAO',
                    symbol_native: 'CFA',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'XOF',
                    name_plural: 'CFA francs BCEAO',
                },
                {
                    symbol: 'YR',
                    name: 'Yemeni Rial',
                    symbol_native: 'ر.ي.‏',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'YER',
                    name_plural: 'Yemeni rials',
                },
                {
                    symbol: 'R',
                    name: 'South African Rand',
                    symbol_native: 'R',
                    decimal_digits: 2,
                    rounding: 0,
                    code: 'ZAR',
                    name_plural: 'South African rand',
                },
                {
                    symbol: 'ZK',
                    name: 'Zambian Kwacha',
                    symbol_native: 'ZK',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'ZMK',
                    name_plural: 'Zambian kwachas',
                },
                {
                    symbol: 'ZWL$',
                    name: 'Zimbabwean Dollar',
                    symbol_native: 'ZWL$',
                    decimal_digits: 0,
                    rounding: 0,
                    code: 'ZWL',
                    name_plural: 'Zimbabwean Dollar',
                },
            ];
            await Promise.all(coinGeckoCoins.map(async (coin) => {
                const isCurrencyExists = await this._currencyModel.findOne({
                    coinGeckoId: coin,
                });
                if (!isCurrencyExists) {
                    const coinData = coinsData?.find((coinData) => coinData.code?.toLowerCase() === coin);
                    if (!coinData) {
                        return;
                    }
                    const currency = new this._currencyModel({
                        name: coinData?.name,
                        symbol: coinData?.symbol,
                        coinGeckoId: coin,
                        logoUrl: '',
                        isDeleted: false,
                        isActive: true,
                    }).save();
                    return currency;
                }
            }));
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err.message);
        }
    }
};
exports.CoinsService = CoinsService;
__decorate([
    (0, schedule_1.Cron)('0 */5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoinsService.prototype, "updatePriceForAllCurrencies", null);
exports.CoinsService = CoinsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(coin_schema_1.Coin.name)),
    __param(1, (0, mongoose_1.InjectModel)(network_schema_1.Network.name)),
    __param(2, (0, mongoose_1.InjectModel)(currency_schema_1.Currency.name)),
    __param(3, (0, mongoose_1.InjectModel)(coin_price_schema_1.CoinPrice.name)),
    __param(4, (0, mongoose_1.InjectModel)(fee_info_schema_1.FeeInfo.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], CoinsService);
//# sourceMappingURL=coins.service.js.map
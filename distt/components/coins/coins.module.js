"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinsModule = void 0;
const common_1 = require("@nestjs/common");
const coins_controller_1 = require("./coins.controller");
const coins_service_1 = require("./coins.service");
const mongoose_1 = require("@nestjs/mongoose");
const coin_schema_1 = require("../../schema/Coin/coin.schema");
const network_schema_1 = require("../../schema/Network/network.schema");
const currency_schema_1 = require("../../schema/Currency/currency.schema");
const coin_price_schema_1 = require("../../schema/CoinPrice/coin-price.schema");
const fee_info_schema_1 = require("../../schema/FeeInfo/fee-info.schema");
let CoinsModule = class CoinsModule {
};
exports.CoinsModule = CoinsModule;
exports.CoinsModule = CoinsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: coin_schema_1.Coin.name, schema: coin_schema_1.CoinSchema },
                { name: network_schema_1.Network.name, schema: network_schema_1.NetworkSchema },
                { name: currency_schema_1.Currency.name, schema: currency_schema_1.CurrencySchema },
                { name: coin_price_schema_1.CoinPrice.name, schema: coin_price_schema_1.CoinPriceSchema },
                { name: fee_info_schema_1.FeeInfo.name, schema: fee_info_schema_1.FeeInfoSchema },
            ]),
        ],
        controllers: [coins_controller_1.CoinsController],
        providers: [coins_service_1.CoinsService],
    })
], CoinsModule);
//# sourceMappingURL=coins.module.js.map
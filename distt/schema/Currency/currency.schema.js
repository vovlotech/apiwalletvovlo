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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencySchema = exports.Currency = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const utils_1 = require("../../utils/utils");
let Currency = class Currency {
};
exports.Currency = Currency;
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: utils_1.generateStringId }),
    __metadata("design:type", String)
], Currency.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], Currency.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], Currency.prototype, "symbol", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], Currency.prototype, "coinGeckoId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], Currency.prototype, "logoUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Currency.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Currency.prototype, "isActive", void 0);
exports.Currency = Currency = __decorate([
    (0, mongoose_1.Schema)()
], Currency);
exports.CurrencySchema = mongoose_1.SchemaFactory.createForClass(Currency);
exports.CurrencySchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        delete ret._id;
    },
});
exports.CurrencySchema.set('toObject', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret.__v;
        delete ret._id;
    },
});
exports.CurrencySchema.set('timestamps', true);
exports.CurrencySchema.index({ isDeleted: 1, isActive: 1 });
exports.CurrencySchema.index({ isDeleted: 1, isActive: 1, name: 1 });
exports.CurrencySchema.index({ isDeleted: 1, isActive: 1, symbol: 1 });
exports.CurrencySchema.index({ isDeleted: 1, isActive: 1, coinGeckoId: 1 });
exports.CurrencySchema.index({ isDeleted: 1, isActive: 1, name: 1, symbol: 1 });
exports.CurrencySchema.index({ isDeleted: 1, isActive: 1, name: 1, coinGeckoId: 1 });
exports.CurrencySchema.index({ isDeleted: 1, isActive: 1, symbol: 1, coinGeckoId: 1 });
exports.CurrencySchema.index({ isDeleted: 1, isActive: 1, name: 1, symbol: 1, coinGeckoId: 1 });
//# sourceMappingURL=currency.schema.js.map
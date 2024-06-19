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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wallet_service_1 = require("./wallet.service");
const user_decorator_1 = require("../../decorators/user.decorator");
const transaction_dto_1 = require("./dto/transaction.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const coinNetwork_dto_1 = require("./dto/coinNetwork.dto");
const withdraw_dto_1 = require("./dto/withdraw.dto");
const jwt_admin_guard_1 = require("../auth/jwt-admin.guard");
const setFee_dto_1 = require("./dto/setFee.dto");
const send_nft_dto_1 = require("./dto/send-nft.dto");
let WalletController = class WalletController {
    constructor(_walletService) {
        this._walletService = _walletService;
    }
    getWalletWithBalance(user) {
        return this._walletService.getWalletWithBalance(user.id);
    }
    getUserWalletWithBalance(userId) {
        return this._walletService.getWalletWithBalance(userId);
    }
    getDepositAddress(user, networkDTO) {
        return this._walletService.getDepositAddress(user.id, networkDTO.networkId);
    }
    withdraw(user, withdrawDTO, req) {
        req.setTimeout(20 * 60 * 1000);
        withdrawDTO.amount = Number(withdrawDTO.amount);
        return this._walletService.withdraw(user?.id, withdrawDTO);
    }
    withdrawFiat(user, withdrawFiatDTO) {
        withdrawFiatDTO.amount = Number(withdrawFiatDTO.amount);
        return this._walletService.withdrawFiat(user.id, withdrawFiatDTO);
    }
    swap(user, swapDTO, req) {
        req.setTimeout(20 * 60 * 1000);
        swapDTO.amount = Number(swapDTO.amount);
        return this._walletService.swap(user.id, swapDTO);
    }
    getTransactions(transactionDTO, user) {
        transactionDTO.userId = user?.id;
        return this._walletService.getTransactions(transactionDTO);
    }
    getTransactionsByAdmin(transactionDTO, user) {
        return this._walletService.getTransactionsByAdmin(transactionDTO);
    }
    updateTransaction(updateTransactionDTO, user) {
        return this._walletService.updateTransaction(updateTransactionDTO);
    }
    getStats() {
        return this._walletService.getStats();
    }
    async moralisTransactionWebHook(transactionDto) {
        console.log("----------------------moralisTransactionWebHook----------------");
        const wallet = await this._walletService.moralisTransactionWebHook(transactionDto);
        return wallet;
    }
    getNonce(address) {
        return this._walletService.getNonce(address);
    }
    getFee() {
        return this._walletService.getFee();
    }
    setFee(setFeeDto) {
        return this._walletService.setFee(setFeeDto);
    }
    sendNft(sendNftDto, user) {
        return this._walletService.sendNft(sendNftDto, user);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getWalletWithBalance'),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getWalletWithBalance", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getUserWalletWithBalance/:userId'),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getUserWalletWithBalance", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getDepositAddress'),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, coinNetwork_dto_1.NetworkDTO]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getDepositAddress", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('withdraw'),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, withdraw_dto_1.WithdrawDTO, Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "withdraw", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('withdrawFiat'),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, withdraw_dto_1.WithdrawFiatDTO]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "withdrawFiat", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('swap'),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, withdraw_dto_1.SwapDTO, Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "swap", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getTransactions'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transaction_dto_1.TransactionDTO, Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getTransactions", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getTransactionsByAdmin'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transaction_dto_1.TransactionDTO, Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getTransactionsByAdmin", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('updateTransaction'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transaction_dto_1.UpdateTransactionDTO, Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "updateTransaction", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getStats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('moralisTransactionWebHook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "moralisTransactionWebHook", null);
__decorate([
    (0, common_1.Get)('getNonce/:address'),
    __param(0, (0, common_1.Param)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getNonce", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getFee'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getFee", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_admin_guard_1.JwtAdminGuard),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('setFee'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [setFee_dto_1.SetFeeDTO]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "setFee", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('sendNft'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_nft_dto_1.SendNftDTO, Object]),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "sendNft", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map
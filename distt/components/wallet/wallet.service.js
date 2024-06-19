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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const wallet_schema_1 = require("../../schema/Wallet/wallet.schema");
const utils_1 = require("../../utils/utils");
const CryptoJS = require("crypto-js");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../schema/User/user.schema");
const network_schema_1 = require("../../schema/Network/network.schema");
const { Web3 } = require('web3');
const bitcoin = require("bitcoinjs-lib");
const coin_schema_1 = require("../../schema/Coin/coin.schema");
const balance_schema_1 = require("../../schema/Balance/balance.schema");
const moralis_1 = require("moralis");
const transaction_schema_1 = require("../../schema/Transaction/transaction.schema");
const transaction_enum_1 = require("../../enum/transaction.enum");
const network_enum_1 = require("../../enum/network.enum");
var cron = require('node-cron');
const TronWeb = require('tronweb');
const axios_1 = require("axios");
const utils_service_1 = require("../utils/utils.service");
const coin_price_schema_1 = require("../../schema/CoinPrice/coin-price.schema");
const fee_info_schema_1 = require("../../schema/FeeInfo/fee-info.schema");
const currency_schema_1 = require("../../schema/Currency/currency.schema");
const send_nft_dto_1 = require("./dto/send-nft.dto");
const nft_schema_1 = require("../../schema/Nft/nft.schema");
let WalletService = class WalletService {
    constructor(_walletModel, _userModel, _networkModel, _coinModel, _balanceModel, _transactionModel, _coinPriceModel, _feeInfoModel, _currencyModel, _nftModel, utilsService) {
        this._walletModel = _walletModel;
        this._userModel = _userModel;
        this._networkModel = _networkModel;
        this._coinModel = _coinModel;
        this._balanceModel = _balanceModel;
        this._transactionModel = _transactionModel;
        this._coinPriceModel = _coinPriceModel;
        this._feeInfoModel = _feeInfoModel;
        this._currencyModel = _currencyModel;
        this._nftModel = _nftModel;
        this.utilsService = utilsService;
        this.createStream();
        this.updateBalanceForAllUsers();
        const bitcoinWallet = this.createBitcoinWallet();
        console.log(bitcoinWallet);
        console.log(this.decryptData('U2FsdGVkX1/Ix9b+7z4yWMQ2kG+V0enjlbps8gBFW1YXOpZYgLCvrYd+AzzaLqxoo78BM7t50UJnWerBD+tyKPceTC+ow6ZAZU4hjaclzcb6tl/SVGdG0q6LDNmb8jTe', process.env.ENCRYPTION_KEY));
    }
    encryptData(data, encryptionKey) {
        try {
            return CryptoJS.AES.encrypt(data, encryptionKey + process.env.ENCRYPTION_KEY).toString();
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    decryptData(data, encryptionKey) {
        try {
            const bytes = CryptoJS.AES.decrypt(data, encryptionKey + process.env.ENCRYPTION_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async resetBalance(userId) {
        try {
            const walletDocument = await this._walletModel.findOne({
                userId: userId,
            });
            const [networks, coins] = await Promise.all([
                this._networkModel
                    .find()
                    .then((networks) => JSON.parse(JSON.stringify(networks))),
                this._coinModel
                    .find()
                    .then((coins) => JSON.parse(JSON.stringify(coins))),
            ]);
            for await (const coin of coins) {
                const network = networks.find((network) => network.id === coin?.networkId);
                if (!network) {
                    console.log("Network doesn't exist");
                    return;
                }
                let walletAddress;
                if (network?.networkType === network_enum_1.NETWORKTYPEENUM.EVM)
                    walletAddress = walletDocument.evmAddress;
                else if (network?.networkType === network_enum_1.NETWORKTYPEENUM.BTC)
                    walletAddress = walletDocument.btcAddress;
                else if (network?.networkType === network_enum_1.NETWORKTYPEENUM.TRON)
                    walletAddress = walletDocument.tronAddress;
                if (!walletDocument)
                    return;
                const balanceObj = {
                    balance: 0,
                    balanceInUsd: 0,
                    coinId: coin?.id,
                    walletId: walletDocument?.id,
                    address: walletAddress,
                    userId: userId,
                    networkId: network?.id,
                };
                await this._balanceModel
                    .findOneAndUpdate({ walletId: walletDocument?.id, coinId: coin?.id }, balanceObj, { upsert: true })
                    .then((balance) => balance)
                    .catch((err) => console.log(err));
            }
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async createWallet(userId) {
        const mnemonic = ethers_1.Wallet.createRandom().mnemonic;
        const evmWallet = this.createEvmWallet(mnemonic?.phrase);
        const evmKey = this.encryptData(evmWallet?.privateKey, process.env.ENCRYPTION_KEY);
        await this.addAddressToStream(evmWallet?.address?.toLowerCase());
        const tronWallet = this.createTronWallet(mnemonic?.phrase);
        const tronKey = this.encryptData(tronWallet?.privateKey, process.env.ENCRYPTION_KEY);
        const bitcoinWallet = this.createBitcoinWallet();
        const bitcoinKey = this.encryptData(bitcoinWallet?.privateKey, process.env.ENCRYPTION_KEY);
        const walletDoc = await new this._walletModel({
            userId: userId,
            evmAddress: evmWallet?.address?.toLowerCase(),
            evmKey: evmKey,
            tronAddress: tronWallet?.address,
            tronKey: tronKey,
            btcPublicKey: bitcoinWallet?.btcPublicKey.toString(),
            btcAddress: bitcoinWallet?.address,
            btcKey: bitcoinKey,
            currentSwappedBalance: 0,
            totalWithdrawnAmount: 0,
        }).save();
        await this.resetBalance(userId);
        return walletDoc;
    }
    createEvmWallet(mnemonic) {
        try {
            const evmWallet = ethers_1.Wallet.fromPhrase(mnemonic);
            return {
                address: evmWallet?.address,
                privateKey: evmWallet?.privateKey,
            };
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    createTronWallet(mnemonic) {
        try {
            const tronWallet = utils_1.tronWeb.fromMnemonic(mnemonic);
            return {
                address: tronWallet?.address,
                privateKey: tronWallet?.privateKey,
            };
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    createBitcoinWallet() {
        try {
            const keyPair = utils_1.ECPair.makeRandom({
                network: utils_1.BITCOIN_NETWORK,
            });
            const wif = keyPair.toWIF();
            const data = bitcoin.payments.p2pkh({
                pubkey: keyPair.publicKey,
                network: utils_1.BITCOIN_NETWORK,
            });
            const privateKey = utils_1.ECPair.fromWIF(wif, utils_1.BITCOIN_NETWORK);
            return {
                btcPublicKey: keyPair?.publicKey?.toString('hex'),
                address: data?.address,
                privateKey: wif,
            };
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }
    async getDepositAddress(userId, networkId) {
        try {
            const networkDocument = await this._networkModel.findOne({
                _id: networkId,
            });
            const walletDocument = await this._walletModel.findOne({
                userId: userId,
            });
            let address = '';
            let publicKey = '';
            if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.EVM) {
                address = walletDocument.evmAddress;
            }
            else if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.BTC) {
                address = walletDocument.btcAddress;
                publicKey = walletDocument.btcPublicKey;
            }
            else if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.TRON) {
                address = walletDocument.tronAddress;
            }
            return {
                address,
                publicKey,
            };
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err.message);
        }
    }
    async getWalletWithBalance(userId) {
        try {
            await this.updateBalance(userId, false);
            const userDocument = await this._userModel.findOne({ _id: userId });
            const walletDocument = await this._walletModel.findOne({
                userId: userId,
            });
            const usdCurrency = await this._currencyModel.findOne({
                coinGeckoId: 'usd',
            });
            const localCurrency = await this._currencyModel.findOne({
                _id: userDocument.currencyId,
            });
            const balanceData = await this._balanceModel.aggregate([
                {
                    $match: {
                        walletId: walletDocument.id,
                        userId: userId,
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
                        from: 'coinprices',
                        localField: 'coinId',
                        foreignField: 'coinId',
                        as: 'coinPrice',
                        pipeline: [
                            {
                                $match: {
                                    currencyId: userDocument.currencyId,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: '$coinPrice',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'coinprices',
                        localField: 'coinId',
                        foreignField: 'coinId',
                        as: 'coinPriceInUsd',
                        pipeline: [
                            {
                                $match: {
                                    currencyId: usdCurrency?.id,
                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: '$coinPriceInUsd',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'networks',
                        localField: 'coin.networkId',
                        foreignField: '_id',
                        as: 'network',
                    },
                },
                {
                    $unwind: '$network',
                },
                {
                    $addFields: {
                        id: '$_id',
                        'coin.id': '$coin._id',
                        'network.id': '$network._id',
                        name: '$coin.name',
                        symbol: '$coin.symbol',
                        logoUrl: '$coin.icon',
                        networkName: '$network.name',
                        networkSymbol: '$network.symbol',
                        networkLogoUrl: '$network.logoUrl',
                        price: '$coinPrice.price',
                        priceInUsd: '$coinPriceInUsd.price',
                        priceChange: '$coinPrice.priceChange',
                    },
                },
                {
                    $sort: { balance: -1, createdAt: -1 },
                },
                {
                    $project: {
                        _id: 0,
                        id: 1,
                        name: 1,
                        symbol: 1,
                        logoUrl: 1,
                        networkName: 1,
                        networkSymbol: 1,
                        networkLogoUrl: 1,
                        price: 1,
                        priceInUsd: 1,
                        priceChange: 1,
                        coinId: 1,
                        networkId: 1,
                        balance: 1,
                        address: 1,
                    },
                },
            ]);
            let totalBalanceInLocalCurrency = 0;
            let totalBalanceInUsd = 0;
            const balance = balanceData.map((balanceItem) => {
                const balanceItemReturn = JSON.parse(JSON.stringify(balanceItem));
                balanceItemReturn.balanceInLocalCurrency =
                    balanceItem.balance * balanceItem.price;
                balanceItemReturn.balanceInUsd =
                    balanceItem.balance * balanceItem.priceInUsd;
                totalBalanceInLocalCurrency =
                    totalBalanceInLocalCurrency +
                        balanceItemReturn.balanceInLocalCurrency;
                totalBalanceInUsd = totalBalanceInUsd + balanceItemReturn.balanceInUsd;
                return balanceItemReturn;
            });
            const wallet = JSON.parse(JSON.stringify(walletDocument));
            wallet.totalBalanceInLocalCurrency = totalBalanceInLocalCurrency;
            wallet.localCurrency = localCurrency;
            wallet.usdCurrency = usdCurrency;
            wallet.totalBalanceInUsd = totalBalanceInUsd;
            wallet.accountName = userDocument.accountName;
            wallet.accountNumber = userDocument.accountNumber;
            wallet.bankName = userDocument.bankName;
            return {
                wallet: wallet,
                balance: balance,
            };
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err.message);
        }
    }
    async getBtcBalance(walletAddress, networkDocument) {
        try {
            debugger;
            const res = await fetch(`${networkDocument?.rpcUrl}/addrs/${walletAddress}?token=${utils_1.BITCOIN_TOKEN}`);
            if (res.status !== 200) {
                console.log('get balance error');
                return {
                    balance: 0,
                    finalBalance: 0,
                    balanceInUsd: 0,
                    error: true,
                    transactions: [],
                };
            }
            const balance = await res.json();
            const balanceInBtc = (0, utils_1.fromSatoshi)(Number(balance?.balance));
            return {
                balance: balanceInBtc,
            };
        }
        catch (err) {
            console.log(err);
            return {
                balance: 0,
                finalBalance: 0,
                balanceInUsd: 0,
                error: true,
                transactions: [],
            };
        }
    }
    async getNativeTokenBalance(address, rpcUrl) {
        try {
            const web3 = new Web3(rpcUrl);
            const balance = await web3.eth.getBalance(address);
            const balanceInEther = Number(web3.utils.fromWei(balance, 'ether'));
            return balanceInEther;
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err.message);
        }
    }
    async getAllEvmBalance(address) {
        try {
            const networks = await this._networkModel.find({
                chainName: 'ETH',
            });
            if (!networks) {
                throw new Error('Networks not found');
            }
            const res = await Promise.all(networks.map(async (network) => {
                const balance = await this.getNativeTokenBalance(address, network?.rpcUrl);
                return {
                    address: address,
                    type: network.networkType,
                    name: network?.name,
                    symbol: network?.symbol,
                    logoUrl: network?.logoUrl,
                    balance: balance,
                };
            }));
            return res;
        }
        catch (err) {
            console.log(err);
            return [];
        }
    }
    async getTronBalance(address) {
        try {
            const tronNetwork = await this._networkModel.findOne({
                chainName: 'TRON',
            });
            if (!tronNetwork) {
                throw new Error('Tron network not found');
            }
            const balance = await utils_1.tronWeb.trx.getBalance(address);
            const balanceInTrx = Number(utils_1.tronWeb.fromSun(balance));
            return {
                address: address,
                type: 'TRON',
                name: tronNetwork?.name,
                symbol: tronNetwork?.symbol,
                logoUrl: tronNetwork?.logoUrl,
                balance: balanceInTrx,
            };
        }
        catch (err) {
            console.log(err);
            return {
                address: address,
                type: 'TRON',
                name: 'undefined',
                symbol: 'undefined',
                logoUrl: 'undefined',
                balance: 0,
            };
        }
    }
    async withdraw(userId, withdrawDTO) {
        try {
            const userData = await this._userModel.findOne({
                _id: userId,
            });
            const coinDocument = await this._coinModel.findOne({
                _id: withdrawDTO.coinId,
            });
            const walletDocument = await this._walletModel.findOne({
                userId: userId,
            });
            const balanceDocument = await this._balanceModel.findOne({
                userId: userId,
                coinId: withdrawDTO.coinId,
            });
            let newBalance = balanceDocument.balance - withdrawDTO.amount;
            if (newBalance < 0) {
                throw new Error('Insufficient Balance');
            }
            let sendAmountData = await this.sendAmount(userId, withdrawDTO, false);
            await balanceDocument.updateOne({ balance: newBalance });
            let transactionDocument = await new this._transactionModel({
                userId: userId,
                walletId: walletDocument.id,
                fromAddress: sendAmountData.fromAddress,
                toAddress: withdrawDTO.address,
                coinId: withdrawDTO.coinId,
                type: transaction_enum_1.TRANSACTIONENUM.WITHDRAW,
                fee: sendAmountData.transactionFee,
                amount: withdrawDTO.amount,
                balance: newBalance,
                swappedAmount: null,
                trxHash: sendAmountData.trxHash,
                status: transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED,
                currencyId: userData?.currencyId,
            }).save();
            const text = ` Your withdrawal of ${withdrawDTO.amount} ${coinDocument.symbol} has been successfully processed from your Crypto Wallet account. Please allow up to 20 minutes for the funds to reflect in your designated withdrawal account. For further information or inquiries, consult our FAQs. If you require immediate assistance, start a chat with us within the Crypto Wallet app.`;
            let userDocument = await this._userModel.findOne({ _id: userId });
            const res = await this.utilsService.sendEmail({
                from: process.env.SENDER_MAIL,
                to: [userDocument?.email],
                subject: 'Withdrawal Request Processed',
                text: text,
            });
            return transactionDocument;
        }
        catch (err) {
            console.log('1');
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async swap(userId, swapDTO) {
        try {
            console.log('SWAP DTO');
            console.log(swapDTO);
            debugger;
            const userData = await this._userModel.findOne({
                _id: userId,
            });
            const walletDocument = await this._walletModel.findOne({
                userId: userId,
            });
            const currency = await this._currencyModel.findOne({
                _id: userData?.currencyId,
            });
            let coinDocument = await this._coinModel.findOne({ _id: swapDTO.coinId });
            coinDocument = JSON.parse(JSON.stringify(coinDocument));
            const networkDocument = await this._networkModel.findOne({
                _id: swapDTO.networkId,
            });
            const balanceDocument = await this._balanceModel.findOne({
                userId: userId,
                coinId: swapDTO.coinId,
            });
            let newBalance = balanceDocument.balance - swapDTO.amount;
            if (newBalance < 0) {
                throw new Error('Insufficient Balance');
            }
            debugger;
            const coinPrice = await this._coinPriceModel.findOne({
                coinId: swapDTO.coinId,
                currencyId: userData?.currencyId,
            });
            if (!coinPrice) {
                throw new Error('Coin price not found');
            }
            debugger;
            coinDocument.price = coinPrice.price;
            debugger;
            if (coinDocument.isToken && swapDTO.amount < utils_1.STABLE_MINIMUM) {
                throw new Error('Minimum swap amount is ' + utils_1.STABLE_MINIMUM);
            }
            let hotWallet;
            debugger;
            if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.EVM) {
                hotWallet = process.env.EVM_HOT_WALLET;
            }
            else if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.TRON) {
                hotWallet = process.env.TRON_HOT_WALLET;
            }
            else if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.BTC) {
                hotWallet = process.env.BTC_HOT_WALLET;
            }
            debugger;
            const withdrawDTO = {
                address: hotWallet,
                amount: swapDTO.amount,
                coinId: swapDTO.coinId,
                networkId: swapDTO.networkId,
            };
            debugger;
            let sendAmountData = await this.sendAmount(userId, withdrawDTO, false);
            debugger;
            console.log('done send amount');
            debugger;
            let swapFee = 0;
            const feeInfo = await this._feeInfoModel.findOne({
                feeName: 'swap_fee',
            });
            swapFee = swapDTO.amount * (feeInfo.feePercentage / 100);
            swapDTO.amount = swapDTO.amount - swapFee;
            debugger;
            await balanceDocument.updateOne({ balance: newBalance });
            let swappedAmount = swapDTO.amount * coinDocument.price;
            let currentSwappedBalance = swappedAmount + walletDocument.currentSwappedBalance;
            await walletDocument.updateOne({
                currentSwappedBalance: currentSwappedBalance,
            });
            let transactionDocument = await new this._transactionModel({
                userId: userId,
                walletId: walletDocument.id,
                fromAddress: sendAmountData.fromAddress,
                toAddress: hotWallet,
                coinId: swapDTO.coinId,
                type: transaction_enum_1.TRANSACTIONENUM.SWAP,
                fee: sendAmountData.transactionFee,
                swapFee: swapFee,
                amount: swapDTO.amount + swapFee,
                balance: newBalance,
                swappedAmount: swappedAmount,
                swappedPrice: coinDocument?.price,
                trxHash: sendAmountData.trxHash,
                trxUrl: null,
                status: transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED,
                currencyId: userData?.currencyId,
            }).save();
            debugger;
            let userDocument = await this._userModel.findOne({ _id: userId });
            debugger;
            const text = `
      Your recent swap of ${transactionDocument.amount} ${coinDocument.symbol} for ${currency?.symbol}${transactionDocument.swappedAmount}  is complete on your Crypto Wallet app. You can review the transaction details and updated asset balances by logging into your account. Need help? Check our FAQs for more guidance. If you have questions about this swap or need additional support, don't hesitate to reach out via the in-app chat.`;
            debugger;
            const res = await this.utilsService.sendEmail({
                from: process.env.SENDER_MAIL,
                to: [userDocument?.email],
                subject: 'Swapping Completed',
                text: text,
            });
            return transactionDocument;
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async withdrawFiat(userId, withdrawFiatDTO) {
        try {
            const userData = await this._userModel.findOne({
                _id: userId,
            });
            let walletDocument = await this._walletModel.findOne({ userId: userId });
            let currentSwappedBalance = walletDocument.currentSwappedBalance - withdrawFiatDTO.amount;
            let totalWithdrawnAmountLocked = walletDocument.totalWithdrawnAmountLocked + withdrawFiatDTO.amount;
            if (currentSwappedBalance < 0) {
                throw new Error('Insufficient Balance');
            }
            await walletDocument.updateOne({
                currentSwappedBalance: currentSwappedBalance,
                totalWithdrawnAmountLocked: totalWithdrawnAmountLocked,
            });
            const feeInfo = await this._feeInfoModel.findOne({
                feeName: 'withdraw_fiat_fee',
            });
            const feeAmount = withdrawFiatDTO.amount * (feeInfo.feePercentage / 100);
            debugger;
            let transactionDocument = await new this._transactionModel({
                userId: userId,
                walletId: walletDocument.id,
                fromAddress: null,
                toAddress: null,
                coinId: null,
                type: transaction_enum_1.TRANSACTIONENUM.WITHDRAW_FIAT,
                amount: withdrawFiatDTO.amount,
                balance: currentSwappedBalance,
                fee: feeAmount,
                swappedAmount: null,
                trxHash: null,
                trxUrl: null,
                bankName: withdrawFiatDTO.bankName,
                accountNumber: withdrawFiatDTO.accountNumber,
                accountName: withdrawFiatDTO.accountName,
                status: transaction_enum_1.TRANSACTIONSTATUSENUM.PENDING,
                currencyId: userData?.currencyId,
            }).save();
            return transactionDocument;
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async sendAmount(userId, withdrawDTO, isGasFeeTransfer = false) {
        try {
            console.log('send Amount');
            debugger;
            let fromAddress, fromKey, response;
            const receiverAddress = withdrawDTO?.address;
            const amount = withdrawDTO?.amount;
            const coinId = withdrawDTO?.coinId;
            debugger;
            const userDocument = await this._userModel.findOne({
                _id: userId,
            });
            const walletDocument = await this._walletModel.findOne({
                userId: userId,
            });
            debugger;
            if (!userDocument || !walletDocument) {
                throw new Error('Wallet not found');
            }
            const coinDocument = await this._coinModel.findOne({
                _id: coinId,
            });
            if (!coinDocument) {
                throw new Error('Coin not found');
            }
            debugger;
            const networkDocument = await this._networkModel.findOne({
                _id: coinDocument?.networkId,
            });
            if (!networkDocument) {
                throw new Error('Network not found');
            }
            debugger;
            if (networkDocument?.networkType === network_enum_1.NETWORKTYPEENUM.EVM) {
                debugger;
                fromAddress = walletDocument?.evmAddress;
                fromKey = this.decryptData(walletDocument?.evmKey, process.env.ENCRYPTION_KEY);
                debugger;
                const web3 = new Web3(networkDocument?.rpcUrl);
                debugger;
                const isValidAddress = await web3.utils.isAddress(receiverAddress);
                if (!isValidAddress) {
                    throw new Error('Invalid address');
                }
                debugger;
                let nonce = await web3.eth.getTransactionCount(fromAddress);
                let noncePending = await web3.eth.getTransactionCount(fromAddress, 'pending');
                debugger;
                while (Number(nonce) != Number(noncePending)) {
                    console.log('waiting 10s for correct nonce...', Number(nonce), Number(noncePending));
                    await new Promise((resolve) => {
                        setTimeout(resolve, 10000);
                    });
                    nonce = await web3.eth.getTransactionCount(fromAddress);
                    noncePending = await web3.eth.getTransactionCount(fromAddress, 'pending');
                }
                debugger;
                const coinNativeDocument = await this._coinModel.findOne({
                    isToken: false,
                    networkId: withdrawDTO.networkId,
                });
                const balanceDocumentNative = await this._balanceModel.findOne({
                    userId: userId,
                    coinId: coinNativeDocument.id,
                });
                debugger;
                if (!coinDocument?.isToken) {
                    const amountInDecimal = (0, utils_1.toDecimals)(amount, coinDocument?.decimal);
                    debugger;
                    let gasLimit = await web3.eth.estimateGas({
                        from: fromAddress,
                        value: amountInDecimal,
                    });
                    let gasPrice = await web3.eth.getGasPrice();
                    gasLimit = Math.floor(Number(gasLimit) * 1.2);
                    gasPrice = Math.floor(Number(gasPrice) * 1.2);
                    debugger;
                    let estimateGasFee = Number(gasLimit) * Number(gasPrice);
                    let estimatedGasFeeEth = Number(web3.utils.fromWei(estimateGasFee, 'ether'));
                    debugger;
                    if (amount + estimatedGasFeeEth > balanceDocumentNative.balance) {
                        throw new Error('Insufficient Balance for Fee Please Leave Adequate balance for blockchain transaction fee.');
                    }
                    debugger;
                    const txObject = {
                        nonce: nonce,
                        to: receiverAddress,
                        value: amountInDecimal,
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                    };
                    debugger;
                    const tx = await web3.eth.accounts.signTransaction(txObject, fromKey);
                    debugger;
                    const txHash = await web3.eth.sendSignedTransaction(tx.rawTransaction);
                    response = {
                        status: 'success',
                        transfer: true,
                        txHash: txHash,
                        trxHash: txHash?.transactionHash,
                        fromAddress: fromAddress,
                        transactionFee: Number((0, utils_1.fromDecimals)(Number(txHash?.effectiveGasPrice) * Number(txHash?.gasUsed), coinDocument?.decimal)),
                    };
                }
                else {
                    const contract = new web3.eth.Contract(utils_1.abi?.token, coinDocument?.contractAddress);
                    const amountInDecimal = (0, utils_1.toDecimals)(amount, coinDocument?.decimal);
                    let gasLimit = await contract.methods
                        .transfer(receiverAddress, amountInDecimal)
                        .estimateGas({ from: fromAddress });
                    let gasPrice = await web3.eth.getGasPrice();
                    gasLimit = Math.floor(Number(gasLimit) * 1.2);
                    gasPrice = Math.floor(Number(gasPrice) * 1.2);
                    let estimateGasFee = Number(gasLimit) * Number(gasPrice);
                    let estimatedGasFeeEth = Number(web3.utils.fromWei(estimateGasFee, 'ether'));
                    if (isGasFeeTransfer) {
                        try {
                            debugger;
                            while (utils_1.masterWalletLocks.isEVMLocked) {
                                console.log('wait... masterWalletLocks.isEVMLocked: ', utils_1.masterWalletLocks.isEVMLocked);
                                await new Promise((resolve) => {
                                    setTimeout(resolve, 10000);
                                });
                            }
                            utils_1.masterWalletLocks.isEVMLocked = utils_1.masterWalletLocks.isEVMLocked + 1;
                            await this.sendAmountFromMaster({
                                address: fromAddress,
                                amount: estimatedGasFeeEth,
                                coinId: coinNativeDocument.id,
                                networkId: withdrawDTO.networkId,
                            });
                            console.log('sent evm from master');
                            debugger;
                            if (utils_1.masterWalletLocks.isEVMLocked) {
                                utils_1.masterWalletLocks.isEVMLocked =
                                    utils_1.masterWalletLocks.isEVMLocked - 1;
                            }
                            console.log('evm lock released.. masterWalletLocks.isEVMLocked: ', utils_1.masterWalletLocks.isEVMLocked);
                        }
                        catch (error) {
                            console.log('error sending transaction fee from master');
                            console.log(error);
                            if (utils_1.masterWalletLocks.isEVMLocked) {
                                utils_1.masterWalletLocks.isEVMLocked =
                                    utils_1.masterWalletLocks.isEVMLocked - 1;
                            }
                            console.log('evm lock released.. masterWalletLocks.isEVMLocked: ', utils_1.masterWalletLocks.isEVMLocked);
                            throw new Error('This one is on us and we are doing all we can to fix it. Please wait a few minutes before trying again.');
                        }
                        finally {
                        }
                    }
                    else {
                        if (estimatedGasFeeEth > balanceDocumentNative.balance) {
                            throw new Error('Insufficient Balance for Fee Please Leave Adequate balance for blockchain transaction fee.');
                        }
                    }
                    const data = contract.methods
                        .transfer(receiverAddress, amountInDecimal)
                        .encodeABI();
                    const txObject = {
                        nonce: nonce,
                        to: coinDocument?.contractAddress,
                        value: 0,
                        data: data,
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                    };
                    debugger;
                    const tx = await web3.eth.accounts.signTransaction(txObject, fromKey);
                    debugger;
                    const txHash = await web3.eth.sendSignedTransaction(tx.rawTransaction);
                    response = {
                        status: 'success',
                        transfer: true,
                        txHash: txHash,
                        trxHash: txHash?.transactionHash,
                        fromAddress: fromAddress,
                        transactionFee: Number((0, utils_1.fromDecimals)(Number(txHash?.effectiveGasPrice) * Number(txHash?.gasUsed), coinDocument?.decimal)),
                    };
                }
            }
            else if (networkDocument?.networkType === network_enum_1.NETWORKTYPEENUM.TRON) {
                try {
                    debugger;
                    fromAddress = walletDocument?.tronAddress;
                    fromKey = this.decryptData(walletDocument?.tronKey, process.env.ENCRYPTION_KEY);
                    debugger;
                    if (fromKey.slice(0, 2) === '0x')
                        fromKey = fromKey.slice(2);
                    const coinNativeDocument = await this._coinModel.findOne({
                        isToken: false,
                        networkId: withdrawDTO.networkId,
                    });
                    const balanceDocumentNative = await this._balanceModel.findOne({
                        userId: userId,
                        coinId: coinNativeDocument.id,
                    });
                    if (!coinDocument?.isToken) {
                        const estimatedGasFeeTrx = utils_1.TRX_GAS_FEE;
                        if (amount + estimatedGasFeeTrx > balanceDocumentNative.balance) {
                            throw new Error('Insufficient Balance for Fee Please Leave Adequate balance for blockchain transaction fee.');
                        }
                        const amountInSun = utils_1.tronWeb.toSun(amount);
                        const tx = await utils_1.tronWeb.transactionBuilder.sendTrx(receiverAddress, amountInSun, fromAddress);
                        const signedTx = await utils_1.tronWeb.trx.sign(tx, fromKey);
                        const transaction = await utils_1.tronWeb.trx.sendRawTransaction(signedTx);
                        debugger;
                        const trxId = transaction?.transaction?.txID;
                        if (!trxId) {
                            throw new Error('Invalid Transaction');
                        }
                        let configTronScan = {
                            headers: {
                                'TRON-PRO-API-KEY': utils_1.TRONSCAN_API_KEY,
                            },
                        };
                        const confirmationAPIURL = utils_1.TRON_SCAN_URL + `/api/transaction-info?hash=${trxId}`;
                        let result = {
                            data: {
                                confirmed: false,
                                confirmations: 0,
                                contractRet: 'SUCCESS',
                            },
                        };
                        try {
                            result = await axios_1.default.get(confirmationAPIURL, configTronScan);
                        }
                        catch (error) {
                            console.log('error fecting trx details');
                        }
                        let i = 0;
                        debugger;
                        while (result && result.data && !result.data.confirmed && result.data.confirmations < 10 && i < 12) {
                            console.log('----data----');
                            console.log(result.data);
                            console.log('----data----');
                            console.log(result.data.confirmed);
                            console.log(result.data.confirmations);
                            console.log(result.data.contractRet);
                            try {
                                let resultDummy = await axios_1.default.get(confirmationAPIURL);
                                result = resultDummy;
                            }
                            catch (error) {
                                console.log('error fecting trx details');
                            }
                            await new Promise((resolve) => {
                                setTimeout(resolve, 6000);
                            });
                            i++;
                        }
                        if (result && result.data && result?.data?.contractRet) {
                            if (result?.data?.contractRet != 'SUCCESS') {
                                throw new Error('Transaction Failed : ' + result?.data?.contractRet);
                            }
                        }
                        response = {
                            status: 'success',
                            transfer: true,
                            txHash: trxId,
                            trxHash: trxId,
                            fromAddress: fromAddress,
                        };
                    }
                    else {
                        const amountInDecimal = (0, utils_1.toDecimals)(amount, coinDocument?.decimal);
                        const tronWebLocal = new TronWeb({
                            fullNode: utils_1.TRON_RPC,
                            solidityNode: utils_1.TRON_RPC,
                            eventServer: utils_1.TRON_RPC,
                            headers: { 'TRON-PRO-API-KEY': utils_1.TRONGRID_API_KEY },
                            privateKey: fromKey,
                        });
                        const usdtContract = await utils_1.tronWeb
                            .contract()
                            .at(coinDocument?.contractAddress);
                        const estimatedGasFeeTrx = utils_1.TRX_GAS_FEE;
                        if (isGasFeeTransfer) {
                            try {
                                while (utils_1.masterWalletLocks.isTRONLocked) {
                                    console.log('wait... masterWalletLocks.isTRONLocked: ', utils_1.masterWalletLocks.isTRONLocked);
                                    await new Promise((resolve) => {
                                        setTimeout(resolve, 10000);
                                    });
                                }
                                utils_1.masterWalletLocks.isTRONLocked =
                                    utils_1.masterWalletLocks.isTRONLocked + 1;
                                debugger;
                                await this.sendAmountFromMaster({
                                    address: fromAddress,
                                    amount: estimatedGasFeeTrx,
                                    coinId: coinNativeDocument.id,
                                    networkId: withdrawDTO.networkId,
                                });
                                console.log('sent tron from master');
                                debugger;
                                if (utils_1.masterWalletLocks.isTRONLocked) {
                                    utils_1.masterWalletLocks.isTRONLocked =
                                        utils_1.masterWalletLocks.isTRONLocked - 1;
                                }
                                console.log('tron lock released.. masterWalletLocks.isTRONLocked: ', utils_1.masterWalletLocks.isTRONLocked);
                            }
                            catch (error) {
                                console.log('error sending transaction fee from master');
                                console.log(error);
                                if (utils_1.masterWalletLocks.isTRONLocked) {
                                    utils_1.masterWalletLocks.isTRONLocked =
                                        utils_1.masterWalletLocks.isTRONLocked - 1;
                                }
                                console.log('tron lock released.. masterWalletLocks.isTRONLocked: ', utils_1.masterWalletLocks.isTRONLocked);
                                throw new Error('This one is on us and we are doing all we can to fix it. Please wait a few minutes before trying again.');
                            }
                            finally {
                            }
                        }
                        else {
                            if (estimatedGasFeeTrx > balanceDocumentNative.balance) {
                                throw new Error('Insufficient Balance for Fee Please Leave Adequate balance for blockchain transaction fee.');
                            }
                        }
                        const options = {
                            callValue: 0,
                        };
                        const tx = await tronWebLocal.transactionBuilder.triggerSmartContract(coinDocument?.contractAddress, 'transfer(address,uint256)', options, [
                            {
                                type: 'address',
                                value: receiverAddress,
                            },
                            {
                                type: 'uint256',
                                value: amountInDecimal,
                            },
                        ], utils_1.tronWeb.address.toHex(fromAddress));
                        const signedTransaction = await tronWebLocal.trx.sign(tx.transaction, fromKey);
                        const transaction = await tronWebLocal.trx.sendRawTransaction(signedTransaction);
                        const trxId = transaction?.transaction?.txID;
                        if (!trxId) {
                            throw new Error('Invalid Transaction');
                        }
                        let configTronScan = {
                            headers: {
                                'TRON-PRO-API-KEY': utils_1.TRONSCAN_API_KEY,
                            },
                        };
                        const confirmationAPIURL = utils_1.TRON_SCAN_URL + `/api/transaction-info?hash=${trxId}`;
                        let result = {
                            data: {
                                confirmed: false,
                                confirmations: 0,
                                contractRet: 'SUCCESS',
                            },
                        };
                        try {
                            result = await axios_1.default.get(confirmationAPIURL, configTronScan);
                        }
                        catch (error) {
                            console.log('error fecting trx details');
                        }
                        let i = 0;
                        while (result && result.data && !result.data.confirmed && result.data.confirmations < 10 && i < 12) {
                            console.log('----data----');
                            console.log(result.data);
                            console.log('----data----');
                            console.log(result.data.confirmed);
                            console.log(result.data.confirmations);
                            console.log(result.data.contractRet);
                            try {
                                let resultDummy = await axios_1.default.get(confirmationAPIURL);
                                result = resultDummy;
                            }
                            catch (error) {
                                console.log('error fecting trx details');
                            }
                            await new Promise((resolve) => {
                                setTimeout(resolve, 6000);
                            });
                            i++;
                        }
                        if (result && result.data && result?.data?.contractRet) {
                            if (result?.data?.contractRet != 'SUCCESS') {
                                throw new Error('Transaction Failed : ' + result?.data?.contractRet);
                            }
                        }
                        debugger;
                        response = {
                            status: 'success',
                            transfer: true,
                            txHash: trxId,
                            trxHash: trxId,
                            fromAddress: fromAddress,
                        };
                    }
                }
                catch (err) {
                    console.log('error in tron');
                    console.log(err);
                    throw new Error(err?.message);
                }
            }
            else if (networkDocument?.networkType === network_enum_1.NETWORKTYPEENUM.BTC) {
                debugger;
                fromAddress = walletDocument?.btcAddress;
                fromKey = this.decryptData(walletDocument?.btcKey, process.env.ENCRYPTION_KEY);
                const amountInSatoshi = (0, utils_1.toSatoshi)(amount);
                const balance = await this.getBtcBalance(fromAddress, networkDocument);
                if (Number(balance?.balance) < Number(amount)) {
                    throw new Error('Insufficient balance');
                }
                const res = await fetch(`${networkDocument?.rpcUrl}/addrs/${fromAddress}?token=${utils_1.BITCOIN_TOKEN}`);
                if (res.status !== 200) {
                    throw new Error('Something went wrong');
                }
                const data = await res.json();
                if (data.balance != data.final_balance) {
                    throw new Error('Please wait for the other transaction to be confirmed.');
                }
                const tx = new bitcoin.TransactionBuilder(utils_1.BITCOIN_NETWORK);
                const trxs = data?.txrefs;
                if (trxs.length > 0) {
                    tx.addInput(trxs[0].tx_hash, trxs[0].tx_output_n);
                }
                try {
                    tx.addOutput(receiverAddress, amountInSatoshi);
                }
                catch {
                    throw new Error('Invalid Address');
                }
                try {
                }
                catch (error) {
                    console.log('error in btc fee');
                    console.log(error);
                }
                let txn_no = trxs?.filter((item) => item?.tx_output_n >= 0).length;
                const privateKey = utils_1.ECPair.fromWIF(fromKey, utils_1.BITCOIN_NETWORK);
                tx.sign(0, privateKey);
                const tx_hex = tx.build().toHex();
                debugger;
                debugger;
                const txHash = await axios_1.default.post(`${networkDocument?.rpcUrl}/txs/push?token=${utils_1.BITCOIN_TOKEN}`, { tx: tx_hex });
                if (txHash.status !== 201) {
                    if (txHash.status === 409) {
                        debugger;
                        throw new Error('Please wait for the other transaction to be confirmed.');
                    }
                    throw new Error('Something went wrong');
                }
                debugger;
                const txHashJson = await txHash.data;
                response = {
                    status: 'success',
                    transfer: true,
                    txHash: txHashJson,
                    trxHash: txHashJson?.tx?.hash,
                    fromAddress: fromAddress,
                };
            }
            return response;
        }
        catch (err) {
            console.log(err);
            if (err?.response?.data?.error) {
                if (err?.response?.data?.error.includes('already')) {
                    throw new Error('Please wait for the other transaction to be confirmed.');
                }
            }
            if (err.message) {
                console.log(err.message);
                if (err.message.includes('409')) {
                    throw new Error('Please wait for the other transaction to be confirmed.');
                }
            }
            throw new Error(err?.message);
        }
    }
    async sendAmountFromMaster(withdrawDTO) {
        try {
            debugger;
            let fromAddress, fromKey, response;
            const receiverAddress = withdrawDTO?.address;
            const amount = withdrawDTO?.amount;
            const coinId = withdrawDTO?.coinId;
            const coinDocument = await this._coinModel.findOne({
                _id: coinId,
            });
            if (!coinDocument) {
                throw new Error('Coin not found');
            }
            const networkDocument = await this._networkModel.findOne({
                _id: coinDocument?.networkId,
            });
            if (!networkDocument) {
                throw new Error('Network not found');
            }
            if (networkDocument?.networkType === network_enum_1.NETWORKTYPEENUM.EVM) {
                fromAddress = process.env.EVM_HOT_WALLET;
                fromKey = process.env.EVM_HOT_WALLET_KEY;
                const web3 = new Web3(networkDocument?.rpcUrl);
                const isValidAddress = await web3.utils.isAddress(receiverAddress);
                if (!isValidAddress) {
                    throw new Error('Invalid address');
                }
                let nonce = await web3.eth.getTransactionCount(fromAddress);
                let noncePending = await web3.eth.getTransactionCount(fromAddress, 'pending');
                while (Number(nonce) != Number(noncePending)) {
                    console.log('MASTER: waiting 10s for correct nonce...', Number(nonce), Number(noncePending));
                    await new Promise((resolve) => {
                        setTimeout(resolve, 10000);
                    });
                    nonce = await web3.eth.getTransactionCount(fromAddress);
                    noncePending = await web3.eth.getTransactionCount(fromAddress, 'pending');
                }
                if (!coinDocument?.isToken) {
                    const amountInDecimal = (0, utils_1.toDecimals)(amount, coinDocument?.decimal);
                    let gasLimit = await web3.eth.estimateGas({
                        from: fromAddress,
                        value: amountInDecimal,
                    });
                    let gasPrice = await web3.eth.getGasPrice();
                    gasLimit = Math.floor(Number(gasLimit) * 1.2);
                    gasPrice = Math.floor(Number(gasPrice) * 1.2);
                    const txObject = {
                        nonce: nonce,
                        to: receiverAddress,
                        value: amountInDecimal,
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                    };
                    const tx = await web3.eth.accounts.signTransaction(txObject, fromKey);
                    const txHash = await web3.eth.sendSignedTransaction(tx.rawTransaction);
                    response = {
                        status: 'success',
                        transfer: true,
                        txHash: txHash,
                        trxHash: txHash?.transactionHash,
                        fromAddress: fromAddress,
                        transactionFee: Number((0, utils_1.fromDecimals)(Number(txHash?.effectiveGasPrice) * Number(txHash?.gasUsed), coinDocument?.decimal)),
                    };
                }
                else {
                    const contract = new web3.eth.Contract(utils_1.abi?.token, coinDocument?.contractAddress);
                    const amountInDecimal = (0, utils_1.toDecimals)(amount, coinDocument?.decimal);
                    let gasLimit = await contract.methods
                        .transfer(receiverAddress, amountInDecimal)
                        .estimateGas({ from: fromAddress });
                    let gasPrice = await web3.eth.getGasPrice();
                    gasLimit = Math.floor(Number(gasLimit) * 1.2);
                    gasPrice = Math.floor(Number(gasPrice) * 1.2);
                    const data = contract.methods
                        .transfer(receiverAddress, amountInDecimal)
                        .encodeABI();
                    const txObject = {
                        nonce: nonce,
                        to: coinDocument?.contractAddress,
                        value: 0,
                        data: data,
                        gasLimit: gasLimit,
                        gasPrice: gasPrice,
                    };
                    const tx = await web3.eth.accounts.signTransaction(txObject, fromKey);
                    const txHash = await web3.eth.sendSignedTransaction(tx.rawTransaction);
                    response = {
                        status: 'success',
                        transfer: true,
                        txHash: txHash,
                        trxHash: txHash?.transactionHash,
                        fromAddress: fromAddress,
                        transactionFee: Number((0, utils_1.fromDecimals)(Number(txHash?.effectiveGasPrice) * Number(txHash?.gasUsed), coinDocument?.decimal)),
                    };
                }
            }
            else if (networkDocument?.networkType === network_enum_1.NETWORKTYPEENUM.TRON) {
                fromAddress = process.env.TRON_HOT_WALLET;
                fromKey = process.env.TRON_HOT_WALLET_KEY;
                if (fromKey.slice(0, 2) === '0x')
                    fromKey = fromKey.slice(2);
                if (!coinDocument?.isToken) {
                    const amountInSun = utils_1.tronWeb.toSun(amount);
                    const tx = await utils_1.tronWeb.transactionBuilder.sendTrx(receiverAddress, amountInSun, fromAddress);
                    const signedTx = await utils_1.tronWeb.trx.sign(tx, fromKey);
                    const txHash = await utils_1.tronWeb.trx.sendRawTransaction(signedTx);
                    response = {
                        status: 'success',
                        transfer: true,
                        txHash: txHash?.txid,
                        trxHash: txHash?.txid,
                        fromAddress: fromAddress,
                    };
                }
                else {
                    const tronWebLocal = new TronWeb({
                        fullNode: utils_1.TRON_RPC,
                        solidityNode: utils_1.TRON_RPC,
                        eventServer: utils_1.TRON_RPC,
                        headers: { 'TRON-PRO-API-KEY': utils_1.TRONGRID_API_KEY },
                        privateKey: fromKey,
                    });
                    const contract = await tronWebLocal.contract(utils_1.abi?.token, coinDocument?.contractAddress);
                    const amountInDecimal = (0, utils_1.toDecimals)(amount, coinDocument?.decimal);
                    let receipt;
                    const tx = await contract.methods
                        .transfer(receiverAddress, amountInDecimal)
                        .send({
                        callValue: 0,
                        shouldPollResponse: true,
                    });
                    response = {
                        status: 'success',
                        transfer: true,
                        fromAddress: fromAddress,
                    };
                }
            }
            else if (networkDocument?.networkType === network_enum_1.NETWORKTYPEENUM.BTC) {
                fromAddress = process.env.BTC_HOT_WALLET;
                fromKey = process.env.BTC_HOT_WALLET_KEY;
                const amountInSatoshi = (0, utils_1.toSatoshi)(amount);
                const balance = await this.getBtcBalance(fromAddress, networkDocument);
                if (Number(balance?.balance) < Number(amount)) {
                    throw new Error('Insufficient balance');
                }
                const res = await fetch(`${networkDocument?.rpcUrl}/addrs/${fromAddress}?token=${utils_1.BITCOIN_TOKEN}`);
                if (res.status !== 200) {
                    throw new Error('Something went wrong');
                }
                const data = await res.json();
                const tx = new bitcoin.TransactionBuilder(utils_1.BITCOIN_NETWORK);
                const trxs = data?.txrefs;
                trxs?.forEach((txn) => {
                    console.log('txn', txn);
                    if (txn.tx_output_n >= 0) {
                        tx.addInput(txn.tx_hash, txn.tx_output_n);
                    }
                });
                try {
                    tx.addOutput(receiverAddress, amountInSatoshi);
                }
                catch {
                    throw new Error('Invalid Address');
                }
                try {
                }
                catch (error) {
                    console.log('error in btc fee');
                    console.log(error);
                }
                let txn_no = trxs?.filter((item) => item?.tx_output_n >= 0).length;
                const privateKey = utils_1.ECPair.fromWIF(fromKey, utils_1.BITCOIN_NETWORK);
                while (txn_no > 0) {
                    debugger;
                    tx.sign(txn_no - 1, privateKey);
                    txn_no--;
                }
                const tx_hex = tx.build().toHex();
                const txHash = await axios_1.default.post(`${networkDocument?.rpcUrl}/txs/push?token=${utils_1.BITCOIN_TOKEN}`, { tx: tx_hex });
                if (txHash.status !== 201) {
                    if (txHash.status === 409) {
                        debugger;
                        throw new Error('Please wait for the other transaction to be confirmed');
                    }
                    throw new Error('Something went wrong');
                }
                debugger;
                const txHashJson = await txHash.data;
                response = {
                    status: 'success',
                    transfer: true,
                    txHash: txHashJson,
                    trxHash: txHashJson?.tx?.hash,
                    fromAddress: fromAddress,
                };
            }
            return response;
        }
        catch (err) {
            console.log(err);
            if (err.message) {
                if (err.message.includes('409')) {
                    throw new Error('Please wait for the other transaction to be confirmed');
                }
            }
            throw new Error(err?.message);
        }
    }
    async getTransactions(transactionDTO) {
        try {
            let pagination = [];
            if (transactionDTO?.limit && transactionDTO?.offset) {
                pagination = [
                    { $skip: parseInt(transactionDTO.offset) },
                    { $limit: parseInt(transactionDTO.limit) },
                ];
            }
            let query = { userId: transactionDTO.userId };
            if (transactionDTO.type) {
                query['type'] = transactionDTO.type;
            }
            if (transactionDTO.status) {
                query['status'] = transactionDTO.status;
            }
            let transactions = await this._transactionModel.aggregate([
                {
                    $match: query,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $project: {
                                    _id: 0,
                                    id: '$_id',
                                    fullname: 1,
                                    email: 1,
                                },
                            },
                        ],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: '$user',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'coins',
                        localField: 'coinId',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $lookup: {
                                    from: 'networks',
                                    localField: 'networkId',
                                    foreignField: '_id',
                                    pipeline: [
                                        {
                                            $project: {
                                                _id: 0,
                                                id: '$_id',
                                                name: 1,
                                                symbol: 1,
                                                icon: 1,
                                            },
                                        },
                                    ],
                                    as: 'network',
                                },
                            },
                            {
                                $unwind: {
                                    path: '$network',
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    id: '$_id',
                                    name: 1,
                                    symbol: 1,
                                    icon: 1,
                                    network: 1,
                                },
                            },
                        ],
                        as: 'coin',
                    },
                },
                {
                    $unwind: {
                        path: '$coin',
                        preserveNullAndEmptyArrays: true,
                    },
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
                    $unwind: {
                        path: '$currency',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        id: '$_id',
                        userId: 1,
                        user: 1,
                        walletId: 1,
                        fromAddress: 1,
                        toAddress: 1,
                        coinId: 1,
                        coin: 1,
                        type: 1,
                        amount: 1,
                        swappedAmount: 1,
                        swappedPrice: 1,
                        trxHash: 1,
                        trxUrl: 1,
                        bankName: 1,
                        accountNumber: 1,
                        accountName: 1,
                        status: 1,
                        createdAt: 1,
                        currency: 1,
                    },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
                ...pagination,
            ]);
            return transactions;
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async getTransactionsByAdmin(transactionDTO) {
        try {
            let pagination = [];
            if (transactionDTO?.limit && transactionDTO?.offset) {
                pagination = [
                    { $skip: parseInt(transactionDTO.offset) },
                    { $limit: parseInt(transactionDTO.limit) },
                ];
            }
            let query = {};
            if (transactionDTO.type) {
                query['type'] = transactionDTO.type;
            }
            if (transactionDTO.status) {
                query['status'] = transactionDTO.status;
            }
            let transactions = await this._transactionModel.aggregate([
                {
                    $match: query,
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $project: {
                                    _id: 0,
                                    id: '$_id',
                                    fullname: 1,
                                    email: 1,
                                    bankName: 1,
                                    accountNumber: 1,
                                    accountName: 1,
                                },
                            },
                        ],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: '$user',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: 'coins',
                        localField: 'coinId',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $lookup: {
                                    from: 'networks',
                                    localField: 'networkId',
                                    foreignField: '_id',
                                    pipeline: [
                                        {
                                            $project: {
                                                _id: 0,
                                                id: '$_id',
                                                name: 1,
                                                symbol: 1,
                                                icon: 1,
                                            },
                                        },
                                    ],
                                    as: 'network',
                                },
                            },
                            {
                                $unwind: {
                                    path: '$network',
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    id: '$_id',
                                    name: 1,
                                    symbol: 1,
                                    icon: 1,
                                    network: 1,
                                },
                            },
                        ],
                        as: 'coin',
                    },
                },
                {
                    $unwind: {
                        path: '$coin',
                        preserveNullAndEmptyArrays: true,
                    },
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
                    $unwind: {
                        path: '$currency',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        id: '$_id',
                        userId: 1,
                        user: 1,
                        walletId: 1,
                        wallet: 1,
                        fromAddress: 1,
                        toAddress: 1,
                        coinId: 1,
                        coin: 1,
                        type: 1,
                        amount: 1,
                        balance: 1,
                        swappedAmount: 1,
                        swappedPrice: 1,
                        trxHash: 1,
                        trxUrl: 1,
                        bankName: 1,
                        accountNumber: 1,
                        accountName: 1,
                        status: 1,
                        createdAt: 1,
                        currency: 1,
                    },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
                ...pagination,
            ]);
            return transactions;
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async updateTransaction(updateTransactionDTO) {
        try {
            const transactionDocument = await this._transactionModel.findOne({
                _id: updateTransactionDTO.transactionId,
            });
            if (transactionDocument.type != transaction_enum_1.TRANSACTIONENUM.WITHDRAW_FIAT) {
                throw new Error('Not allowed');
            }
            if (transactionDocument.status != transaction_enum_1.TRANSACTIONSTATUSENUM.PENDING) {
                throw new Error('Transaction is already ' + transactionDocument.status);
            }
            const walletDocument = await this._walletModel.findOne({
                _id: transactionDocument.walletId,
            });
            let currentSwappedBalance = walletDocument.currentSwappedBalance;
            let totalWithdrawnAmount = walletDocument.totalWithdrawnAmount;
            let totalWithdrawnAmountLocked = walletDocument.totalWithdrawnAmountLocked;
            if (updateTransactionDTO.status === transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED) {
                totalWithdrawnAmount =
                    totalWithdrawnAmount + transactionDocument.amount;
                totalWithdrawnAmountLocked =
                    totalWithdrawnAmountLocked - transactionDocument.amount;
            }
            else if (updateTransactionDTO.status === transaction_enum_1.TRANSACTIONSTATUSENUM.REJECTED) {
                currentSwappedBalance =
                    currentSwappedBalance + transactionDocument.amount;
                totalWithdrawnAmountLocked =
                    totalWithdrawnAmountLocked - transactionDocument.amount;
            }
            await transactionDocument.updateOne({
                status: updateTransactionDTO.status,
                trxUrl: updateTransactionDTO.trxUrl,
            });
            await walletDocument.updateOne({
                currentSwappedBalance: currentSwappedBalance,
                totalWithdrawnAmount: totalWithdrawnAmount,
                totalWithdrawnAmountLocked: totalWithdrawnAmountLocked,
            });
            if (updateTransactionDTO.status === transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED) {
                let userDocument = await this._userModel.findOne({
                    _id: transactionDocument.userId,
                });
                const currency = await this._currencyModel.findOne({
                    _id: userDocument.currencyId,
                });
                const text = ` Your withdrawal of ${transactionDocument.amount} ${currency?.name} has been successfully processed from your Crypto Wallet account with fee amount of ${currency?.symbol} ${transactionDocument?.fee}. Please allow up to 20 minutes for the funds to reflect in your designated withdrawal account. For further information or inquiries, consult our FAQs. If you require immediate assistance, start a chat with us within the Crypto Wallet app.`;
                const res = await this.utilsService.sendEmail({
                    from: process.env.SENDER_MAIL,
                    to: [userDocument?.email],
                    subject: 'Withdrawal Request Processed',
                    text: text,
                });
            }
            return {
                message: 'success',
            };
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async getStats() {
        try {
            let date = new Date();
            date.setDate(date.getDate() - 7);
            const totalUsers = await this._userModel.count({
                isVerified: true,
                isDeleted: false,
            });
            const activeUsers = await this._userModel.count({
                isActive: true,
                isVerified: true,
                isDeleted: false,
            });
            const newUsers = await this._userModel.count({
                isActive: true,
                isVerified: true,
                isDeleted: false,
                createdAt: { $gt: date },
            });
            const withdrawsFiat = await this._transactionModel.count({
                type: transaction_enum_1.TRANSACTIONENUM.WITHDRAW_FIAT,
                status: transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED,
            });
            return {
                totalUsers,
                activeUsers,
                newUsers,
                withdrawsFiat,
            };
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async createStream() {
        try {
            await new Promise((resolve) => {
                setTimeout(resolve, 10000);
            });
            try {
                await moralis_1.default.start({
                    apiKey: process.env.MORALIS_API_KEY,
                });
            }
            catch (err) {
            }
            return 'OK';
        }
        catch (err) {
            console.log(err);
        }
    }
    async addAddressToStream(address) {
        try {
            await moralis_1.default.Streams.addAddress({ address, id: process.env.STREAM_ID });
            return { message: 'Address added to stream!' };
        }
        catch (err) {
            console.log(err);
            return { message: 'Error: Address added to stream!' };
        }
    }
    async moralisTransactionWebHook(transactionDto) {
        try {
            console.log('moralis event dto');
            console.log(transactionDto);
            debugger;
            if (!transactionDto.confirmed) {
                let chainId = parseInt(transactionDto.chainId);
                console.log(chainId);
                let networkDocument = await this._networkModel.findOne({
                    chainId: chainId,
                    networkType: network_enum_1.NETWORKTYPEENUM.EVM,
                    isDeleted: false,
                });
                console.log('networkDocument');
                console.log(networkDocument);
                if (networkDocument) {
                    const nativeTransactions = transactionDto.txs;
                    const tokenTransactions = transactionDto.erc20Transfers;
                    let fromAddress, toAddress, amountWei, hash;
                    let gas, gasPrice, receiptCumulativeGasUsed, receiptGasUsed, transactionFee, transactionFeeEth;
                    let walletDocument;
                    let coinDocument;
                    for await (const transaction of nativeTransactions) {
                        fromAddress = transaction?.fromAddress?.toLowerCase();
                        hash = transaction?.hash?.toLowerCase();
                        gasPrice = transaction.gasPrice;
                        gas = transaction.gas;
                        receiptCumulativeGasUsed = transaction.receiptCumulativeGasUsed;
                        receiptGasUsed = transaction.receiptGasUsed;
                        transactionFee = (Number(receiptGasUsed) * Number(gasPrice)).toString();
                        toAddress = transaction?.toAddress?.toLowerCase();
                        transactionFeeEth = Number(utils_1.web3.utils.fromWei(transactionFee, 'ether'));
                        coinDocument = await this._coinModel.findOne({
                            networkId: networkDocument.id,
                            isToken: false,
                            isDeleted: false,
                        });
                        console.log('coinDocument');
                        console.log(coinDocument);
                        const balanceDocument = await this._balanceModel.findOne({
                            address: toAddress,
                            networkId: networkDocument.id,
                            coinId: coinDocument.id,
                        });
                        if (coinDocument && balanceDocument) {
                            amountWei = transaction?.value;
                            console.log('balanceDocument');
                            console.log(balanceDocument);
                            const amount = Number(amountWei) / 10 ** coinDocument.decimal;
                            const balance = balanceDocument.balance + amount;
                            if (process.env.EVM_HOT_WALLET.toLocaleLowerCase() == fromAddress) {
                                continue;
                            }
                            const tranxObj = {
                                userId: balanceDocument.userId,
                                walletId: balanceDocument.walletId,
                                fromAddress: fromAddress,
                                toAddress: toAddress,
                                coinId: coinDocument.id,
                                type: transaction_enum_1.TRANSACTIONENUM.DEPOSIT,
                                fee: transactionFeeEth,
                                amount: amount,
                                balance: balance,
                                swappedAmount: null,
                                trxHash: hash,
                                status: transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED,
                            };
                            console.log('tranxObj');
                            console.log(tranxObj);
                            let transactionDocument = await new this._transactionModel(tranxObj).save();
                            const text = `Your deposit of ${amount} ${coinDocument.symbol} is now credited to your Crypto Wallet account. Log in to your Crypto Wallet app to view your updated balance. If you have any questions, please refer to our FAQs for assistance. For personalized support, feel free to initiate a chat with us directly through the app.`;
                            let userDocument = await this._userModel.findOne({
                                _id: balanceDocument.userId,
                            });
                            const res = await this.utilsService.sendEmail({
                                from: process.env.SENDER_MAIL,
                                to: [userDocument?.email],
                                subject: 'Deposit Successful',
                                text: text,
                            });
                        }
                        else {
                            console.log('else');
                            console.log('toAddress', toAddress);
                            console.log('networkId', networkDocument.id);
                            coinDocument = await this._coinModel.findOne({
                                contractAddress: toAddress,
                                networkId: networkDocument.id,
                                isToken: true,
                                isDeleted: false,
                            });
                            console.log('coinDocument');
                            console.log(coinDocument);
                            if (coinDocument) {
                                for await (const transactionToken of tokenTransactions) {
                                    if (transactionToken?.contract?.toLowerCase() ==
                                        transaction?.toAddress?.toLowerCase() &&
                                        hash == transactionToken?.transactionHash?.toLowerCase() &&
                                        fromAddress == transactionToken?.from?.toLowerCase()) {
                                        toAddress = transactionToken?.to?.toLowerCase();
                                        amountWei = transactionToken?.value;
                                        const balanceDocument = await this._balanceModel.findOne({
                                            address: toAddress,
                                            networkId: networkDocument.id,
                                            coinId: coinDocument.id,
                                        });
                                        console.log('balanceDocument');
                                        console.log(balanceDocument);
                                        if (balanceDocument) {
                                            const amount = Number(amountWei) / 10 ** coinDocument.decimal;
                                            const balance = balanceDocument.balance + amount;
                                            let transactionDocument = await new this._transactionModel({
                                                userId: balanceDocument.userId,
                                                walletId: balanceDocument.walletId,
                                                fromAddress: fromAddress,
                                                toAddress: toAddress,
                                                coinId: coinDocument.id,
                                                type: transaction_enum_1.TRANSACTIONENUM.DEPOSIT,
                                                amount: amount,
                                                fee: transactionFeeEth,
                                                balance: balance,
                                                swappedAmount: null,
                                                trxHash: hash,
                                                status: transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED,
                                            }).save();
                                            let userDocument = await this._userModel.findOne({
                                                _id: balanceDocument.userId,
                                            });
                                            const text = `Your deposit of ${amount} ${coinDocument.symbol} is now credited to your Crypto Wallet account. Log in to your Crypto Wallet app to view your updated balance. If you have any questions, please refer to our FAQs for assistance. For personalized support, feel free to initiate a chat with us directly through the app.`;
                                            const res = await this.utilsService.sendEmail({
                                                from: process.env.SENDER_MAIL,
                                                to: [userDocument?.email],
                                                subject: 'Deposit Successful',
                                                text: text,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return { message: 'Transaction successfully created!' };
        }
        catch (err) {
            throw new common_1.HttpException(err.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getBalance(walletAddress, coin, network, walletId, userId, i) {
        try {
            const userData = await this._userModel.findOne({
                _id: userId,
            });
            if (!userData) {
                throw new Error('User not found');
            }
            coin = JSON.parse(JSON.stringify(coin));
            const coinPrice = await this._coinPriceModel.findOne({
                coinId: coin?.id,
                currencyId: userData?.currencyId,
            });
            coin.price = coinPrice?.price;
            console.log('inner start', i);
            if (network?.networkType === network_enum_1.NETWORKTYPEENUM.EVM) {
                const web3 = new Web3(network?.rpcUrl);
                const isListening = await web3.eth.net.isListening();
                console.log(isListening);
                if (coin?.isToken) {
                    const contract = new web3.eth.Contract(utils_1.abi?.token, coin?.contractAddress);
                    const balance = await contract.methods
                        .balanceOf(walletAddress)
                        .call();
                    console.log('evm token balance', coin?.contractAddress, balance, coin.decimal);
                    const balanceInEth = Number((0, utils_1.fromWei)(balance.toString(), coin.decimal));
                    const balanceInUsd = balanceInEth * coin?.price;
                    console.log('inner end', i);
                    return {
                        balance: balanceInEth,
                        balanceInUsd: balanceInUsd,
                        error: false,
                        transactions: [],
                    };
                }
                else {
                    const balance = await web3.eth.getBalance(walletAddress);
                    const balanceInEth = Number(web3.utils.fromWei(balance, 'ether'));
                    const balanceInUsd = balanceInEth * coin?.price;
                    console.log('inner end', i);
                    return {
                        balance: balanceInEth,
                        balanceInUsd: balanceInUsd,
                        error: false,
                        transactions: [],
                    };
                }
            }
            else if (network?.networkType === network_enum_1.NETWORKTYPEENUM.TRON) {
                if (coin?.isToken) {
                    const contract = await utils_1.tronWeb.contract(utils_1.abi?.token, coin?.contractAddress);
                    utils_1.tronWeb.setAddress(walletAddress);
                    const balance = await contract.balanceOf(walletAddress).call();
                    const balanceInTrx = Number((0, utils_1.fromDecimals)(balance, coin?.decimal));
                    const balanceInUsd = balanceInTrx * coin?.price;
                    console.log('inner end', i);
                    return {
                        balance: balanceInTrx,
                        balanceInUsd: balanceInUsd,
                        error: false,
                        transactions: [],
                    };
                }
                else {
                    const balance = await utils_1.tronWeb.trx.getBalance(walletAddress);
                    const balanceInTrx = Number(utils_1.tronWeb.fromSun(balance));
                    const balanceInUsd = balanceInTrx * coin?.price;
                    console.log('inner end', i);
                    return {
                        balance: balanceInTrx,
                        balanceInUsd: balanceInUsd,
                        error: false,
                        transactions: [],
                    };
                }
            }
            else if (network?.networkType === network_enum_1.NETWORKTYPEENUM.BTC) {
                const res = await fetch(`${network?.rpcUrl}/addrs/${walletAddress}?token=${utils_1.BITCOIN_TOKEN}`);
                if (res.status !== 200) {
                    console.log('inner end', i);
                    return {
                        balance: 0,
                        balanceInUsd: 0,
                        error: true,
                        transactions: [],
                    };
                }
                const balance = await res.json();
                const balanceInBtc = (0, utils_1.fromSatoshi)(Number(balance?.balance));
                const balanceInUsd = balanceInBtc * coin?.price;
                const balanceObj = {
                    balance: balanceInBtc,
                    balanceInUsd: balanceInUsd,
                    error: false,
                    transactions: balance?.txrefs,
                };
                console.log('inner end', i);
                return balanceObj;
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    async updateBalance(userId, skipBitcoin = false) {
        try {
            let coinsData = await this._coinModel.find({
                isDeleted: false,
                isActive: true,
            });
            let walletDocument = await this._walletModel.findOne({ userId: userId });
            const userData = await this._userModel.findOne({
                _id: userId,
            });
            if (!userData) {
                throw new Error('User not found');
            }
            const currency = userData?.currencyId;
            let i = 0;
            let tronAddress;
            for await (let coinItem of coinsData) {
                coinItem = JSON.parse(JSON.stringify(coinItem));
                i++;
                let walletAddress;
                let networkDocument = await this._networkModel.findOne({
                    _id: coinItem.networkId,
                });
                if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.EVM) {
                    walletAddress = walletDocument.evmAddress;
                }
                else if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.TRON) {
                    walletAddress = walletDocument.tronAddress;
                    tronAddress = walletDocument.tronAddress;
                }
                else if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.BTC) {
                    walletAddress = walletDocument.btcAddress;
                }
                if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.BTC && skipBitcoin) {
                    continue;
                }
                const coinPrice = await this._coinPriceModel.findOne({
                    coinId: coinItem?.id,
                    currencyId: currency,
                });
                coinItem.price = coinPrice?.price;
                console.log('outer start', i);
                const balance = await this.getBalance(walletAddress, coinItem, networkDocument, walletDocument.id, walletDocument.userId, i);
                console.log('outer end', i);
                const balanceObj = {
                    balance: balance?.balance,
                    coinId: coinItem?.id,
                    walletId: walletDocument?.id,
                    address: walletAddress,
                    userId: userId,
                    networkId: networkDocument?.id,
                };
                try {
                    if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.TRON) {
                        if (coinItem.isToken) {
                            let configTronGrid = {
                                headers: {
                                    'TRON-PRO-API-KEY': utils_1.TRONGRID_API_KEY,
                                },
                            };
                            let resultTRC20 = await axios_1.default.get(utils_1.TRON_RPC + `/v1/accounts/${walletAddress}/transactions/trc20?limit=100&contract_address=${coinItem.contractAddress}`, configTronGrid);
                            if (resultTRC20?.data && resultTRC20?.data?.data && resultTRC20?.data?.data?.length > 0) {
                                for await (const trx of resultTRC20?.data?.data) {
                                    if (trx.to == walletAddress) {
                                        const valueInTrx = Number((0, utils_1.fromDecimals)(trx?.value, coinItem?.decimal));
                                        const tranxObj = {
                                            userId: userId,
                                            walletId: walletDocument.id,
                                            fromAddress: trx?.from,
                                            toAddress: walletAddress,
                                            coinId: coinItem.id,
                                            type: transaction_enum_1.TRANSACTIONENUM.DEPOSIT,
                                            amount: valueInTrx,
                                            swappedAmount: null,
                                            trxHash: trx?.transaction_id,
                                            balance: balance?.balance,
                                            status: transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED,
                                        };
                                        console.log('tron tranxObj');
                                        console.log(tranxObj);
                                        let existingTrx = await this._transactionModel.findOne({
                                            trxHash: tranxObj.trxHash,
                                        });
                                        if (!existingTrx) {
                                            let transactionDocument = await new this._transactionModel(tranxObj).save();
                                            const text = `Your deposit of ${valueInTrx} ${coinItem.symbol} is now credited to your Crypto Wallet account. Log in to your Crypto Wallet app to view your updated balance. If you have any questions, please refer to our FAQs for assistance. For personalized support, feel free to initiate a chat with us directly through the app.`;
                                            let userDocument = await this._userModel.findOne({
                                                _id: userId,
                                            });
                                            const res = await this.utilsService.sendEmail({
                                                from: process.env.SENDER_MAIL,
                                                to: [userDocument?.email],
                                                subject: 'Deposit Successful',
                                                text: text,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            let configTronScan = {
                                headers: {
                                    'TRON-PRO-API-KEY': utils_1.TRONSCAN_API_KEY,
                                },
                            };
                            let resultNative = await axios_1.default.get(utils_1.TRON_SCAN_URL +
                                `/api/transaction?sort=-timestamp&count=true&limit=20&start=0&address=${walletAddress}`, configTronScan);
                            if (resultNative?.data &&
                                resultNative?.data?.data &&
                                resultNative?.data?.data?.length > 0) {
                                for await (const trx of resultNative?.data?.data) {
                                    if (trx.toAddress == walletAddress) {
                                        const valueInTrx = Number((0, utils_1.fromDecimals)(trx?.amount, coinItem?.decimal));
                                        if (process.env.TRON_HOT_WALLET.toLocaleLowerCase() ==
                                            trx?.ownerAddress?.toLowerCase()) {
                                            continue;
                                        }
                                        const tranxObj = {
                                            userId: userId,
                                            walletId: walletDocument.id,
                                            fromAddress: trx?.ownerAddress,
                                            toAddress: trx?.toAddress,
                                            coinId: coinItem.id,
                                            type: transaction_enum_1.TRANSACTIONENUM.DEPOSIT,
                                            amount: valueInTrx,
                                            swappedAmount: null,
                                            trxHash: trx?.hash,
                                            balance: balance?.balance,
                                            status: transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED,
                                        };
                                        console.log('tron tranxObj');
                                        console.log(tranxObj);
                                        let existingTrx = await this._transactionModel.findOne({
                                            trxHash: tranxObj.trxHash,
                                        });
                                        if (!existingTrx) {
                                            let transactionDocument = await new this._transactionModel(tranxObj).save();
                                            const text = `Your deposit of ${valueInTrx} ${coinItem.symbol} is now credited to your Crypto Wallet account. Log in to your Crypto Wallet app to view your updated balance. If you have any questions, please refer to our FAQs for assistance. For personalized support, feel free to initiate a chat with us directly through the app.`;
                                            let userDocument = await this._userModel.findOne({
                                                _id: userId,
                                            });
                                            const res = await this.utilsService.sendEmail({
                                                from: process.env.SENDER_MAIL,
                                                to: [userDocument?.email],
                                                subject: 'Desposit Successful',
                                                text: text,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    console.log('error is tron transactions');
                    console.log(error?.message);
                }
                if (networkDocument.networkType == network_enum_1.NETWORKTYPEENUM.BTC) {
                    if (!balance || !balance.transactions || balance.error) {
                        continue;
                    }
                    else {
                        for await (const trxItem of balance?.transactions) {
                            const valueInBtc = (0, utils_1.fromSatoshi)(Number(trxItem?.value));
                            const tranxObj = {
                                userId: userId,
                                walletId: walletDocument.id,
                                fromAddress: null,
                                toAddress: walletAddress,
                                coinId: coinItem.id,
                                type: transaction_enum_1.TRANSACTIONENUM.DEPOSIT,
                                amount: valueInBtc,
                                swappedAmount: null,
                                trxHash: trxItem?.tx_hash,
                                balance: balance?.balance,
                                status: transaction_enum_1.TRANSACTIONSTATUSENUM.COMPLETED,
                            };
                            console.log('tranxObj');
                            console.log(tranxObj);
                            let existingTrx = await this._transactionModel.findOne({
                                trxHash: tranxObj.trxHash,
                            });
                            if (!existingTrx) {
                                let transactionDocument = await new this._transactionModel(tranxObj).save();
                                const text = `Your deposit of ${valueInBtc} ${coinItem.symbol} is now credited to your Crypto Wallet account. Log in to your Crypto Wallet app to view your updated balance. If you have any questions, please refer to our FAQs for assistance. For personalized support, feel free to initiate a chat with us directly through the app.`;
                                let userDocument = await this._userModel.findOne({
                                    _id: userId,
                                });
                                const res = await this.utilsService.sendEmail({
                                    from: process.env.SENDER_MAIL,
                                    to: [userDocument?.email],
                                    subject: 'Deposit Successful',
                                    text: text,
                                });
                            }
                        }
                    }
                }
                console.log(walletDocument?.id, coinItem?.id, balanceObj);
                await this._balanceModel.findOneAndUpdate({ walletId: walletDocument?.id, coinId: coinItem?.id }, balanceObj, { upsert: true });
            }
            const balanceDocuments = await this._balanceModel.find({
                userId: userId,
            });
            return balanceDocuments;
        }
        catch (err) {
            console.log(err);
        }
    }
    async updateBalanceForAllUsers() {
        try {
            cron.schedule('*/30 * * * *', async () => {
                console.log('cron job');
                const users = await this._userModel.find({});
                for await (const user of users) {
                    await this.updateBalance(user?.id, true);
                }
            });
            cron.schedule('*/10 * * * *', async () => {
                console.log('cron job reset');
                utils_1.masterWalletLocks.isBTCLocked = 0;
                utils_1.masterWalletLocks.isEVMLocked = 0;
                utils_1.masterWalletLocks.isTRONLocked = 0;
            });
        }
        catch (err) {
            console.log(err);
        }
    }
    async getNonce(address) {
        debugger;
        const web3 = new Web3('https://rpc.ankr.com/eth');
        const nonce = await web3.eth.getTransactionCount(address);
        const pending = await web3.eth.getTransactionCount(address, 'pending');
        return {
            nonce: Number(nonce),
            pending: Number(pending),
        };
    }
    async getFee() {
        try {
            const feeInfo = await this._feeInfoModel.find();
            return feeInfo;
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async setFee(setFeeDto) {
        try {
            if (setFeeDto?.feePercentage > 5) {
                throw new Error('Fee must be less than or equal to 5%');
            }
            await this._feeInfoModel.updateOne({
                feeName: setFeeDto?.feeName,
            }, { ...setFeeDto }, { upsert: true });
            return {
                message: 'success',
            };
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
    async sendNft(sendNftDto, user) {
        try {
            console.log('sendNftDto', sendNftDto);
            const networkDocument = await this._networkModel.findOne({
                _id: sendNftDto?.networkId,
            });
            if (!networkDocument) {
                throw new Error('Network not found');
            }
            if (networkDocument.networkType !== network_enum_1.NETWORKTYPEENUM.EVM) {
                throw new Error('Invalid network');
            }
            debugger;
            const userData = await this._userModel.findOne({
                _id: user.id,
            });
            debugger;
            if (!userData) {
                throw new Error('User not found');
            }
            debugger;
            const walletData = await this._walletModel.findOne({
                userId: userData.id,
            });
            if (!walletData) {
                throw new Error('Wallet not found');
            }
            debugger;
            const web3 = new Web3(networkDocument?.rpcUrl);
            debugger;
            const isValidAddress = await web3.utils.isAddress(sendNftDto?.toAddress);
            debugger;
            if (!isValidAddress) {
                throw new Error('Invalid address');
            }
            const fromAddress = walletData?.evmAddress;
            const fromPrivateKey = this.decryptData(walletData?.evmKey, process.env.ENCRYPTION_KEY);
            if (sendNftDto?.type === send_nft_dto_1.NftType.ERC721) {
                const contract = new web3.eth.Contract(utils_1.abi?.erc721, sendNftDto?.nftAddress);
                debugger;
                const ownerOf = await contract.methods.ownerOf(sendNftDto?.tokenId).call();
                debugger;
                if (ownerOf?.toLowerCase() !== fromAddress?.toLowerCase()) {
                    throw new Error('You are not the owner of this NFT');
                }
                debugger;
                let nonce = await web3.eth.getTransactionCount(fromAddress);
                debugger;
                let noncePending = await web3.eth.getTransactionCount(fromAddress, 'pending');
                debugger;
                while (noncePending !== nonce) {
                    console.log('waiting 10s for correct nonce...', Number(nonce), Number(noncePending));
                    await new Promise((resolve) => {
                        setTimeout(resolve, 10000);
                    });
                    nonce = await web3.eth.getTransactionCount(fromAddress);
                    noncePending = await web3.eth.getTransactionCount(fromAddress, 'pending');
                }
                debugger;
                let gasLimit = await contract.methods.transferFrom(fromAddress, sendNftDto?.toAddress, sendNftDto?.tokenId).estimateGas({
                    from: fromAddress,
                });
                debugger;
                let gasPrice = await web3.eth.getGasPrice();
                gasLimit = Math.floor(Number(gasLimit) * 1.2);
                gasPrice = Math.floor(Number(gasPrice) * 1.2);
                debugger;
                const tx = {
                    from: fromAddress,
                    to: sendNftDto?.nftAddress,
                    gas: gasLimit,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    data: contract.methods.transferFrom(fromAddress, sendNftDto?.toAddress, sendNftDto?.tokenId).encodeABI(),
                };
                const signedTx = await web3.eth.accounts.signTransaction(tx, fromPrivateKey);
                const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                console.log('receipt', receipt);
                await this._nftModel.updateOne({
                    contractAddress: sendNftDto?.nftAddress,
                    tokenId: sendNftDto?.tokenId,
                }, {
                    $set: {
                        ownerAddress: sendNftDto?.toAddress,
                    },
                });
                return {
                    message: 'success',
                };
            }
            else if (sendNftDto?.type === send_nft_dto_1.NftType.ERC1155) {
                const contract = new web3.eth.Contract(utils_1.abi?.erc1155, sendNftDto?.nftAddress);
                const balance = await contract.methods.balanceOf(fromAddress, sendNftDto?.tokenId).call();
                if (Number(balance) < sendNftDto?.amount) {
                    throw new Error('Insufficient balance');
                }
                let nonce = await web3.eth.getTransactionCount(fromAddress);
                let noncePending = await web3.eth.getTransactionCount(fromAddress, 'pending');
                while (noncePending !== nonce) {
                    console.log('waiting 10s for correct nonce...', Number(nonce), Number(noncePending));
                    await new Promise((resolve) => {
                        setTimeout(resolve, 10000);
                    });
                    nonce = await web3.eth.getTransactionCount(fromAddress);
                    noncePending = await web3.eth.getTransactionCount(fromAddress, 'pending');
                }
                let gasLimit = await contract.methods.safeTransferFrom(fromAddress, sendNftDto?.toAddress, sendNftDto?.tokenId, sendNftDto?.amount, '0x').estimateGas();
                let gasPrice = await web3.eth.getGasPrice();
                gasLimit = Math.floor(Number(gasLimit) * 1.2);
                gasPrice = Math.floor(Number(gasPrice) * 1.2);
                const tx = {
                    from: fromAddress,
                    to: sendNftDto?.nftAddress,
                    gas: gasLimit,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    data: contract.methods.safeTransferFrom(fromAddress, sendNftDto?.toAddress, sendNftDto?.tokenId, sendNftDto?.amount, '0x').encodeABI(),
                };
                const signedTx = await web3.eth.accounts.signTransaction(tx, fromPrivateKey);
                const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                console.log('receipt', receipt);
                await this._nftModel.updateOne({
                    contractAddress: sendNftDto?.nftAddress,
                    tokenId: sendNftDto?.tokenId,
                }, {
                    $set: {
                        ownerAddress: sendNftDto?.toAddress,
                    },
                });
                return {
                    message: 'success',
                };
            }
        }
        catch (err) {
            console.log(err);
            throw new common_1.BadRequestException(err?.message);
        }
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(wallet_schema_1.Wallet.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(network_schema_1.Network.name)),
    __param(3, (0, mongoose_1.InjectModel)(coin_schema_1.Coin.name)),
    __param(4, (0, mongoose_1.InjectModel)(balance_schema_1.Balance.name)),
    __param(5, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __param(6, (0, mongoose_1.InjectModel)(coin_price_schema_1.CoinPrice.name)),
    __param(7, (0, mongoose_1.InjectModel)(fee_info_schema_1.FeeInfo.name)),
    __param(8, (0, mongoose_1.InjectModel)(currency_schema_1.Currency.name)),
    __param(9, (0, mongoose_1.InjectModel)(nft_schema_1.NFT.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        utils_service_1.UtilsService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map